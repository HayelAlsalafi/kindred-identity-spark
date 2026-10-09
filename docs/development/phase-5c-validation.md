# Phase 5C.5A / 5C.5A-Fix — Final Validation & Git Audit

آخر تحقق: 2026-10-09. النطاق: مراجعة 5C.1–5C.4، ثم إصلاح ملاحظات التدقيق المحددة بموافقة المستخدم فقط.

**القرار: جاهز للانتقال إلى 5C.5B لتجهيز تغييرات Git ومراجعتها بعد موافقة مستقلة.** عولجت أخطاء إعدادات Orval، وعزل حالة Practice، وفقد دقة Cursor المثبت بالاختبار، وأضيفت فحوص الواجهة والإعدادات إلى CI. هذا لا يعني تنفيذ Commit/Push/PR أو اعتماد الدمج دون مراجعة القيود: اختبارات PostgreSQL المعزولة والتحقق الحي من تبديل حساب Clerk لم يُنفّذا، ويجب تشغيل الفحوص الرسمية في worktree نظيف قبل اعتماد PR.

## ملخص التنفيذ

- **5C.1:** وثيقة المقاييس وعقد GET /api/learning/progress. التاريخ مستقل عن الكتالوج الحالي: التكرار يزيد المحاولات فقط، الدقة من is_correct المحفوظ، والتغطية لأي سؤال متاح حُاول سابقًا. الصفر يعيد نسبًا صفرية، والنقل ينقل التغطية الحالية فقط.
- **5C.2:** مسار Express محمي بـrequireAuthenticatedUser، ويأخذ req.dbUser.id فقط. تجميع PostgreSQL بمعاملات مربوطة في SELECT واحدة يضمن snapshot متسقًا ويمنع تضاعف الأسئلة بسبب joins. كل استجابات Progress تحمل private, no-store.
- **5C.3:** Dashboard وTopic Map يستخدمان Progress للمقاييس؛ كتالوج المواضيع للأسماء/الوصف/التنقل فقط. أُخفيت الأوقات وstreak والنشاط الوهمي. Queries تنتظر Clerk وتُعزل بالمستخدم والجلسة. Submit الناجح يبطل تقدم الجلسة التي قدمت الإجابة؛ الفشل لا يغير الإحصائيات.
- **5C.4:** History يطلب includeDetails=true؛ questionCode من questionId، وtopicName من topicId المحفوظ في المحاولة. LEFT JOIN بلا تصفية حالة يحافظ على التاريخ عند التعطيل والنقل. الاستجابة الافتراضية القديمة محفوظة، والتفاصيل اختيارية/nullable، ولا تُرسل إجابة صحيحة أو تفسير. حالات فقد التفاصيل لا تخفي المحاولة.

المستخدم أكد يدويًا: **4 محاولات، 3 صحيحة، دقة 75%، سؤال فريد واحد**؛ Topic Map متوافق، وHistory يعرض أسماء المواضيع وأكواد الأسئلة. هذا دليل المستخدم، وليس نتيجة قراءة جديدة للقاعدة في هذا التدقيق. لم يُشغّل التطبيق أو تُستدعَ endpoints حقيقية أو يُتصل بـNeon.


## المشكلات المثبتة والإصلاحات

### 1. إعدادات Orval

التدقيق السابق كشف تسعة أخطاء في الإعدادات الإضافية الثلاثة: ثلاثة TS18048 لأن document.paths اختياري؛ اثنان TS2322 لأن map المخططات يسمح بـundefined؛ أربعة TS2353 لأن output.prettier غير مدعوم في Orval 8.30.0. فحص الإعداد العام أيضًا كشف استخدامين إضافيين للخيار غير المدعوم نفسه.

- تحقق صريح من وجود المسار والمخططات المطلوبة، مع رسائل أسماء فقط وfail-fast عند غيابها، بدل assertions تخفي الخطأ.
- حُذف prettier:false من الإعدادات الإضافية؛ بقي clean=false. الإعداد العام يستخدم formatter: "prettier" بدل prettier:true، مع الحفاظ على سلوكه الآخر.
- أضيف tsconfig.codegen.json لفحص إعدادات Orval الأربعة. يستخدم @types/node المثبت ضمن API workspace، دون تعديل dependencies أو lockfile.
- جميع الإعدادات الأربعة تجتاز TypeScript الآن؛ CI يفحصها بأمر pnpm exec tsc -p lib/api-spec/tsconfig.codegen.json.
- لم يُشغّل الإعداد العام ذي clean=true. لا تشغيل clean فوق الملفات القديمة.

