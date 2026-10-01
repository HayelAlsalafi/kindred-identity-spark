# Authentication Architecture

## Proposed MVP

1. يسجل المستخدم بالبريد وكلمة المرور.
2. تُفحص المدخلات عبر Zod.
3. تُخزن كلمة المرور كـ Argon2id hash مع parameters موثقة في configuration.
4. ينشئ الخادم session عشوائية، ويخزن hash الجلسة في جدول `sessions`.
5. يعيد cookie باسم غير كاشف، `HttpOnly`, `SameSite=Lax`, و`Secure` في production.
6. كل طلب محمي يبحث عن الجلسة المخزنة ويحمّل المستخدم.
7. تسجيل الخروج يحذف الجلسة من قاعدة البيانات ويمسح cookie.

## Future-ready boundaries

التصميم يسمح لاحقًا بإضافة email verification، password reset، 2FA، account lockout، ومزود OAuth دون ربط واجهة التطبيق بآلية واحدة.

## Important constraints

- لا hard-code لبريد admin.
- لا تخزين session في ذاكرة العملية.
- لا إعادة كلمة المرور أو hash في API response.
- session expiry وrotation يجب أن تكونا صريحتين.