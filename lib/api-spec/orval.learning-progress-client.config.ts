import { defineConfig, type InputTransformerFn } from 'orval';
import path from 'node:path';

const progressOnly: InputTransformerFn = (document) => {
  const operation = document.paths?.['/learning/progress'];
  if (!operation) throw new Error('Required OpenAPI path is missing: /learning/progress');
  const schemas = Object.fromEntries(
    [
      'LearningProgressResponse',
      'LearningProgressSummary',
      'LearningTopicProgress',
      'ErrorResponse',
    ].map((name) => {
      const schema = document.components?.schemas?.[name];
      if (!schema) throw new Error('Required OpenAPI schema is missing: ' + name);
      return [name, schema] as const;
    }),
  );
  return {
    ...document,
    paths: { '/learning/progress': operation },
    components: { ...document.components, schemas },
  };
};

export default defineConfig({
  'learning-progress-client': {
    input: {
      target: path.resolve(__dirname, 'openapi.yaml'),
      override: { transformer: progressOnly },
    },
    output: {
      target: path.resolve(__dirname, '../api-client-react/src/learning-progress/api.ts'),
      client: 'react-query',
      mode: 'split',
      baseUrl: '/api',
      clean: false,
      override: {
        fetch: { includeHttpResponseReturnType: false },
        mutator: {
          path: path.resolve(__dirname, '../api-client-react/src/custom-fetch.ts'),
          name: 'customFetch',
        },
      },
    },
  },
});