### 2. عزل Practice بين المستخدمين والجلسات

المشكلة المثبتة في الكود القديم: selectedOption/result وحالة Mutation بقيت داخل Workspace نفسه دون key للهوية، وonSuccess لم يتحقق من الجلسة التي بدأت Submit.

- PracticeWorkspace يشتق الهوية المكتملة من Clerk، ويعرض PracticeSession بمفتاح يجمع userId وsessionId. تبديل المستخدم أو الجلسة أو الخروج يعيد إنشاء كل الحالة المحلية: الاختيار والنتيجة والطلب الجاري وحالة السؤال.
- query السؤال مرتبط بالهوية والجلسة، enabled بعد اكتمالهما فقط، دون placeholder من جلسة سابقة وgcTime=0.
- الحارس practiceResultHandler يتحقق من الهوية الحالية ومن بقاء Session mounted، ويهمل الرد المتأخر للحساب/الجلسة السابقة حتى لو عاد الحساب القديم لاحقًا.
- تسعة اختبارات وحدات تغطي مفاتيح remount، الفصل بين الحسابات والجلسات، قبول الرد الحالي، ورفض الردود المتأخرة أو بعد الخروج/unmount. تثبت سلوك المفتاح والحارس، وليست اختبار DOM حيًا لتبديل Clerk؛ التحقق اليدوي ما زال مطلوبًا.
- لم يتغير منطق التصحيح أو حفظ المحاولات أو هوية المستخدم على الخادم.

### 3. Pagination ودقة timestamps

ثبتت المشكلة قبل الإصلاح باختبار يستخدم mapper الحقيقي من Drizzle pg-proxy ومحاكي تنفيذ يقارن microseconds: خمسة صفوف ضمن/حول millisecond نفسها، ومنها صفان بتوقيت متطابق وUUID مختلف؛ النسخة القديمة أعادت ثلاثة فقط وتجاوزت صفين. كانت النتيجة قبل الإصلاح فشل اختبار الانحدار ونجاح الستة الأخرى.

- يحفظ Cursor التوقيت الأصلي بست خانات كسرية من PostgreSQL عبر to_char وUTC؛ لا يمر حد المقارنة عبر JavaScript Date.
- حد التوقيت SQL مربوط كمعامل ثم cast إلى timestamptz، ويظل الفرز submitted_at DESC ثم id DESC والحد limit+1 كما كان.
- يقبل decoder الصيغة القديمة بثلاث خانات والصيغة الجديدة بست خانات، ويرفض التواريخ غير الصالحة وغير canonical.
- شكل Cursor الخارجي opaque base64url وحقلاه submittedAt/id محفوظان. submittedAt العام في العناصر يبقى بصيغة milliseconds؛ الحقل الداخلي الدقيق لا يُرسل في الاستجابة. لا تغييرات في OpenAPI أو المخطط.
- سبعة اختبارات انحدار ناجحة: عدم فقد/تكرار الصفوف، tie-break بالمعرّف، قبول Cursor قديم، وتوافق تفاصيل العرض ورفض timestamps غير صالحة.
- أضيف اختبار PostgreSQL فعلي خامس لدقة microseconds/ties؛ لم يُشغّل لغياب قاعدة اختبار معزولة. إثبات الانحدار المحلي لا يعادل اختبار تنفيذ SQL على PostgreSQL حي.
- Cursor قديم فقد دقته بالفعل لا يمكن استرجاعها؛ يبقى حدّه القديم مقبولًا، وتبدأ دقة الإصلاح مع Cursors الجديدة. يُفضّل بدء pagination من الصفحة الأولى بعد تحديث الخدمة.

### 4. Git وCI

