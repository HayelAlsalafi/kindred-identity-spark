# Handover

## Project

- **Name:** CCNA Learning SaaS
- **Purpose:** منصة SaaS لتدريب أسئلة CCNA مع إدارة المحتوى، التمرين، المحاولات، والإحصاءات.
- **Version:** 0.2.0-foundation
- **Current phase:** Phase 1 — Project Foundation

## Technology

- **Frontend:** React + Vite + TypeScript
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL
- **ORM and validation:** Drizzle ORM + Zod
- **Authentication:** Database-backed sessions, Argon2id password hashing, secure HTTP-only cookies
- **Testing:** Vitest for unit/integration tests, Supertest for HTTP, Playwright for a small number of browser flows
- **Deployment:** Portable Node process plus PostgreSQL; Replit-specific details isolated in `deployment/replit.md`

لم تُثبت هذه التقنيات في كود بعد؛ هذا هو القرار المقترح في Phase 0.

## Current state

يوجد تطبيق learner وAPI وقاعدة بيانات topics وseed development. لا توجد بعد مصادقة أو أسئلة أو attempts أو اختبارات آلية لميزات المنتج. راجع [`PROJECT-STATUS.md`](./PROJECT-STATUS.md) للحالة الدقيقة.

## Database

المطبق حاليًا: `topics`. الجداول المقترحة لاحقًا: `users`, `roles`, `user_roles`, `sessions`, `questions`, `question_options`, `question_images`, `tags`, `question_tags`, `attempts`. التفاصيل في [`database/schema.md`](./database/schema.md).

## Development

أوامر التشغيل الحالية:

```bash
pnpm install
cp .env.example .env
pnpm --filter @workspace/db run push
pnpm --filter @workspace/scripts run seed
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/ccna-learning run dev
pnpm run typecheck
pnpm run build
```

هذه الأوامر مخطط لها وليست قابلة للتنفيذ بعد.

## Deployment

المتطلبات الحالية: Node.js 24، PostgreSQL، و`DATABASE_URL`. لا توجد عملية نشر منفذة. سيُحدد auth provider قبل المرحلة التالية.

## Security

- منع الوصول الإداري على الخادم، لا عبر إخفاء الأزرار فقط.
- عدم تخزين كلمات المرور أو الأسرار في المصدر.
- التحقق من payloads عبر Zod.
- منع mass assignment عبر DTOs صريحة.
- تسجيل آمن لا يحتوي كلمات مرور أو tokens.

## Next steps

1. مراجعة foundation الحالية.
2. اختيار وتنفيذ authentication provider.
3. إضافة users/roles وserver-side authorization.
4. إضافة question content model.
3. تحديث checkpoint وstatus بعد التحقق من الخادم والاختبارات الأساسية.

## Handover rule

أي فريق يستلم المشروع يجب أن يقرأ `PROJECT-STATUS.md` أولًا، ثم checkpoint الأخير، وألا يفترض أن تصميمًا موثقًا يعني أنه منفذ.