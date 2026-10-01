# Seed Data

يوجد seed development صغير في `scripts/src/seed.ts`، ويحتوي على:

- خمسة topics تقريبية.
- لا توجد users أو questions بعد؛ لذلك لا يُنشئ seed حسابات أو أسئلة.

التشغيل idempotent عبر `onConflictDoNothing`. لا تُضاف مئات الأسئلة تلقائيًا.