- الفرع لم يتغير: phase-5b2-practice-history-ui؛ HEAD بقي 821e20f1181b368cffac0250b5ec7623b3a7f2eb.
- main وorigin/main المحليان ما زالا عند f07e9fac2f1dcdbd359006295770646d96c9b193؛ المقارنة المحلية تعطي ahead=1/behind=0 لأنها مراجع قديمة.
- تحقق GitHub للقراءة فقط أكد main الفعلي عند ed69cb4d3e5f480ea024f65216cae2300a198886، وهو دمج PR #10. مقارنة HEAD بـmain الفعلي: commit واحد أمام HEAD، merge-base هو HEAD، وقائمة اختلاف الملفات فارغة؛ الشجرتان متطابقتان. لا تعارض محتوى مع main الذي تحققنا منه، ولا يُغني ذلك عن إعادة التحقق قبل PR إذا تغير main لاحقًا.
- لم يُنفّذ fetch/pull/merge/rebase/checkout أو أي تغيير Git. الملفات الثمانية الملتزمة مسبقًا في 5B.2 ليست تغييرات جديدة تُضم مرة أخرى.
- أضيف إلى CI فحص إعدادات Orval واختبارات الواجهة؛ بقيت خطوات Typecheck وAPI tests وBuild الحالية. YAML صالح والأوامر الجديدة نجحت محليًا؛ GitHub Actions نفسه لم يُشغّل.

## نتائج الفحوص النهائية المنفذة فعليًا

| الفحص | النتيجة | حدود التحقق |
| --- | --- | --- |
| اختبارات API المحلية النهائية | **145 ناجحًا، صفر فاشل** | عشرة ملفات؛ متغيرات الاتصال/Clerk والأسرار أزيلت من عملية الاختبار فقط وRUN_DB_TESTS=0، و**/*.db.test.ts مستبعد |
| اختبارات الواجهة النهائية | **68 ناجحًا، صفر فاشل** | خمسة ملفات؛ تشمل تسعة اختبارات العزل الجديدة، SSR وQueryClient/QueryObserver/MutationObserver مع حدود شبكة/Clerk محاكاة |
| PostgreSQL Progress | **11 متخطّية** | لا قاعدة محلية معزولة؛ لا بديل Neon |
| PostgreSQL History Details | **5 متخطّية** | تشمل حالة microseconds الجديدة؛ لا قاعدة محلية معزولة |
| TypeScript للمصادر والاختبارات | صفر تشخيص | Compiler API مع noEmit وincremental=false للمصادر الفعلية، وكل اختبارات الواجهة وAPI، دون إعادة كتابة declarations أو build-info |
| TypeScript لإعدادات Orval الأربعة | صفر تشخيص وexit 0 | الأمر الفعلي pnpm exec tsc -p lib/api-spec/tsconfig.codegen.json، والإعداد العام مشمول |
| OpenAPI وYAML | صالحان؛ صفر أخطاء | 18 operationId فريدة؛ العقد الحالي لم يتغير ضمن الإصلاح؛ YAML لـCI صالح أيضًا |
| توليد Orval الإضافي | نجاح المشاريع الأربعة | الستة ملفات متكافئة بعد تطبيع مسار custom-fetch ومساعد Awaited الناتج عن موقع الإعداد المؤقت؛ ملفا Zod وملفا schemas متطابقة byte-for-byte |
| Build الواجهة | ناجح | 1881 module؛ JS 531.97 kB، gzip 159.22 kB؛ تحذيرا Tooltip sourcemap وحجم chunk |
| Build API | ناجح | إعداد build.mjs نفسه مع مخرجات معزولة مؤقتة؛ لم يُشغّل الناتج |
| git diff --check | ناجح | الملفات tracked المرشحة؛ لا أخطاء whitespace |
| فحص الأسرار/الاستثناءات | لا نتائج مشبوهة | فحص ساكن لا يضمن كشف كل نوع سر؛ ملفات البيئة والنسخ الاحتياطية خارج القائمة |

الإجمالي النهائي: **213 اختبارًا ناجحًا، صفر فاشل، و16 اختبار PostgreSQL معزولًا متخطّيًا**. الاختباران القديمان في **/*.db.test.ts مستبعدان من الأمر النهائي؛ تشغيل آمن سابق أظهرهما skipped، ولا يُعدان نجاحًا. اختبار practice.history.integration.test.ts القديم لم يُنفّذ؛ لا TEST_DATABASE_URL متاحًا له.

لم يُشغّل pnpm run typecheck الجذري هنا لأنه قد يعيد كتابة declarations/build-info الحالية. فُحصت المصادر والاختبارات مباشرة دون emit؛ يلزم الأمر الرسمي في checkout/worktree نظيف مستقبلًا. وجود الأدوات PostgreSQL محليًا لا يكفي: ملفات تهيئة الخادم مثل share/postgres.bki غير متوفرة، فلم تُنشأ قاعدة أو خدمة جديدة.

