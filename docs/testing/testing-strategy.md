# Testing Strategy

لا توجد اختبارات منفذة بعد.

## Test layers

### Unit

تختبر pure business rules مثل:

- تصحيح single-choice.
- حساب duration من timestamps.
- validation لنموذج question.
- حساب نسب الإحصاءات مع حالات الصفر.

### Integration

مع PostgreSQL اختبار:

- registration/login/logout.
- role checks.
- topic/question CRUD.
- attempt insertion وعدم تعديل التاريخ.
- aggregation statistics.

### HTTP

Supertest أو بديل محلي يختبر status codes، response shapes، ورفض المدخلات غير الصالحة.

### E2E

عدد محدود عبر Playwright:

- login ثم اختيار topic ثم إرسال إجابة.
- admin ينشئ topic/question.
- user يحاول route إداري ويحصل على 403.

## Minimum acceptance coverage

Authentication، authorization، topic creation، question creation/edit/retrieval، answer grading، timestamps/duration، attempt recording، user statistics، admin restrictions.

## Test discipline

- لا ندعي اختبارًا لم يُشغل.
- الاختبارات لا تستخدم أسئلة copyrighted.
- database tests تستخدم fixture/seed معزولًا.
- كل bug مثبت يضاف له regression test.
## Implemented tests (Phase 2)

- `artifacts/api-server/src/middlewares/auth.test.ts` — authentication and authorization middleware
  (Clerk `getAuth` and DB mocked at the boundary; real middleware logic).
- `artifacts/api-server/src/lib/env.test.ts` — startup environment validation.
- Run: `pnpm --filter @workspace/api-server test` (15 tests).
- Not yet: HTTP-level tests against a real Clerk instance, browser E2E.
