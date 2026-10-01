# Database Architecture

PostgreSQL هو مصدر الحقيقة للبيانات الدائمة. Drizzle ORM يربط schema المكتوب في TypeScript بالترحيلات، لكن SQL الناتج يجب أن يظل قابلًا للمراجعة.

## Connection strategy

- اتصال واحد طويل العمر عبر pool، لا اتصال جديد لكل request.
- حجم pool يحدد عبر environment ويُضبط حسب حدود مزود PostgreSQL.
- timeout وgraceful shutdown مطلوبان.
- production يحتاج مراقبة عدد الاتصالات ووقت الاستعلام.

## Query rules

- كل قائمة لها `limit` وcursor أو offset محدد.
- لا تُحمّل كل attempts أو questions إلى frontend.
- التجميع يتم داخل PostgreSQL.
- foreign keys وunique constraints جزء من schema لا من كود التطبيق فقط.