ملاحظة فحص التوليد: وصل توليد Zod للتقدم مرة إلى مساره الحالي بسبب اختلاف علامات الاقتباس في إعداد الفحص المؤقت. فحص SHA256 أثبت بقاء المحتوى مطابقًا تمامًا لبداية المرحلة، ثم صُحح مسار الفحص المؤقت وأعيد التوليد بنجاح داخله. الملفات المولّدة القديمة الـ48 لم تُمس، ولا يوجد تغيير محتوى في الملفات الستة المولدة لـ5C.

## الملفات التي تغيرت في 5C.5A-Fix فقط

هذه قائمة التغيير بالنسبة لبداية الإصلاح، وليست كل تغييرات 5C السابقة. لا تعديل في API routes أو OpenAPI أو Dashboard/History UI ضمن الإصلاح.

| الملف | التغيير |
| --- | --- |
| `lib/api-spec/orval.learning-progress-client.config.ts` | تعديل ملف قائم محليًا |
| `lib/api-spec/orval.learning-progress.config.ts` | تعديل ملف قائم محليًا |
| `lib/api-spec/orval.practice-history.config.ts` | تعديل ملف قائم محليًا |
| `lib/api-spec/orval.config.ts` | تعديل ملف قائم محليًا |
| `lib/api-spec/tsconfig.codegen.json` | ملف جديد |
| `artifacts/ccna-learning/src/components/practice-workspace.tsx` | تعديل ملف قائم محليًا |
| `artifacts/ccna-learning/src/lib/practice-session.ts` | ملف جديد |
| `artifacts/ccna-learning/src/lib/practice-session.test.ts` | ملف جديد |
| `artifacts/api-server/src/lib/practice.ts` | تعديل ملف قائم محليًا |
| `artifacts/api-server/src/lib/practice-history-details.test.ts` | تعديل ملف قائم محليًا |
| `artifacts/api-server/src/lib/practice-history-details.integration.test.ts` | تعديل ملف قائم محليًا |
| `artifacts/api-server/src/lib/practice-history-pagination.test.ts` | ملف جديد |
| `.github/workflows/ci.yml` | تعديل ملف قائم محليًا |
| `docs/development/practice-history-details.md` | تعديل ملف قائم محليًا |
| `docs/development/phase-5c-validation.md` | تعديل ملف قائم محليًا |

## Git الحالي وقائمة الملفات المرشحة للـCommit

- بداية الإصلاح: 93 مدخلًا في status، بما فيه تقرير التدقيق السابق. الآن **99**: 64 tracked معدّلًا و35 غير متتبع، ولا staged.
- القائمة الكاملة المقترحة لـ5C أصبحت **46 ملفًا**: 15 tracked معدّلًا و31 جديدًا. أضيفت ستة ملفات إلى قائمة التدقيق السابقة ذات 40 ملفًا.
- المستبعد: 48 تعديلًا قديمًا مولّدًا + خمسة ملفات تحسين البيئة السابقة =53. لا ملفات غير مرتبطة إضافية في status.
- ملخص git diff --stat للـ15 tracked المرشحة فقط مقابل HEAD:

```text
15 files changed, 1016 insertions(+), 298 deletions(-)
```

لا يشمل هذا الملخص الملفات الجديدة غير staged. تظهر الـ48 القديمة كـM بسبب نهايات الأسطر لكن numstat فارغ؛ لا تُعدّل أو تُضم تلقائيًا.

هذه allowlist مقترحة للمراجعة فقط؛ **لا staging نُفّذ**. الملفات المولدة الستة إضافية ومعزولة، ولا تعديل يدوي لها.

