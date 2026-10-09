# Phase 5C.6 — Current Narrow Commit Manifest

Reviewed on 2026-10-10 (Asia/Riyadh). The 47-file manifest below is historical: those feature files were already published in `9eb1cb6` and are in PR #11. The next proposed commit has exactly four paths:

| Path | Proposed change |
| --- | --- |
| `artifacts/api-server/src/lib/learning-progress.integration.test.ts` | One-line replacement with `host(inet_server_addr())` for the local server address check |
| `artifacts/api-server/src/lib/practice-history-details.integration.test.ts` | Same one-line local PostgreSQL address correction |
| `docs/development/phase-5c-validation.md` | Current evidence, CI scope, merge conditions and delayed Clerk Not Verified limitation |
| `docs/development/phase-5c-git-manifest.md` | This narrow allowlist and protected-work instructions |

Both fixes are absent from HEAD/history and remain local. They change test address normalization only; loopback URL/name checks and server identity restrictions remain enforced. No runtime application, authentication, schema, environment, dependency or generated-client change is proposed.

The current checkout is `phase-5b2-practice-history-ui`, while PR #11 uses `feature/phase-5c-learning-progress`; both point to `9eb1cb68b81402c241cdb5729dcedd4dbaf3dfde`. Before any authorized commit/push, ensure the commit belongs to the PR branch while preserving this checkout's protected work. Do not push the current branch by assumption or rewrite published history.

The 53 pre-existing local paths remain protected and excluded: 48 files under `lib/api-zod/src/generated/types/`, `package.json`, `tools/local-development.mjs`, `tools/local-env.mjs`, `tools/local-env.test.mjs`, and `docs/development/local-environment.md`. Also exclude `.local/`, all environment files and all build outputs. No staging, commit, push or merge was performed during this review; the index remains empty. Do not execute the older 47-file staging instructions below for this follow-up.

After a separate approval, staging must use exactly the four literal paths above, with an initially empty index, then verify `git diff --cached --name-only`, `--check`, the full staged patch and secret scan. Never use `git add .`, reset, clean, amend, rebase or force push. Suggested follow-up commit message: `test(postgres): normalize local server address and record phase 5c review`.

Validation re-run: workspace TypeScript, four Orval configs, 145 API non-DB tests, 68 frontend tests and both production builds passed. Earlier PostgreSQL JSON evidence confirms 16 passed/0 failed/0 skipped on 2026-10-09; no DB tests were re-run in 5C.6. Accounts A/B login and ordinary data isolation are user-confirmed. **Delayed real Clerk session switching during Submit remains Not Verified**, deferred because of test tooling and recorded as a residual production risk, not a passed test.

