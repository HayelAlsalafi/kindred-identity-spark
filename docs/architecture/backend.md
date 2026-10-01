# Backend Architecture

## Planned structure

```text
src/server/
├── app.ts
├── server.ts
├── middleware/
├── routes/
├── services/
├── repositories/
├── policies/
├── schemas/
├── auth/
├── storage/
└── observability/
```

## Request flow

```text
route
  -> authentication (when required)
  -> authorization policy
  -> request schema validation
  -> application service
  -> repository
  -> PostgreSQL
  -> response DTO
```

الـ route ينسق الطلب فقط. قواعد الأعمال مثل تصحيح الإجابة وإنشاء المحاولة تبقى في services، وتفاصيل SQL تبقى في repositories.

## Error handling

سيستخدم API envelope ثابتًا للأخطاء مع `code`, `message`, و`details` آمنة. الأخطاء الداخلية تُسجل بمعرف request ولا تُعاد بتفاصيل البنية التحتية.

## Logging

سيكون logging structured إلى stdout. يمنع تسجيل كلمات المرور، session IDs، cookies، tokens، ونصوص حساسة غير لازمة.