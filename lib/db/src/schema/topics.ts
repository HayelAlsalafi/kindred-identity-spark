import { createInsertSchema } from "drizzle-zod";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const topicStatusEnum = pgEnum("topic_status", ["ACTIVE", "DISABLED"]);

export const topicsTable = pgTable(
  "topics",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 120 }).notNull().unique(),
    name: varchar("name", { length: 180 }).notNull(),
    description: text("description").notNull().default(""),
    displayOrder: integer("display_order").notNull().default(0),
    status: topicStatusEnum("status").notNull().default("ACTIVE"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    statusOrderIdx: index("topics_status_order_idx").on(
      table.status,
      table.displayOrder,
    ),
  }),
);

export const insertTopicSchema = createInsertSchema(topicsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTopic = z.infer<typeof insertTopicSchema>;
export type Topic = typeof topicsTable.$inferSelect;

/** Phase 3B-1: admin topic input validation (server-side). */
const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, digits and single hyphens.");

export const createTopicInputSchema = z.strictObject({
  slug: slugSchema,
  name: z.string().trim().min(1).max(180),
  description: z.string().trim().max(2000).default(""),
  displayOrder: z.number().int().min(0).max(100000).default(0),
  status: z.enum(topicStatusEnum.enumValues).default("ACTIVE"),
});

export const updateTopicInputSchema = z
  .strictObject({
    slug: slugSchema.optional(),
    name: z.string().trim().min(1).max(180).optional(),
    description: z.string().trim().max(2000).optional(),
    displayOrder: z.number().int().min(0).max(100000).optional(),
    status: z.enum(topicStatusEnum.enumValues).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "At least one field is required." });
