import { defineConfig, type InputTransformerFn } from "orval";
import path from "node:path";

// Additive generation: never clean or rewrite the existing generated folders.
const progressOnly: InputTransformerFn = (document) => {
  const operation = document.paths?.["/learning/progress"];
  if (!operation) throw new Error("Required OpenAPI path is missing: /learning/progress");
  return { ...document, paths: { "/learning/progress": operation } };
};

export default defineConfig({
  "learning-progress-zod": {
    input: {
      target: path.resolve(__dirname, "openapi.yaml"),
      override: { transformer: progressOnly },
    },
    output: {
      target: path.resolve(__dirname, "../api-zod/src/learning-progress/api.ts"),
      client: "zod",
      mode: "single",
      clean: false,
      override: { zod: { version: 3 } },
    },
  },
});
