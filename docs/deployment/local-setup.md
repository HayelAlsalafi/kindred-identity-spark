# Local Setup

المسار الحالي للمطور الجديد:

```bash
git clone <repository-url>
cd CCNA-SaaS
npm install
cp .env.example .env
# عدّل DATABASE_URL وقيم البيئة المحلية فقط
pnpm --filter @workspace/db run push
pnpm --filter @workspace/scripts run seed
pnpm --filter @workspace/api-server run dev
```

في طرفية أخرى:

```bash
pnpm --filter @workspace/ccna-learning run dev
pnpm run typecheck
pnpm run build
```

المتطلبات: Node.js 24، pnpm، PostgreSQL متاح محليًا أو عن بعد، وgit. لا يوجد test suite للميزات بعد.