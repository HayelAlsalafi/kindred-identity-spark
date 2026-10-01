# ADR-003: Database-backed Session Authentication

- **Status:** Deferred — not implemented; provider review required
- **Date:** 2026-09-26

## Context

نحتاج authentication متعدد المستخدمين، لكن المنصة الحالية يجب أن تستخدم مزود auth مُدارًا عندما يكون متاحًا بدل بناء local auth غير مطلوب في foundation.

## Decision

لا يُنفذ هذا القرار حاليًا. قبل Phase 2 ستتم مراجعة Clerk/Replit-managed auth واختيار مسار مُدار متوافق مع المشروع. أي session أو role enforcement لاحق يجب أن يبقى server-side.

## Alternatives considered

- local password/session auth: يزيد نطاق الأمان والتشغيل، وليس مطلوبًا للـ foundation الحالية.
- Clerk/Replit-managed auth: يقلل كود credential handling، لكنه يعتمد على إعداد المزود وحدوده.

## Consequences

- لا توجد authentication capabilities قبل اعتماد provider وتنفيذها.
- يجب تحديث هذا ADR بقرار نهائي قبل إنشاء users أو admin routes.