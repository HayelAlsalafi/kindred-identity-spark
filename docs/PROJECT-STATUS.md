# Project Status

## Project

- **Name:** CCNA Learning SaaS
- **Version:** 0.2.0-foundation
- **Current phase:** Phase 1 — Project Foundation
- **Current milestone:** تشغيل learner foundation مع API وPostgreSQL
- **Overall completion:** foundation منفذة؛ ميزات التعلم والإدارة الأساسية لم تُنفذ بعد.

## Completed

- تقييم أن مساحة العمل الحالية فارغة.
- تعريف نطاق MVP الأولي ومنع التوسع المبكر.
- اقتراح مكدس تقني محمول.
- تصميم أولي لنموذج البيانات والعلاقات.
- تصميم authentication وauthorization.
- تعريف حدود REST API المخططة.
- تعريف هيكل لوحة الإدارة.
- تعريف استراتيجية الاختبار وقابلية التوسع.
- إنشاء حزمة وثائق Phase 0.
- إنشاء تطبيق React/Vite قابل للتشغيل.
- إنشاء OpenAPI contract للـ health/topics/dashboard.
- توليد React Query hooks وZod schemas.
- إنشاء جدول `topics` وفهرس الحالة/الترتيب.
- إضافة API routes حقيقية للموضوعات وملخص dashboard.
- إضافة خمس موضوعات demo في PostgreSQL وseed script قابل للتكرار.
- إضافة learner dashboard وtopic map وpractice entry وadmin boundary.
- التحقق من typecheck وAPI عبر proxy وواجهة preview.

## Partially completed

- `topics` هو الجزء المنفذ من schema؛ بقية النموذج ما زال مخططًا.
- الإحصاءات المعروضة foundation aggregates بقيم صفرية لأن questions وattempts لم تُنفذ.
- الجلسات والمصادقة غير منفذة؛ admin route حاليًا boundary بصري فقط.

## Not implemented

- Authentication
- Authorization
- Questions and question options
- Admin dashboard actions
- Practice engine
- Attempts and statistics
- Image upload/storage
- Automated application tests
- Deployment configuration
- Production observability

## Known bugs and limitations

- لا توجد اختبارات آلية لميزات المنتج بعد؛ الموجود تحقق typecheck وsmoke checks يدوي.
- لا يوجد question content حقيقي؛ البيانات الحالية topics تجريبية فقط.
- أرقام السعة والأداء غير معروفة وتحتاج قياسات فعلية.

## Technical debt

- لا يوجد دين كودي معروف في foundation.
- endpoint response fields الخاصة بالتقدم ستحتاج ربطها بـ attempts بدل القيم الصفرية.

## Current database status

- PostgreSQL development متصل.
- جدول `topics` مطبق عبر Drizzle push، مع index على `(status, display_order)`.
- seed script موجود في `scripts/src/seed.ts` وقد أضيفت 5 topics demo.
- بقية الجداول المقترحة لم تُطبق.

## Current API status

- `GET /api/healthz` منفذ.
- `GET /api/topics` منفذ ويقرأ active topics من PostgreSQL.
- `GET /api/dashboard/summary` منفذ ويعيد foundation summary.
- العقد والمخططات المولدة في [`api/README.md`](./api/README.md) و`lib/api-spec/openapi.yaml`.

## Current authentication status

- لا يوجد تسجيل دخول منفذ.
- admin route لا يمنح صلاحية؛ هو placeholder بصري فقط.
- قرار مزود authentication سيُحسم عند Phase 2 قبل بناء أي حسابات.

## Current testing status

- `pnpm run typecheck` نجح.
- تم فحص health/topics/dashboard عبر proxy.
- تم فحص preview بصريًا عند desktop.
- لم تُنفذ اختبارات آلية أو E2E بعد.

## Current deployment status

- لا يوجد deployment منشور.
- workflow الخاص بالـ API والواجهة يعمل محليًا داخل المشروع.
- متطلبات النقل بين Replit وبيئات أخرى موثقة في `deployment/`.

## Environment requirements

يلزم Node.js 24/TypeScript 5.9 حسب workspace، PostgreSQL، وملف `.env` مبني على `.env.example`.

## Last completed task

تنفيذ Phase 1 Foundation والتحقق من API والواجهة.

## Current task

توسيع foundation إلى Phase 2: database entities للمستخدمين/questions/attempts مع authentication معتمد.

## Exact next task

قبل تنفيذ auth، مراجعة قرار Clerk/Replit-managed auth ثم إنشاء users/roles وserver-side authorization.

## Recommended next development step

الانتقال إلى Phase 2 فقط بعد مراجعة foundation، مع إبقاء question engine خارج هذا checkpoint.