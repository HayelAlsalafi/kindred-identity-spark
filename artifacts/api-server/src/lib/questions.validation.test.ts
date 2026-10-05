import { describe, expect, it } from "vitest";
import { createQuestionInputSchema } from "@workspace/db/schema";

const base = {
  topicId: "f38bb39f-90a0-4528-8696-97a4bb83da6e",
  text: "Which layer does a router operate at?",
  type: "MULTIPLE_CHOICE_SINGLE",
  difficulty: "EASY",
  options: [
    { optionKey: "A", text: "Layer 2", isCorrect: false },
    { optionKey: "B", text: "Layer 3", isCorrect: true },
  ],
};

describe("question domain validation (Phase 3A)", () => {
  it("accepts a valid MULTIPLE_CHOICE_SINGLE question with defaults", () => {
    const r = createQuestionInputSchema.parse(base);
    expect(r.status).toBe("ACTIVE");
    expect(r.imageKey).toBeNull();
  });
  it("accepts ACTIVE and DISABLED status, rejects others", () => {
    expect(createQuestionInputSchema.safeParse({ ...base, status: "DISABLED" }).success).toBe(true);
    expect(createQuestionInputSchema.safeParse({ ...base, status: "DELETED" }).success).toBe(false);
  });
  it("rejects invalid difficulty", () => {
    expect(createQuestionInputSchema.safeParse({ ...base, difficulty: "EXPERT" }).success).toBe(false);
  });
  it("rejects unsupported question type", () => {
    expect(createQuestionInputSchema.safeParse({ ...base, type: "DRAG_AND_DROP" }).success).toBe(false);
  });
  it("rejects missing required fields and non-uuid topic", () => {
    expect(createQuestionInputSchema.safeParse({ ...base, text: "  " }).success).toBe(false);
    expect(createQuestionInputSchema.safeParse({ ...base, topicId: "abc" }).success).toBe(false);
  });
  it("requires exactly one correct option", () => {
    const none = base.options.map((o) => ({ ...o, isCorrect: false }));
    const two = base.options.map((o) => ({ ...o, isCorrect: true }));
    expect(createQuestionInputSchema.safeParse({ ...base, options: none }).success).toBe(false);
    expect(createQuestionInputSchema.safeParse({ ...base, options: two }).success).toBe(false);
  });
  it("rejects fewer than two options and duplicate keys", () => {
    expect(createQuestionInputSchema.safeParse({ ...base, options: [base.options[1]] }).success).toBe(false);
    const dup = [base.options[0], { ...base.options[1], optionKey: "a" }];
    expect(createQuestionInputSchema.safeParse({ ...base, options: dup }).success).toBe(false);
  });
});
