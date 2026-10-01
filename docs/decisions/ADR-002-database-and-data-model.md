# ADR-002: Relational PostgreSQL Data Model

- **Status:** Proposed — pending user approval
- **Date:** 2026-09-26

## Context

المحتوى منظم بعلاقات واضحة، والمحاولات تاريخية غير قابلة للاستبدال، والإحصاءات تحتاج aggregations قابلة للفهرسة.

## Decision

PostgreSQL مع جداول normalized وforeign keys وunique constraints وفهارس مدروسة. تُشتق الإحصاءات من attempts بدل تخزين counters مكررة في MVP.

## Alternatives considered

- تخزين JSON لكل سؤال: أسرع للبدء لكنه يصعّب integrity والبحث والتحليلات.
- counters محدثة مع كل attempt: أسرع للقراءة أحيانًا، لكنها تضيف تعقيد consistency قبل الحاجة.

## Consequences

- integrity تاريخية أفضل واستعلامات aggregation مباشرة.
- يلزم pagination وquery optimization مع نمو attempts.
- يمكن إضافة materialized/reporting tables لاحقًا بناءً على القياس.