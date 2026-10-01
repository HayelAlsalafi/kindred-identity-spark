# CCNA Learning SaaS Documentation

هذه الوثائق هي مصدر الحقيقة الهندسي لمنصة تدريب أسئلة CCNA. صُممت لتسمح لفريق آخر بتنزيل المصدر، إعداد البيئة، فهم القرارات، ومتابعة التطوير دون الاعتماد على سياق هذه المحادثة.

## الحالة الحالية

- **المرحلة:** Phase 0 — Discovery & Architecture
- **حالة التنفيذ:** المشروع فارغ، ولم يُنشأ تطبيق أو قاعدة بيانات أو API بعد.
- **القرار التالي:** مراجعة واعتماد هذه الوثائق قبل بدء Phase 1.

ابدأ بقراءة:

1. [`PROJECT-STATUS.md`](./PROJECT-STATUS.md)
2. [`HANDOVER.md`](./HANDOVER.md)
3. [`architecture/overview.md`](./architecture/overview.md)
4. [`decisions/ADR-001-technology-stack.md`](./decisions/ADR-001-technology-stack.md)
5. [`development-log/checkpoints/PHASE-00-CHECKPOINT.md`](./development-log/checkpoints/PHASE-00-CHECKPOINT.md)

## أقسام الوثائق

| القسم | الغرض |
| --- | --- |
| `architecture/` | بنية النظام، تدفق البيانات، الأمان، وقابلية التوسع |
| `database/` | نموذج البيانات والعلاقات والفهارس والترحيلات |
| `api/` | العقد المخطط للـ REST API؛ سيُحدّث فقط مع وجود تنفيذ فعلي |
| `security/` | نموذج التهديدات والضوابط الأمنية |
| `deployment/` | الإعداد المحلي، Replit، والنشر المحمول |
| `testing/` | استراتيجية الاختبار واختبارات الحمل المستقبلية |
| `operations/` | النسخ الاحتياطي والتعافي |
| `decisions/` | Architecture Decision Records |
| `development-log/` | سجل التغييرات ونقاط التسليم |

## قاعدة التوثيق

كل تغيير مؤثر في الكود يجب أن يتزامن مع تحديث الاختبارات والوثائق و`PROJECT-STATUS.md`. لا تُوثق ميزة على أنها مكتملة قبل تنفيذها والتحقق منها.