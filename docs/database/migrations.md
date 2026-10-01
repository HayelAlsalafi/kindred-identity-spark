# Migrations

لا توجد migration files versioned بعد. في Phase 1 استُخدم `drizzle-kit push` لتطبيق جدول `topics` على development database. قبل production يجب اعتماد workflow migrations versioned.

## Planned workflow

```bash
npm run db:generate
npm run db:migrate
npm run db:status
```

الأمر الفعلي الحالي لتطبيق schema هو:

```bash
pnpm --filter @workspace/db run push
```

يجب مراجعة migration الناتجة قبل تطبيقها، وعدم تعديل migration مطبقة في بيئة مشتركة. التغييرات اللاحقة تأتي في migration جديدة.

## Production rule

تشغل migrations كخطوة release منفصلة قبل تشغيل نسخة التطبيق التي تعتمد schema الجديدة، مع backup وخطة rollback مناسبة.