[Published CI](https://github.com/HayelAlsalafi/kindred-identity-spark/actions/runs/37954728772) passed for `9eb1cb6` from a clean checkout. It does not cover these uncommitted fixes or real Clerk/PostgreSQL validation. Require CI success on the new PR head after authorized publication. [PR #11](https://github.com/HayelAlsalafi/kindred-identity-spark/pull/11) remains open/Draft/unmerged and currently conflict-free. No immediate merge recommendation; see [current validation and remaining risk](phase-5c-validation.md). Phase 6 waits until PR #11 is closed.

---

# Historical record: Phase 5C.5B — Git Preparation & Pre-Commit Manifest

تاريخ المراجعة: 2026-10-09. المرجع: [phase-5c-validation.md](phase-5c-validation.md). هذا Manifest هو التغيير الوحيد في هذه المرحلة. لم يُنفّذ staging أو Commit أو Push أو PR.

**القرار: القائمة جاهزة لتجهيز staging ومراجعة Commit محلي بعد موافقة منفصلة؛ اعتماد Merge يحتاج الفحوص المتبقية أدناه.** لا مانع مكتشف من ناحية الأسرار أو النطاق أو التوافق الحالي. لا يُعد هذا تفويضًا بتغيير Git أو الفرع.

## العدد والنطاق

- استُخرجت القائمة الدقيقة المعتمدة: **46 ملفًا**، جميعها موجودة ضمن تغييرات العمل الحالية، دون تكرار أو مسار مفقود.
- هذا Manifest إضافة صريحة طلبها المستخدم في 5C.5B؛ القائمة النهائية المقترحة أصبحت **47 ملفًا** =46 سابقة +هذا الملف. لا توسع آخر للنطاق.
- التصنيف: **15 تطبيق/API +14 عقود وعملاء وتوليد +11 اختبارات +6 وثائق +1 CI**.
- **53 تغييرًا محليًا مستبعدًا** =48 generated/types قديمة +5 ملفات بيئة محلية سابقة. هذا عدد الملفات المعدّلة/غير المتتبعة المستبعدة من status؛ ملفات البيئة والنسخ الاحتياطية المستثناة من Git وattached_assets غير المعدلة محظورة أيضًا، ولا تُضاف إلى هذا العدد.
- الستة ملفات المولدة الجديدة الخاصة بـProgress/History مضمنة كلها؛ لا ملف تحت generated/types ضمن القائمة.

## نتائج Git ومقارنة main

| الفحص | النتيجة |
| --- | --- |
| الفرع الحالي | phase-5b2-practice-history-ui — لم يتغير |
| HEAD | 821e20f1181b368cffac0250b5ec7623b3a7f2eb |
| main وorigin/main المحليان | f07e9fac2f1dcdbd359006295770646d96c9b193 — مراجع قديمة |
| HEAD...origin/main المحلي | ahead=1، behind=0 |
| main الفعلي في GitHub، قراءة فقط | ed69cb4d3e5f480ea024f65216cae2300a198886، دمج PR #10 |
| HEAD مقابل main الفعلي | main أمام HEAD بـcommit واحد؛ merge-base هو HEAD؛ قائمة اختلاف الملفات فارغة، والشجرتان متطابقتان |
| status عند البداية | 99 مدخلًا: 64 tracked معدّلًا +35 غير متتبع |
| status بعد Manifest | 100 مدخل: 64 tracked معدّلًا +36 غير متتبع؛ المرشح 47 والمستبعد 53 |
| الملفات المرشحة مقابل HEAD | 15 tracked معدّلًا +32 جديدة تشمل Manifest |
| staging/index | لا ملفات staged؛ بصمة index لم تتغير |
| git diff --check | ناجح للـ15 tracked المرشحة |
| التعديلات القديمة الـ48 | تظهر M؛ numstat فارغ مع تحذيرات LF/CRLF، والبصمات محفوظة دون تطبيع نهايات الأسطر |

المقارنة المباشرة في GitHub: [HEAD...main](https://github.com/HayelAlsalafi/kindred-identity-spark/compare/821e20f1181b368cffac0250b5ec7623b3a7f2eb...main). لم يُنفّذ fetch أو pull أو merge أو rebase أو checkout/switch أو reset أو stash/clean. لا تعارض محتوى مع main وقت المراجعة؛ أعد التحقق قبل نقل patches إذا وصل main إلى commit جديد.

المقارنة مع origin/main المحلي تعرض ثمانية ملفات 5B.2 ملتزمة مسبقًا: UI package.json وApp.tsx وindex.css وhistory-pagination.ts وصفحة/اختبار History وvitest.config.ts وpnpm-lock.yaml. لا تعِد تضمين تغييراتها الملتزمة؛ ضم فقط تعديلات 5C الجديدة مقابل HEAD. الملفات التي تغيرت أيضًا في 5C تبقى في القائمة لهذا الفرق الجديد وحده.

ملخص Git للـ15 tracked المرشحة فقط:

~~~text
15 files changed, 1016 insertions(+), 298 deletions(-)
~~~

لا يشمل الملخص الـ32 ملفًا الجديدة غير staged، فلا يُستخدم باعتباره diff summary للـ47 كاملة. يجب فحص الملخص الكامل بعد staging المصرح به لاحقًا.

## ملفات تطبيق وAPI — 15

تنفيذ Progress الحقيقي وربط Dashboard/Topic Map، وإثراء History وعزل المستخدم والجلسة وتصحيح دقة Cursor، دون تغيير schema أو منطق التصحيح.

| الملف | الحالة بالنسبة إلى HEAD | سبب الإدراج/نتيجة المراجعة |
| --- | --- | --- |
| `artifacts/api-server/src/app.ts` | معدّل | ربط parser المتوافق بالمسار الجديد؛ باقي المسارات تحفظ parsing السابق |
| `artifacts/api-server/src/lib/practice.ts` | معدّل | تفاصيل History المرتبطة بالموضوع التاريخي وCursor بدقة microseconds؛ Submit غير معدّل |
| `artifacts/api-server/src/routes/learning.ts` | معدّل | GET /learning/progress محمي وno-store، validation و400/401/403/500 |
| `artifacts/api-server/src/routes/practice.ts` | معدّل | includeDetails اختياري والتحقق من قيمته واستجابة قديمة محفوظة |
| `artifacts/ccna-learning/src/App.tsx` | معدّل | ربط صفحات المقاييس وحارس cache ومفاتيح هوية الحساب والتنقل الحالي |
| `artifacts/ccna-learning/src/components/practice-workspace.tsx` | معدّل | عزل الحالة بالجِلسة وحارس رد Submit وتحديث Progress عند النجاح |
| `artifacts/ccna-learning/src/index.css` | معدّل | تنسيق مقاييس وتغطية وempty states متجاوب ضمن التصميم الحالي |
| `artifacts/ccna-learning/src/pages/practice-history.tsx` | معدّل | الأكواد والأسماء والتعامل مع فقد التفاصيل وcache وPagination |
| `artifacts/api-server/src/lib/learning-progress.ts` | جديد | SELECT مجمّعة بالمستخدم، التاريخ منفصل عن الكتالوج النشط |
| `artifacts/api-server/src/middlewares/body-parsing.ts` | جديد | رفض body على Progress بعد المصادقة، وحفظ parsing للمسارات القائمة |
| `artifacts/ccna-learning/src/components/learning-progress-cache-guard.tsx` | جديد | إلغاء وإزالة Progress للحساب/الجلسة السابقة |
| `artifacts/ccna-learning/src/lib/learning-progress-cache.ts` | جديد | مفاتيح خاصة بالجلسة وinvalidation بعد نجاح Submit فقط |
| `artifacts/ccna-learning/src/lib/practice-history-cache.ts` | جديد | مفاتيح History والتفاصيل والCursor وتنظيف الجلسات |
| `artifacts/ccna-learning/src/pages/learning-progress.tsx` | جديد | Dashboard وTopic Map بالمقاييس الحقيقية وحالات المصادقة/الخطأ/الصفر |
| `artifacts/ccna-learning/src/lib/practice-session.ts` | جديد | مفتاح remount وحارس الرد المتأخر للجلسة السابقة |

## عقود OpenAPI والعملاء والتوليد — 14

إضافة العقد والتعريفات والعملاء الستة المولدة المعزولة، وربط exports بأسماء متوافقة، وإعدادات Orval وفحصها؛ لا ملفات generated/types القديمة.

| الملف | الحالة بالنسبة إلى HEAD | سبب الإدراج/نتيجة المراجعة |
| --- | --- | --- |
| `lib/api-client-react/src/index.ts` | معدّل | exports الجديدة صريحة وaliases لـHistory دون ازدواج ErrorResponse |
| `lib/api-spec/openapi.yaml` | معدّل | مسار Progress جديد وincludeDetails وحقول اختيارية في History |
| `lib/api-zod/src/index.ts` | معدّل | تصدير مخطط Progress وalias لتفاصيل History مع إبقاء القديم |
| `lib/api-client-react/src/learning-progress/api.schemas.ts` | جديد | أنواع مولدة من العقد، مع حقول التفاصيل الاختيارية أو مقاييس Progress |
| `lib/api-client-react/src/learning-progress/api.ts` | جديد | عميل React Query مولد مع customFetch وAbortSignal؛ ضرورة الربط بالواجهة |
| `lib/api-client-react/src/practice-history/api.schemas.ts` | جديد | أنواع مولدة من العقد، مع حقول التفاصيل الاختيارية أو مقاييس Progress |
| `lib/api-client-react/src/practice-history/api.ts` | جديد | عميل React Query مولد مع customFetch وAbortSignal؛ ضرورة الربط بالواجهة |
| `lib/api-spec/orval.learning-progress-client.config.ts` | جديد | توليد عميل Progress وحده، clean=false، والتحقق من schemas المطلوبة |
| `lib/api-spec/orval.learning-progress.config.ts` | جديد | توليد Zod لـProgress وحده، clean=false |
| `lib/api-spec/orval.practice-history.config.ts` | جديد | توليد تفاصيل History وحدها، clean=false والتحقق من المسار/mapping |
| `lib/api-zod/src/learning-progress/api.ts` | جديد | مخطط Zod مولد للتحقق من استجابة المسار الجديد/التفاصيل |
| `lib/api-zod/src/practice-history/api.ts` | جديد | مخطط Zod مولد للتحقق من استجابة المسار الجديد/التفاصيل |
| `lib/api-spec/orval.config.ts` | معدّل | تصحيح formatter المدعوم وtype import فقط؛ لا تشغيل clean |
| `lib/api-spec/tsconfig.codegen.json` | جديد | noEmit لفحص ملفات إعدادات Orval الأربعة ضمن CI |

## اختبارات — 11

تغطية المصادقة والعزل والمقاييس والتوافق وcache وPagination؛ الاختبارات الآلية التي تكتب fixtures مقصورة على PostgreSQL محلي معزول وخارج CI الافتراضي.

| الملف | الحالة بالنسبة إلى HEAD | سبب الإدراج/نتيجة المراجعة |
| --- | --- | --- |
| `artifacts/api-server/src/routes/practice.test.ts` | معدّل | توافق History القديم والتفاصيل والهوية وHTTP والأسرار |
| `artifacts/ccna-learning/src/pages/practice-history.test.ts` | معدّل | عرض تفاصيل مفهومة وfallback وخصوصية وauth/errors وPagination |
| `artifacts/api-server/src/lib/learning-progress.integration.test.ts` | جديد | 11 سيناريو PostgreSQL محلي معزول؛ pending ولا اتصال تلقائي بقاعدة التطبيق |
| `artifacts/api-server/src/lib/practice-history-details.integration.test.ts` | جديد | 5 سيناريوهات PostgreSQL محلية: النقل والتعطيل والعزل والدقة والتوافق |
| `artifacts/api-server/src/lib/practice-history-details.test.ts` | جديد | Drizzle SQL وLEFT JOIN وtopicId التاريخي وعزل المستخدم دون PostgreSQL حي |
| `artifacts/api-server/src/routes/learning-progress.test.ts` | جديد | HTTP/auth/validation ومطابقة أمثلة OpenAPI وعزل المستخدمين |
| `artifacts/ccna-learning/src/lib/learning-progress-cache.test.ts` | جديد | Query/Mutation lifecycle الحقيقي مع شبكة محاكاة وعزل الجلسات |
| `artifacts/ccna-learning/src/lib/practice-history-cache.test.ts` | جديد | تفاصيل الطلب وإلغاء الرد المتأخر وإزالة بيانات المستخدم السابق |
| `artifacts/ccna-learning/src/pages/learning-progress.test.ts` | جديد | المقاييس والصفر والأخطاء والتعطيل والنقل والتنقل |
| `artifacts/ccna-learning/src/lib/practice-session.test.ts` | جديد | 9 حالات وحدات لمفتاح العزل وحارس الرد وunmount/sign-out |
| `artifacts/api-server/src/lib/practice-history-pagination.test.ts` | جديد | 7 حالات انحدار لفقد microseconds وUUID ties والتوافق |

## وثائق — 6

توثيق تعريفات المقاييس والتنفيذ والاختبار والقيود والتدقيق وقائمة Git؛ Manifest هذا إضافة مطلوبة ضمن 5C.5B.

| الملف | الحالة بالنسبة إلى HEAD | سبب الإدراج/نتيجة المراجعة |
| --- | --- | --- |
| `docs/api/learning-progress-api.md` | جديد | توثيق 5C.2 وخدمة التجميع والمصادقة والاختبارات |
| `docs/api/learning-progress.md` | جديد | تعريفات 5C.1 المعتمدة وأمثلة الصفر والتكرار والنقل والتعطيل |
| `docs/development/learning-progress-ui.md` | جديد | توثيق 5C.3 والcache وSubmit والاختبار اليدوي |
| `docs/development/practice-history-details.md` | جديد | توثيق 5C.4 والتفاصيل والدقة والتوافق؛ أعداد الاختبارات التاريخية مذكورة ضمن القيود |
| `docs/development/phase-5c-validation.md` | جديد | تقرير التدقيق والإصلاح ونتائج الفحوص السابقة والقيود |
| `docs/development/phase-5c-git-manifest.md` | جديد | قائمة هذه المرحلة وأسباب النطاق والأمان وأوامر staging المقترحة |

## CI — 1

تشغيل اختبارات الواجهة وفحص إعدادات Orval إلى جانب خطوات CI القائمة دون أسرار Neon أو Clerk.

| الملف | الحالة بالنسبة إلى HEAD | سبب الإدراج/نتيجة المراجعة |
| --- | --- | --- |
| `.github/workflows/ci.yml` | معدّل | خطوتا اختبارات الواجهة وفحص Orval، مع الحفاظ على خطوات CI الحالية |

## الملفات المستبعدة — 53 من تغييرات العمل

### إعداد البيئة السابق — 5

| الملف | سبب الاستبعاد |
| --- | --- |
| package.json | تغييرات scripts المحلية السابقة فقط؛ لا تغيير dependencies أو متطلبات CI لـ5C |
| docs/development/local-environment.md | توثيق بيئة التطوير السابقة، خارج 5C |
| tools/local-development.mjs | تشغيل API/فحص/ترحيلات محلية محمية، تسليم مستقل |
| tools/local-env.mjs | تحميل البيئة والتحقق من Neon، تسليم مستقل |
| tools/local-env.test.mjs | اختبارات آلية البيئة السابقة، تسليم مستقل |

أوامر dev:local:api المذكورة في بعض وثائق 5C تعتمد على هذه الملفات المستبعدة. قائمة 5C لا تضيف تلك الأوامر إلى clone نظيف؛ احسم تسليم أدوات البيئة بصورة منفصلة أو توضيح طريقة التشغيل في الوثائق قبل Merge. لا ضم تلقائي لهذه الملفات.

### التعديلات المولدة القديمة — 48

السبب الموحد: تعديلات سابقة تحت lib/api-zod/src/generated/types/ خارج Phase 5C؛ يجب حفظها byte-for-byte وعدم ضمها أو إعادة توليدها/تنظيفها.

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

### استثناءات إضافية دائمة من القائمة

- .env و.env.local وأي ملف credentials أو مفاتيح خاصة.
- كامل .local/ بما فيه backups/tests وملفات dump ومخرجات الفحص المؤقتة؛ وأي backup أو log أو coverage أو build output.
- node_modules/ وأي ملفات tmp/cache غير مرتبطة.
- attached_assets/ بكامله. يوجد في HEAD أصل برومبت قديم واحد: attached_assets/Pasted-We-have-successfully-completed-and-verified-Phase-1-Fou_1790521518995.txt؛ غير معدّل وغير مرشح. لم تُقرأ محتوياته أو تُعدّل أو تُحذف. القائمة لا تتضمن assets من هذا المجلد ولا imports إليه.
- pnpm-lock.yaml وUI package.json وvitest.config.ts وhistory-pagination.ts الملتزمة سابقًا وغير المعدّلة الآن؛ ليست تغييرات جديدة لهذه المرحلة. لا تغيير dependency يتطلب تحديث lockfile.

## فحص الأمان وحماية الملفات

- فُحص كامل محتوى الـ46 المرشحة، ثم Manifest نفسه، لأنماط PostgreSQL connection URIs، مفاتيح Clerk الحقيقية، GitHub tokens، AWS access keys، JWTs، private-key PEM، وNeon hostnames. **صفر تطابق مشبوه**؛ لم تُعرض قيم أسرار.
- لا مسار .env أو credentials أو dump أو .local أو attached_assets أو temp/build/coverage ضمن الـ47. لا symlink ضمن الملفات المعتمدة السابقة.
- git check-ignore يؤكد استثناء .env و.env.local و.local/tests و.local/backups؛ git ls-files لا يظهر ملفات البيئة الفعلية أو .local/dumps متتبعة.
- فحص الأسرار ساكن ومحدد الأنماط، وليس ضمانًا لكشف أي نوع محتمل من السر. كرره على staged diff لاحقًا، مع عرض أسماء الملفات/أنواع المطابقة فقط عند الحاجة.
- حُفظت بصمات SHA256 لـ102 ملف سابق: كل ملفات status الـ99، و.env و.env.local وGit index. الفحص النهائي يؤكد عدم تغيير محتوى أي منها؛ إضافة Manifest وحدها خارج baseline.
- لم تُشغّل خدمات التطبيق أو endpoints حقيقية أو تتصل هذه المرحلة بقاعدة PostgreSQL/Neon، ولم تنفّذ Migration/Seed/Restore أو كتابة بيانات. لا تعديل كود أو عقد أو بيئة أو إعدادات Clerk/Neon.

## توافق العقود والimports/exports

- OpenAPI صالح، YAML بلا أخطاء؛ **18 operationId فريدة و84 مرجعًا محليًا، صفر مراجع مفقودة**.
- مقارنة بنيوية مع عقد HEAD: المسار الجديد الوحيد /learning/progress؛ ثلاثة schemas جديدة فقط: LearningProgressResponse وLearningProgressSummary وLearningTopicProgress.
- المسار القديم الوحيد المعدّل /practice/history: وصف محدث وincludeDetails query اختياري default=false. response reference والردود القديمة والlimit/cursor والمصادقة محفوظة.
- المخطط القديم الوحيد المعدّل PracticeHistoryItem: إضافة questionCode/topicName كحقول اختيارية nullable. required والحقول القديمة متطابقة؛ الاستجابة الافتراضية بلا تفاصيل محفوظة في handler واختبارات wire contract.
- لا تغيير securitySchemes أو صلاحيات الخادم. Progress/History يعتمد req.dbUser.id من requireAuthenticatedUser، لا userId العميل؛ الأدوار والحالة من users في PostgreSQL.
- LEFT JOIN للتفاصيل لا يفلتر الحالة، ويربط topicName بالموضوع المحفوظ في المحاولة. Cursor الجديد يحتفظ microseconds مع قبول السابق وإبقاء submittedAt العام كما كان.
- exports العامة القديمة محفوظة، الجديدة explicit/aliases لتفادي تكرار ErrorResponse وأسماء History. فحص TypeScript للمصادر والاختبارات والإعدادات: **صفر تشخيص**.
- الملفات الستة المولدة لها رأس Orval، وتولد في مجلدات مستقلة تحت learning-progress/practice-history مع clean=false. فحص التوليد السابق نجح وأثبت التكافؤ؛ لم يُعاد تشغيل التوليد في هذه المرحلة.
- إعداد Orval العام مصحح TypeScript لكنه ما زال clean=true، وتوحيد التوليد العام قد يخلق ازدواجية exports. **لا تشغّل الأمر العام codegen فوق المجلدات الحالية**؛ استخدامه مستقبلاً مراجعة مستقلة، وليس شرط تشغيل التطبيق أو CI الحالي.

## مراجعة CI ونتائج هذه المرحلة

| الفحص | النتيجة/الدليل |
| --- | --- |
| CI YAML | صالح، لا secrets references ولا env لاتصال Neon/Clerk |
| اختبار الواجهة المستخدم في CI | pnpm --filter @workspace/ccna-learning test: **68 ناجحًا وصفر فاشل**، أُعيد فعليًا في 5C.5B بمتغيرات اتصال وأسرار معطّلة في عملية الاختبار فقط |
| فحص إعدادات Orval المستخدم في CI | pnpm exec tsc -p lib/api-spec/tsconfig.codegen.json: exit 0، جميع الإعدادات الأربعة؛ لا Orval runtime ولا clean |
| TypeScript للمصادر والاختبارات | أُعيد Compiler API مع noEmit وincremental=false: صفر تشخيص في API والواجهة والإعدادات؛ لا كتابة declarations/build-info |
| API tests | **145 ناجحًا** في 5C.5A-Fix؛ لم تُعد هنا، وبصمات الكود والاختبارات لم تتغير |
| Build API/الواجهة | ناجحان في 5C.5A-Fix؛ لم يُعد البناء هنا، والمصادر لم تتغير |
| PostgreSQL fixtures | 11 Progress +5 History =**16 غير منفذة**؛ لا قاعدة اختبار محلية معزولة |
| GitHub Actions | مراجعة الإعدادات وأوامر الخطوات محليًا فقط؛ لم تُشغّل workflow على GitHub |

CI يثبت Node 22.22.2 وpnpm 10.28.0، ويستخدم pnpm install --frozen-lockfile. حزم Vitest و@types/node اللازمة موجودة بالفعل في workspace والlockfile الملتزم؛ استبعاد root package.json المعدّل لا يزيل اعتمادًا جديدًا.

اختبارات الواجهة تستعمل Node/SSR وTanStack Query الحقيقي مع fetch/Clerk محاكاة؛ لا تحتاج Clerk keys أو Neon. فحص Orval يقرأ العقود/types المحلية فقط؛ typeRoots يشير إلى API workspace المثبت كاملًا. CI لا يستخدم install production-only لهذه الخطوة.

اختبارات API الافتراضية تستبعد *.integration.test.ts في vitest.config.ts، وأمر CI يستبعد *.db.test.ts أيضًا؛ لا fixtures أو RUN_DB_TESTS=1 أو اتصال قاعدة بيانات مطلوب. اختبارات PostgreSQL الجديدة لا تأخذ DATABASE_URL أو .env؛ تقبل متغير اختبار صريحًا يقيد loopback واسم قاعدة الاختبار، وتتحقق من database/server address وغياب Neon قبل TEMP writes. لا تشغّلها على ccna-development.

## المخاطر والاختبارات اللازمة قبل Merge

1. **متوسط — 16 اختبار PostgreSQL:** نفذها على خادم اختبار محلي معزول فقط. تغطي التجميع والعزل والتعطيل/إعادة التفعيل والنقل والتغطية والتفاصيل ودقة microseconds/ties. الحاجة إلى تجهيز خادم/قاعدة اختبار لها موافقة مستقلة؛ لا Neon Development/Production كبديل.
2. **متوسط — Clerk/browser حي:** تحقق من خروج وتبديل المستخدم والجلسة أثناء Progress/History/Submit، ومن اختفاء الاختيار والنتيجة القديمة والرد المتأخر والعودة للحساب السابق. Unit tests للمفتاح/الحارس ليست DOM E2E.
3. **متوسط — worktree/CI رسمي:** شغّل pnpm run typecheck الرسمي والاختبارات والبناء في worktree نظيف، ثم تحقق من GitHub Actions بعد موافقة Push/PR. الفحص الحالي لا يعيد كتابة project-reference declarations.
4. **متوسط — أدوات البيئة المستبعدة:** احسم تسليمها أو توضيح تعليمات clone نظيف قبل Merge؛ لا تنقل أسرار .env.local.
5. **منخفض — توثيق تاريخي:** description لـProgress وبعض وثائق المراحل تصف contract-only/future، ووثيقة History تقول أربعة اختبارات بينما الإجمالي الحالي خمسة بعد إصلاح Pagination. لا يغيّر هذا العقد أو التنفيذ؛ المرجع الحالي للأعداد هذا Manifest وتقرير التدقيق. لا تعديل الوثائق الأخرى في 5C.5B.
6. **منخفض — Pagination/Build:** Cursor سابق فقد microseconds لا يمكن استرجاعها؛ ابدأ من الصفحة الأولى بعد التحديث. تحذيرا Tooltip sourcemap وحجم JS 531.97 kB لا يمنعان Build، ويظلان موثقين.
7. **احتمال تعارض مستقبلًا:** لا فرق محتوى مع main الحالي؛ لو تغير main قبل PR، أعد مراجعة app.ts وApp.tsx وpractice.ts وroutes وexports وOpenAPI وCI تحديدًا. لا نقل ملف كامل فوق تعديلات أحدث ولا حل تعارض واسع تلقائيًا.

يجب أيضًا إعادة smoke/manual verification للمستخدم نفسه: 4 محاولات/3 صحيحة/75%/سؤال فريد واحد، History بالأكواد والأسماء، وNext/Previous دون فقد/تكرار، وحالات 401/403/500 والصفر مع اعتراض الشبكة/fixtures بدل تغيير بيانات Neon. افحص mobile/desktop والتنقل. أي Submit يدوي يظل ضمن اختبار يأذن به المستخدم، ولا كتابة آلية هنا.

## أوامر staging مقترحة فقط — لم تُنفّذ

تحتاج موافقة لاحقة. الأفضل تشغيلها داخل worktree وفرع Phase 5C مستقل من main المحدث بعد موافقة إنشاء ذلك الفرع/worktree، مع الاحتفاظ بالنسخة الحالية كما هي. يجب أن تكون patches والملفات الـ47 قد نُقلت ومراجعتها هناك؛ لا تنقل .env/.local أو الـ53 المستبعدة. تأكد أن index فارغ أولًا؛ إذا لم يكن فارغًا توقف بدل إعادة ضبطه تلقائيًا.

القائمة أدناه مسارات حرفية محددة، بلا wildcard أو git add . أو -A:

~~~powershell
$phase5cFiles = @(
  'artifacts/api-server/src/app.ts',
  'artifacts/api-server/src/lib/practice.ts',
  'artifacts/api-server/src/routes/learning.ts',
  'artifacts/api-server/src/routes/practice.ts',
  'artifacts/ccna-learning/src/App.tsx',
  'artifacts/ccna-learning/src/components/practice-workspace.tsx',
  'artifacts/ccna-learning/src/index.css',
  'artifacts/ccna-learning/src/pages/practice-history.tsx',
  'artifacts/api-server/src/lib/learning-progress.ts',
  'artifacts/api-server/src/middlewares/body-parsing.ts',
  'artifacts/ccna-learning/src/components/learning-progress-cache-guard.tsx',
  'artifacts/ccna-learning/src/lib/learning-progress-cache.ts',
  'artifacts/ccna-learning/src/lib/practice-history-cache.ts',
  'artifacts/ccna-learning/src/pages/learning-progress.tsx',
  'artifacts/ccna-learning/src/lib/practice-session.ts',
  'lib/api-client-react/src/index.ts',
  'lib/api-spec/openapi.yaml',
  'lib/api-zod/src/index.ts',
  'lib/api-client-react/src/learning-progress/api.schemas.ts',
  'lib/api-client-react/src/learning-progress/api.ts',
  'lib/api-client-react/src/practice-history/api.schemas.ts',
  'lib/api-client-react/src/practice-history/api.ts',
  'lib/api-spec/orval.learning-progress-client.config.ts',
  'lib/api-spec/orval.learning-progress.config.ts',
  'lib/api-spec/orval.practice-history.config.ts',
  'lib/api-zod/src/learning-progress/api.ts',
  'lib/api-zod/src/practice-history/api.ts',
  'lib/api-spec/orval.config.ts',
  'lib/api-spec/tsconfig.codegen.json',
  'artifacts/api-server/src/routes/practice.test.ts',
  'artifacts/ccna-learning/src/pages/practice-history.test.ts',
  'artifacts/api-server/src/lib/learning-progress.integration.test.ts',
  'artifacts/api-server/src/lib/practice-history-details.integration.test.ts',
  'artifacts/api-server/src/lib/practice-history-details.test.ts',
  'artifacts/api-server/src/routes/learning-progress.test.ts',
  'artifacts/ccna-learning/src/lib/learning-progress-cache.test.ts',
  'artifacts/ccna-learning/src/lib/practice-history-cache.test.ts',
  'artifacts/ccna-learning/src/pages/learning-progress.test.ts',
  'artifacts/ccna-learning/src/lib/practice-session.test.ts',
  'artifacts/api-server/src/lib/practice-history-pagination.test.ts',
  'docs/api/learning-progress-api.md',
  'docs/api/learning-progress.md',
  'docs/development/learning-progress-ui.md',
  'docs/development/practice-history-details.md',
  'docs/development/phase-5c-validation.md',
  'docs/development/phase-5c-git-manifest.md',
  '.github/workflows/ci.yml'
)

# فحوص قراءة فقط قبل staging؛ أي اختلاف غير متوقع يستدعي التوقف.
git branch --show-current
git rev-parse HEAD
git status --short
git diff --cached --name-only
git diff --check -- $phase5cFiles

# بعد موافقة staging فقط:
git add -- $phase5cFiles

# يجب أن تطابق القائمة المجهزة المسارات الـ47 دون زيادة أو نقص.
$phase5cStaged = @(git diff --cached --name-only)
Compare-Object -ReferenceObject ($phase5cFiles | Sort-Object) -DifferenceObject ($phase5cStaged | Sort-Object)
git diff --cached --stat
git diff --cached --check
git status --short
~~~

نجاح Compare-Object بلا output دليل على تطابق الأسماء، وليس موافقة Commit. إذا أظهر اختلافًا، أو فشل git add/--check، أو ظهر سر: توقف واعرض الحالة دون reset/restore تلقائيًا. راجع staged diff نفسه وأعد فحص الأسرار؛ لا تعتمد أسماء الملفات وحدها. في worktree المعزول يجب ألا تظهر تغييرات الملفات الـ53 المستبعدة أصلًا؛ في النسخة الحالية تبقى unstaged كما كانت.

## خطة Commit وPull Request — مقترحة فقط

1. وافق على القائمة النهائية ذات 47 ملفًا وعلى مكان تجهيزها؛ لاحقًا أنشئ worktree/فرع Phase 5C مستقل من main المحدث، دون switch للنسخة الحالية أو إعادة كتابة التاريخ المرتبط بـLovable. لا تحتاج إلى merge/rebase لتطبيق الـpatch الحالي على tree main الذي ثبت تطابقه، لكن تحقق مجددًا عند التنفيذ.
2. انقل فقط فرق الملفات الـ15 tracked مقابل HEAD والـ32 الجديدة. استبعد الـ53، والبيئة والنسخ الاحتياطية وattached_assets. أعد فحص القائمة والعقود والأسرار.
3. نفذ الفحوص في النسخة النظيفة بالlockfile المعتمد: typecheck الرسمي وفحص Orval واختبارات API/الواجهة وBuild. جهز PostgreSQL الاختباري بموافقة مستقلة، أو وثق pending صراحةً؛ لا تعتبر skipped نجاحًا.
4. بعد تفويض staging شغّل allowlist أعلاه، وافحص --cached --name-only/--stat/--check والـdiff الكامل. اعرض نتيجة pre-commit للمستخدم قبل Commit إذا كان التفويض لا يشمله.
5. رسالة Commit مقترحة: feat(learning): add learner progress and practice history details. Commit محلي يحتاج موافقة صريحة؛ لا amend/squash/rebase لتاريخ منشور.
6. Push وفتح Draft PR إلى main يحتاجان تفويضًا لاحقًا مستقلًا. وصف PR يشرح المقاييس الحقيقية، عزل الجلسة، التفاصيل الاختيارية ودقة Cursor، الفحوص المنفذة والـ16 غير المنفذة، وملاحظة أدوات البيئة.
7. لا تجعل PR جاهزًا للدمج قبل اكتمال الفحوص/CI وقرار أدوات البيئة والتحقق الحي من العزل؛ راجع التوافق والـdiff النهائي في GitHub. Merge وDeploy ليسا جزءًا من أي إجراء في هذه المرحلة.

## نتيجة الحفاظ على المشروع

التغيير الوحيد خلال 5C.5B هو docs/development/phase-5c-git-manifest.md. لم تتغير الملفات السابقة الـ102 التي حُفظت بصماتها، ومنها جميع الـ48 القديمة و.env و.env.local وGit index. الفرع وHEAD وrefs المحلية وindex بقيت كما كانت. لم يُستخدم Replit أو تُعرض أسرار أو يُنفذ أي إجراء Git كتابي أو كتابة قاعدة بيانات.
