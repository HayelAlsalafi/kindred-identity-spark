# Changelog

## [0.2.0-foundation] — 2026-09-26

### Added

- React/Vite learner foundation with dashboard, topic map, practice entry, and admin boundary.
- OpenAPI endpoints for health, active topics, and dashboard summary.
- Drizzle `topics` table with status/order index.
- Five fictional CCNA topic records and a repeatable seed script.

### Changed

- Workspace documentation now reflects the implemented Phase 1 foundation.
- Generated API client and Zod schemas were refreshed from the OpenAPI contract.

### Fixed

- Replaced the starter placeholder screen with a live API-backed learner experience.

### Security

- No authentication or authorization was exposed; the admin screen is explicitly a non-privileged boundary placeholder.

### Database

- Development schema updated with `topics`; no question, user, or attempt tables yet.

### API

- Implemented `GET /api/healthz`, `GET /api/topics`, and `GET /api/dashboard/summary`.

### Documentation

- Updated project status, handover notes, architecture map, and setup guidance.

### Known Issues

- Progress and dashboard metrics are zero until questions and attempts exist.
- No automated product tests or production deployment yet.

## [0.1.0-architecture] — 2026-09-26

### Added

- وثائق Phase 0 لمنصة CCNA Learning SaaS.
- تصميم معماري مقترح للواجهة والخادم وقاعدة البيانات.
- نموذج بيانات أولي وعلاقات وفهارس مقترحة.
- تصميم authentication وauthorization.
- عقد REST API مخطط.
- استراتيجية الاختبار وقابلية التوسع والنشر المحمول.
- ADRs للمكدس، قاعدة البيانات، والمصادقة.

### Changed

- لا يوجد كود سابق لتغييره؛ مساحة العمل كانت فارغة.

### Fixed

- لا يوجد.

### Security

- توثيق ضوابط server-side authorization، Argon2id، sessions، والتحقق.

### Database

- تصميم PostgreSQL مقترح فقط؛ لا migrations منفذة.

### API

- عقد API مخطط فقط؛ لا endpoints منفذة.

### Documentation

- إنشاء حزمة docs الأولية و`PROJECT-STATUS.md` و`HANDOVER.md`.

### Known Issues

- لا توجد تطبيقات أو اختبارات قابلة للتشغيل حتى الآن.
- قرارات ADR ما زالت Proposed وتحتاج اعتمادًا قبل Phase 1.
## 2026-10-05 — Phase 3A — Question Domain Foundation
- Added `questions`, `question_options`, question enums, DB-generated immutable `question_code`.
- Migrations 0001, 0002. Domain validation + `createQuestion` service. `GET /api/questions/{id}` (learner, authenticated).
- Tests: 28 total (15 existing + 13 new). See PHASE-03A-CHECKPOINT.md.
