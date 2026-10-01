# Frontend Architecture

## Planned structure

```text
src/client/
├── app/
├── components/
├── features/
│   ├── auth/
│   ├── practice/
│   ├── topics/
│   └── admin/
├── lib/
├── pages/
└── styles/
```

سيستخدم frontend React مع TypeScript وVite. صفحات التطبيق تستدعي طبقة API client، ولا تتعامل مباشرة مع Drizzle أو PostgreSQL.

## Initial screens

- Login / registration
- Topic list
- Practice question
- Attempt result
- User statistics
- Admin overview
- Admin topics
- Admin questions
- Admin users

## UX constraints

- responsive desktop-first
- keyboard-accessible answer selection
- حالات loading/error/empty واضحة
- لا تعرض الصفحة كامل بنك الأسئلة
- timer للعرض فقط؛ المدة authoritative من timestamps الخادم
- عناصر النص قابلة للتوطين لاحقًا عبر مفاتيح، دون بناء ترجمة عربية كاملة في MVP