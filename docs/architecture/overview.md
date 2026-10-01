# Architecture Overview

## Goal

بناء تطبيق ويب منظم يفصل العرض عن API وقواعد العمل والوصول إلى البيانات، مع إبقاء النشر ممكنًا خارج Replit.

## Proposed runtime

```text
Browser
  |
  v
React/Vite client
  |
  v
Express REST API (/api/v1)
  |
  +--> Authentication/session middleware
  +--> Authorization policy
  +--> Zod validation
  +--> Application services
  +--> Repository/data-access layer
          |
          v
      PostgreSQL

Question image abstraction --> local development storage or object storage adapter
```

في البداية يمكن تشغيل client وserver من عملية Node واحدة أو عمليتين محليًا، لكن لا تعتمد قواعد العمل على ذاكرة العملية.

## Boundaries

- `client`: صفحات React، مكونات العرض، وإدارة حالة الطلبات.
- `server`: routes وmiddleware والخدمات والسياسات.
- `shared`: أنواع DTOs وenums ومخططات Zod القابلة للمشاركة دون ربط بقاعدة البيانات.
- `database`: schema وmigrations وseed.
- `tests`: اختبارات unit/integration/e2e.
- `docs`: وثائق قابلة للتسليم.

## Principles

1. التطبيق stateless بقدر عملي؛ الحالة الدائمة في PostgreSQL أو مخزن الملفات.
2. لا يوضع SQL داخل مكونات React.
3. لا تُحسب صلاحية الإجابة من frontend.
4. كل قائمة إدارية لها pagination وfiltering.
5. كل استعلام يعيد الحقول اللازمة فقط.
6. الإحصاءات مشتقة من `attempts` عبر aggregation queries.
7. question types extensible عبر discriminator، مع تنفيذ single-choice فقط في MVP.
8. لا نضيف Redis أو queue أو microservices قبل قياس الحاجة.

## Non-goals for Phase 0

لا يوجد تنفيذ للتطبيق، ولا billing، ولا multi-tenancy، ولا استيراد جماعي، ولا full localization.