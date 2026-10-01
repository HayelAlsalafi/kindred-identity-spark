# Replit Deployment Notes

Replit هو بيئة تطوير/استضافة ممكنة، لكنه ليس جزءًا من منطق التطبيق.

## Replit-specific items

- تخزين `DATABASE_URL` و`SESSION_SECRET` في Secrets.
- تشغيل أمر npm الموثق في `package.json`.
- ضبط port الذي يستمع عليه الخادم على `0.0.0.0`.
- استخدام خدمة PostgreSQL متوافقة بدل الاعتماد على filesystem مؤقت للبيانات.

## Limitations to document later

- lifecycle وsleep حسب الخطة الحالية.
- حدود الموارد والاتصالات.
- عدم اعتبار local disk مكانًا دائمًا لصور الإنتاج.

كل ما سبق يحتاج تحققًا من إعداد Replit الفعلي عند تنفيذ deployment؛ لا توجد عملية نشر حالية.