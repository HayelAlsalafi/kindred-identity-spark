# ADR-001: Portable TypeScript Web Stack

- **Status:** Proposed — pending user approval
- **Date:** 2026-09-26

## Context

المنتج SaaS ويب، يحتاج UI تفاعليًا، API واضحًا، PostgreSQL، توثيقًا محمولًا، وتشغيلًا اقتصاديًا في البداية.

## Decision

استخدام React + Vite + TypeScript للواجهة، Node.js + Express + TypeScript للخادم، PostgreSQL كقاعدة بيانات، Drizzle ORM للوصول المنظم، وZod للتحقق ومشاركة العقود.

## Alternatives considered

- Next.js full-stack: قوي، لكنه يخلط حدود frontend/backend أكثر مما نحتاجه في أول بناء.
- Python/Django: خيار صالح، لكن فريق المشروع المتوقع يستفيد من TypeScript end-to-end وعقود مشتركة.
- MongoDB: أقل ملاءمة لعلاقات users/topics/questions/attempts والقيود التاريخية.

## Consequences

- حدود واضحة بين client وserver.
- codebase type-safe من الطرفين.
- PostgreSQL محمول إلى مزودين متعددين.
- يحتاج إعداد tooling أكثر من prototype بسيط.

## Future considerations

لا ننتقل إلى microservices أو queue قبل قياس فعلي يبرر ذلك.