# Backup and Recovery

## Current status

لا يوجد backup system منفذ.

## Data to protect

- PostgreSQL records، خصوصًا users وquestions وattempts.
- question images عند تفعيلها.
- migration history والـ configuration غير السرية.

## Planned strategy

- PostgreSQL managed backups أو `pg_dump` مجدول حسب بيئة التشغيل.
- تخزين النسخ خارج نفس host مع retention موثق.
- نسخ object storage أو versioning للصور.
- اختبار restore دوريًا، لا الاكتفاء بنجاح backup.

## Recovery outline

1. إيقاف الكتابات أو توجيهها إلى maintenance mode.
2. تحديد آخر backup صالح وهدف recovery point.
3. استعادة PostgreSQL والتحقق من migrations/constraints.
4. استعادة media references أو objects.
5. تشغيل health checks وsmoke tests.
6. إعادة فتح traffic وتوثيق فقدان البيانات إن وجد.

## Failure behavior

تعطل application process لا يفقد البيانات الدائمة. تعطل database يجب أن ينتج error response آمنًا ويسجل failure؛ availability الفعلية تعتمد على deployment/database provider ولم تُختبر بعد.