| الملف                                                                       | المرحلة     | الحالة               |
| --------------------------------------------------------------------------- | ----------- | -------------------- |
| `artifacts/api-server/src/app.ts`                                           | 5C.2        | معدّل                |
| `artifacts/api-server/src/lib/practice.ts`                                  | 5C.4        | معدّل                |
| `artifacts/api-server/src/routes/learning.ts`                               | 5C.2        | معدّل                |
| `artifacts/api-server/src/routes/practice.test.ts`                          | 5C.4        | معدّل                |
| `artifacts/api-server/src/routes/practice.ts`                               | 5C.4        | معدّل                |
| `artifacts/ccna-learning/src/App.tsx`                                       | 5C.3        | معدّل                |
| `artifacts/ccna-learning/src/components/practice-workspace.tsx`             | 5C.3        | معدّل                |
| `artifacts/ccna-learning/src/index.css`                                     | 5C.3        | معدّل                |
| `artifacts/ccna-learning/src/pages/practice-history.test.ts`                | 5C.4        | معدّل                |
| `artifacts/ccna-learning/src/pages/practice-history.tsx`                    | 5C.4        | معدّل                |
| `lib/api-client-react/src/index.ts`                                         | 5C.3 / 5C.4 | معدّل                |
| `lib/api-spec/openapi.yaml`                                                 | 5C.1 / 5C.4 | معدّل                |
| `lib/api-zod/src/index.ts`                                                  | 5C.2 / 5C.4 | معدّل                |
| `artifacts/api-server/src/lib/learning-progress.integration.test.ts`        | 5C.2        | جديد                 |
| `artifacts/api-server/src/lib/learning-progress.ts`                         | 5C.2        | جديد                 |
| `artifacts/api-server/src/lib/practice-history-details.integration.test.ts` | 5C.4        | جديد                 |
| `artifacts/api-server/src/lib/practice-history-details.test.ts`             | 5C.4        | جديد                 |
| `artifacts/api-server/src/middlewares/body-parsing.ts`                      | 5C.2        | جديد                 |
| `artifacts/api-server/src/routes/learning-progress.test.ts`                 | 5C.2        | جديد                 |
| `artifacts/ccna-learning/src/components/learning-progress-cache-guard.tsx`  | 5C.3        | جديد                 |
| `artifacts/ccna-learning/src/lib/learning-progress-cache.test.ts`           | 5C.3        | جديد                 |
| `artifacts/ccna-learning/src/lib/learning-progress-cache.ts`                | 5C.3        | جديد                 |
| `artifacts/ccna-learning/src/lib/practice-history-cache.test.ts`            | 5C.4        | جديد                 |
| `artifacts/ccna-learning/src/lib/practice-history-cache.ts`                 | 5C.4        | جديد                 |
| `artifacts/ccna-learning/src/pages/learning-progress.test.ts`               | 5C.3        | جديد                 |
| `artifacts/ccna-learning/src/pages/learning-progress.tsx`                   | 5C.3        | جديد                 |
| `docs/api/learning-progress-api.md`                                         | 5C.2        | جديد                 |
| `docs/api/learning-progress.md`                                             | 5C.1        | جديد                 |
| `docs/development/learning-progress-ui.md`                                  | 5C.3        | جديد                 |
| `docs/development/practice-history-details.md`                              | 5C.4        | جديد                 |
| `lib/api-client-react/src/learning-progress/api.schemas.ts`                 | 5C.3        | جديد — مولّد         |
| `lib/api-client-react/src/learning-progress/api.ts`                         | 5C.3        | جديد — مولّد         |
| `lib/api-client-react/src/practice-history/api.schemas.ts`                  | 5C.4        | جديد — مولّد         |
| `lib/api-client-react/src/practice-history/api.ts`                          | 5C.4        | جديد — مولّد         |
| `lib/api-spec/orval.learning-progress-client.config.ts`                     | 5C.3        | جديد                 |
| `lib/api-spec/orval.learning-progress.config.ts`                            | 5C.2        | جديد                 |
| `lib/api-spec/orval.practice-history.config.ts`                             | 5C.4        | جديد                 |
| `lib/api-zod/src/learning-progress/api.ts`                                  | 5C.2        | جديد — مولّد         |
| `lib/api-zod/src/practice-history/api.ts`                                   | 5C.4        | جديد — مولّد         |
| `docs/development/phase-5c-validation.md`                                   | 5C.5A       | جديد — تقرير التدقيق |
| `.github/workflows/ci.yml` | 5C.5A-Fix | معدّل |
| `lib/api-spec/orval.config.ts` | 5C.5A-Fix | معدّل |
| `lib/api-spec/tsconfig.codegen.json` | 5C.5A-Fix | جديد |
| `artifacts/ccna-learning/src/lib/practice-session.ts` | 5C.5A-Fix | جديد |
| `artifacts/ccna-learning/src/lib/practice-session.test.ts` | 5C.5A-Fix | جديد |
| `artifacts/api-server/src/lib/practice-history-pagination.test.ts` | 5C.5A-Fix | جديد |

## قائمة الملفات المستبعدة

ملفات تحسين البيئة المحلية السابقة (خارج 5C):

