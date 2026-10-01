# Error Handling

## Policy

- أخطاء validation تعيد `400` مع field-level details آمنة.
- عدم المصادقة يعيد `401`.
- عدم الصلاحية يعيد `403`.
- سجل غير موجود يعيد `404`.
- تعارض business rule يعيد `409`.
- خطأ غير متوقع يعيد `500` مع request ID فقط.

## Graceful failure

واجهة المستخدم تعرض رسالة قابلة للفهم وتخرج من loading state عند فشل API. تعطل تحميل صورة لا يمنع قراءة السؤال. تعطل قاعدة البيانات يعيد error response مناسبًا ويسجل الخلل دون كشف credentials أو بنية داخلية.