- `package.json`
- `docs/development/local-environment.md`
- `tools/local-development.mjs`
- `tools/local-env.mjs`
- `tools/local-env.test.mjs`

إضافة إلى .env و.env.local وكامل .local/، بما فيه backups/tests وملفات dump وبيانات الاعتماد المؤقتة وأي مخرجات build/coverage. git check-ignore أكد استثناء .env و.env.local و.local/backups و.local/tests، وgit ls-files لم يجد ملفات البيئة الفعلية أو dumps/backups متتبعة.

الـ48 ملفًا القديمة المستبعدة، بالاسم:

- `lib/api-zod/src/generated/types/adminAccessResponse.ts`
- `lib/api-zod/src/generated/types/adminAccessResponseRole.ts`
- `lib/api-zod/src/generated/types/adminListQuestionsDifficulty.ts`
- `lib/api-zod/src/generated/types/adminListQuestionsParams.ts`
- `lib/api-zod/src/generated/types/adminListQuestionsStatus.ts`
- `lib/api-zod/src/generated/types/adminQuestion.ts`
- `lib/api-zod/src/generated/types/adminQuestionCreate.ts`
- `lib/api-zod/src/generated/types/adminQuestionCreateDifficulty.ts`
- `lib/api-zod/src/generated/types/adminQuestionCreateOptionsItem.ts`
- `lib/api-zod/src/generated/types/adminQuestionCreateStatus.ts`
- `lib/api-zod/src/generated/types/adminQuestionCreateType.ts`
- `lib/api-zod/src/generated/types/adminQuestionDifficulty.ts`
- `lib/api-zod/src/generated/types/adminQuestionListResponse.ts`
- `lib/api-zod/src/generated/types/adminQuestionOption.ts`
- `lib/api-zod/src/generated/types/adminQuestionStatus.ts`
- `lib/api-zod/src/generated/types/adminQuestionType.ts`
- `lib/api-zod/src/generated/types/adminQuestionUpdate.ts`
- `lib/api-zod/src/generated/types/adminQuestionUpdateDifficulty.ts`
- `lib/api-zod/src/generated/types/adminQuestionUpdateOptionsItem.ts`
- `lib/api-zod/src/generated/types/adminQuestionUpdateStatus.ts`
- `lib/api-zod/src/generated/types/adminQuestionUpdateType.ts`
- `lib/api-zod/src/generated/types/adminTopic.ts`
- `lib/api-zod/src/generated/types/adminTopicCreate.ts`
- `lib/api-zod/src/generated/types/adminTopicCreateStatus.ts`
- `lib/api-zod/src/generated/types/adminTopicStatus.ts`
- `lib/api-zod/src/generated/types/adminTopicUpdate.ts`
- `lib/api-zod/src/generated/types/adminTopicUpdateStatus.ts`
- `lib/api-zod/src/generated/types/currentUser.ts`
- `lib/api-zod/src/generated/types/currentUserResponse.ts`
- `lib/api-zod/src/generated/types/currentUserRole.ts`
- `lib/api-zod/src/generated/types/currentUserStatus.ts`
- `lib/api-zod/src/generated/types/dashboardSummary.ts`
- `lib/api-zod/src/generated/types/errorResponse.ts`
- `lib/api-zod/src/generated/types/errorResponseError.ts`
- `lib/api-zod/src/generated/types/healthStatus.ts`
- `lib/api-zod/src/generated/types/learnerQuestion.ts`
- `lib/api-zod/src/generated/types/learnerQuestionDifficulty.ts`
- `lib/api-zod/src/generated/types/learnerQuestionOptionsItem.ts`
- `lib/api-zod/src/generated/types/learnerQuestionType.ts`
- `lib/api-zod/src/generated/types/practiceAnswerInput.ts`
- `lib/api-zod/src/generated/types/practiceAnswerResult.ts`
- `lib/api-zod/src/generated/types/practiceCorrectOption.ts`
- `lib/api-zod/src/generated/types/practiceQuestion.ts`
- `lib/api-zod/src/generated/types/practiceQuestionDifficulty.ts`
- `lib/api-zod/src/generated/types/practiceQuestionOption.ts`
- `lib/api-zod/src/generated/types/practiceQuestionType.ts`
- `lib/api-zod/src/generated/types/practiceTopic.ts`
- `lib/api-zod/src/generated/types/topicSummary.ts`


## مراجعة الحماية والتوافق

- Progress وHistory محميان بـrequireAuthenticatedUser وهوية req.dbUser.id؛ لا اختيار userId من العميل. الأدوار والحالة من PostgreSQL users، لا claims الدور. لا تغيير في هذه الآلية ضمن الإصلاح.
- GET الحقيقي ليس اختبار قراءة محضة بالضرورة: middleware القديم قد ينشئ المستخدم أو يحدّث profile/lastLoginAt؛ لذلك لم تُستدعَ endpoints حقيقية أثناء هذه المرحلة.
- Progress وHistory ومفاتيح سؤال Practice مرتبطة بنفس userId/sessionId وتنتظر Clerk. الإلغاء/الإزالة وغياب placeholder يمنعان بيانات جلسة سابقة؛ key الجديد يعزل حالة Practice المحلية، والحارس يمنع الرد المتأخر.
- Submit الناجح يبطل Progress للجلسة التي بدأت الطلب؛ الفشل لا يبطل الإحصائيات. لا تغيير في التصحيح أو INSERT للمحاولات.
- 401/403/500 وحالات صفر المحاولات/صفر الكتالوج/فقد تفاصيل History مغطاة باختبارات المراحل السابقة التي نجحت مجددًا. البيانات القديمة مخفية عند الخطأ.
- History LEFT JOIN على questionId وtopicId المحفوظين بلا تصفية حالة؛ النقل لا يغيّر نسبة المحاولة التاريخية. Progress coverage يتبع تصنيف السؤال الحالي.
- لا تعارض exports أو أسماء مخططات في الملفات الحالية؛ TypeScript والتوليد الإضافي يؤكدان ذلك. Cursors الجديدة فقط تحافظ على microseconds؛ public DTO وعقد التفاصيل الافتراضي محفوظان.
- Dashboard يحتسب كل التاريخ، وHistory يعرض صفحة. للمقارنة استخدم كل الصفحات ونفس المستخدم، وانتظر انتهاء Submit وإعادة الجلب؛ الاستجابتان ليستا snapshot مشتركة أثناء الكتابة المتزامنة.

## القيود والمخاطر المتبقية

1. **متوسط — 16 سيناريو PostgreSQL معزولًا لم تنفّذ:** يلزم خادم محلي وقواعد ccna_progress_test وccna_history_test، أو suffix معتمد. مفاتيح LEARNING_PROGRESS_TEST_DATABASE_URL وPRACTICE_HISTORY_DETAILS_TEST_DATABASE_URL تقبل loopback فقط، ويتحقق الاختبار من قاعدة الخادم وغياب Neon قبل fixtures. لا تستخدم ccna-development أو production لهذه الاختبارات. الاختبار الجديد للدقة لم ينفذ SQL على خادم حي.
2. **متوسط — تحقق Clerk/DOM حي متبقٍ:** اختبارات الوحدة تثبت مفتاح العزل وحارس الرد، لكنها لا تنفذ تبديل حساب حقيقي في المتصفح. اختبر الاختيار/النتيجة، الخروج، تبديل الحساب والجلسة أثناء Submit، والعودة للحساب السابق دون نتيجة قديمة. لا يوجد Browser E2E جديد.
3. **متوسط — تسليم أدوات البيئة خارج نطاق 5C:** الملفات الخمسة المستبعدة توفر dev:local:api المشار إليه في الوثائق؛ Commit لـ5C وحده لن يضيفها إلى clone نظيف. يلزم قرار منفصل لتسليمها في Commit مستقل أو مراجعة تعليمات التشغيل؛ لا تُضم تلقائيًا.
4. **منخفض — التوليد العام:** الإعداد العام ما زال clean=true، وقد يخلق تعارض exports عند توليد Progress في العملاء العامة. فُحص TypeScript له فقط؛ لم يُشغّل. استمر بالتوليد الإضافي المعزول حتى مراجعة توحيد codegen منفصلة.
5. **منخفض — CI وBuild:** CI الجديد لم يعمل على GitHub بعد، والأمر الجذري Typecheck ينتظر worktree نظيفًا. تحذيرا sourcemap وحجم chunk لا يمنعان البناء. بعض أوصاف العقد/وثائق المراحل تاريخية بصيغة future؛ لا تغيير لتعريفات المقاييس.

## خطوات التحقق اليدوي المتبقية

1. الحساب نفسه: Dashboard وTopic Map =4/3/75%/1، وHistory =أربع محاولات بالأسماء/الأكواد الصحيحة، بعد اكتمال الحفظ والجلب.
2. في Practice اختر إجابة، ثم بدّل الحساب/الجلسة أو سجّل الخروج: لا اختيار أو نتيجة أو خطأ Mutation سابق. كرر أثناء Submit مع Network throttling، ثم عُد للحساب القديم. الطلب الذي وصل الخادم قد يكون حُفظ للحساب الذي صادق عليه؛ إصلاح العزل لا يلغي كتابة بدأها المستخدم.
3. تبديل الحساب أثناء Progress/History: لا بيانات الحساب السابق؛ تبدأ History الصفحة الأولى. استخدم اعتراض الشبكة محليًا لـ401/403/500 دون تعديل حسابات Neon.
4. على قاعدة اختبار محلية معزولة فقط شغّل 11 اختبار Progress وخمسة History، خصوصًا التعطيل والنقل والعزل وحدود microseconds/ties. لا تعتبر skipped نجاحًا.
5. تحقق من mobile/desktop والتنقل Dashboard → Topics → Practice → History. بعد تحديث API ابدأ pagination من الصفحة الأولى لتستخدم Cursors الدقيقة الجديدة.
6. لا Submit أو Admin writes آلية على Neon في هذا النطاق؛ اختبار المستخدم اليدوي له نطاق مستقل.

## خطة آمنة لـ5C.5B وتجهيز PR — لم تُنفّذ

1. احصل على موافقة 5C.5B مستقلة؛ احسم اختبارات PostgreSQL وClerk المتبقية، وقرار تسليم أدوات البيئة السابقة قبل اعتماد PR للدمج.
2. بعد موافقة Git، أعد التحقق من main/PR #10، وأنشئ worktree معزولًا وفرع Phase 5C من main المحدث دون تغيير الفرع الحالي أو إعادة كتابة تاريخ Lovable. لا pull/reset/stash للنسخة الحالية ذات التعديلات.
3. انقل patchات الملفات tracked الـ15 ملفًا ملفًا والـ31 الجديدة بالـallowlist أعلاه فقط. لا تعِد تضمين تغييرات 5B.2 الملتزمة مسبقًا، ولا تستبدل ملفات main كاملة إذا تغير لاحقًا. ملفات app.ts وApp.tsx وpractice.ts وroutes وexports وOpenAPI وCI تستحق مراجعة إذا حدثت تعديلات متزامنة.
4. حافظ على الـ48 القديمة والبيئة والنسخ الاحتياطية والـ.local والملفات الخمسة غير المرتبطة خارج النقل/staging. لا نسخ اتصال Neon إلى worktree ولا codegen clean.
5. في worktree النظيف شغّل pnpm install --frozen-lockfile وpnpm run typecheck وفحص Orval واختبارات API/الواجهة والبناء؛ استخدم قاعدة اختبار محلية مستقلة فقط للـfixtures.
6. بعد موافقة تجهيز Git استخدم git add -- مع allowlist الدقيقة فقط، ثم git diff --cached --name-only و--stat و--check وفحص الأسرار. لا git add . أو -A.
7. اعرض النتائج والملفات واطلب الموافقة اللازمة على Commit. Push وDraft PR يحتاجان تفويضًا لاحقًا؛ لا merge/deploy تلقائيًا. وصف PR يوضح العزل ودقة Cursor والتوافق والاختبارات المتخطاة.

## حماية مساحة العمل

الإصلاح اقتصر على الـ15 ملفًا المدرجة، مع مخرجات فحص معزولة داخل .local/tests المستثنى من Git. فحص SHA256 أكد تطابق **87 ملفًا محميًا** من baseline الإصلاح، تشمل الـ48 القديمة وملفات 5C الأخرى غير المعدلة والعملاء المولدة الستة و.env و.env.local وGit index. لا تغيّر HEAD أو الفرع ولا ملفات staged؛ لا ملفات خارج نطاق الإصلاح تغيّر محتواها.

لم يُشغّل التطبيق أو تُستدعَ API حقيقية، ولم يُتصل بـNeon أو PostgreSQL حي. لم تُنفّذ Migration/Seed/Restore أو كتابة قاعدة بيانات أو تغيير schema/صلاحيات أو إعدادات Clerk/Neon. لا Commit/Push/Merge/PR، ولا استخدام Replit. توقف العمل بعد الإصلاح والتحقق انتظارًا للموافقة على المرحلة التالية.
