# Phase 5C.1 — Learning Progress Metrics & API Contract

الحالة: تصميم وعقد فقط. المرجع هو [OpenAPI](../../lib/api-spec/openapi.yaml). تنفيذ endpoint مؤجل إلى 5C.2؛ لا يضيف هذا التغيير handler أو استعلامات أو تكامل Dashboard، ولا يجعل المسار متاحًا وقت التشغيل.

## نطاق البيانات والمصطلحات

هوية المستخدم الداخلي تؤخذ من المستخدم الذي تحقق منه Clerk وحلّه middleware إلى `req.dbUser.id`. كل المقاييس التاريخية والتغطية تخص هذا المستخدم وحده، بينما أعداد الأسئلة المتاحة تصف الكتالوج العام النشط.

- **Historical attempts:** جميع صفوف `practice_attempts` الخاصة بالمستخدم، بما فيها التكرار ومحاولات الأسئلة أو الموضوعات المعطلة لاحقًا. الموضوع التاريخي هو `practice_attempts.topic_id` وقت تقديم الإجابة.
- **Unique historical questions:** مجموعة `question_id` المختلفة في هذه المحاولات؛ التكرار لا يزيدها، والتعطيل أو النقل لا يمحو تاريخها.
- **Currently available questions:** أسئلة حالتها `ACTIVE` وموضوعها **الحالي** حالته `ACTIVE`، بما فيها الأسئلة التي لم يحاولها المستخدم.
- **Currently covered questions:** الأسئلة المتاحة حاليًا التي يوجد للمستخدم أي محاولة تاريخية لها، صحيحة أو خاطئة، حتى لو نُقلت بعد المحاولة. كل سؤال يُحتسب مرة واحدة.

التغطية تقيس التعرض للأسئلة، وليست إتقانًا. الدقة التاريخية ليست دقة آخر إجابة لكل سؤال. لا نستنتج Study Time أو Streak Days أو Avg. Time من تاريخ التقديم؛ هذه البيانات غير مدعومة ولا توجد في العقد.

## تعريف المقاييس

| المقياس                       | حقل الملخص                 | التعريف                                                                                        |
| ----------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------- |
| Total attempts                | `totalAttempts`            | عدد جميع المحاولات التاريخية للمستخدم.                                                         |
| Correct attempts              | `correctAttempts`          | عدد المحاولات ذات `is_correct = true` المحفوظة؛ لا إعادة تصحيح باستخدام خيارات السؤال الحالية. |
| Overall accuracy              | `overallAccuracy`          | `100 × correctAttempts / totalAttempts`؛ ليست متوسط نسب الموضوعات.                             |
| Unique questions attempted    | `uniqueQuestionsAttempted` | عدد الأسئلة المختلفة تاريخيًا عبر جميع المحاولات.                                              |
| Currently available questions | `availableQuestionCount`   | عدد الأسئلة المتاحة حاليًا في الموضوعات النشطة.                                                |
| Currently covered questions   | `coveredQuestionCount`     | عدد الأسئلة المختلفة المتاحة حاليًا التي حاولها المستخدم سابقًا.                               |
| Current coverage              | `coveragePercent`          | `100 × coveredQuestionCount / availableQuestionCount`.                                         |

لكل موضوع تُعاد `topicId` و`topicName` و`status` و`displayOrder`، والمقاييس التالية:

| الحقل                      | التعريف لكل موضوع                                                                       |
| -------------------------- | --------------------------------------------------------------------------------------- |
| `totalAttempts`            | المحاولات التاريخية التي موضوعها المحفوظ يطابق الموضوع، بصرف النظر عن مكان السؤال الآن. |
| `correctAttempts`          | المحاولات الصحيحة من المجموعة التاريخية نفسها.                                          |
| `accuracy`                 | `100 × correctAttempts / totalAttempts` لهذه المجموعة.                                  |
| `uniqueQuestionsAttempted` | الأسئلة المختلفة في المحاولات المنسوبة تاريخيًا إلى هذا الموضوع.                        |
| `availableQuestionCount`   | الأسئلة النشطة التي تنتمي الآن إلى الموضوع، إذا كان نشطًا؛ صفر للموضوع المعطل.          |
| `coveredQuestionCount`     | الأسئلة المتاحة حاليًا في الموضوع ولها أي محاولة للمستخدم، ولو كانت في موضوع آخر.       |
| `coveragePercent`          | `100 × coveredQuestionCount / availableQuestionCount` للكتالوج الحالي لهذا الموضوع.     |

جميع العدادات أعداد صحيحة غير سالبة. النسب أرقام JSON بين 0 و100، تُقرّب إلى أقرب جزء من مئة: `Math.round(10000 * numerator / denominator) / 100` عندما يكون المقام موجبًا. ليست سلاسل نصية، ولا يلزم إرسال صفرين عشريين. مثال: محاولتان صحيحتان من ثلاث تعطيان `66.67`.

## الصفر والتعطيل والنقل

- عند مقام صفر تكون النسبة `0`، وليست `null` أو `NaN` أو `Infinity`. مستخدم بلا محاولات لديه دقة وتغطية صفر؛ المتاح يبقى عدد الكتالوج. يمكن للواجهة استخدام العدادات لتمييز «لا بيانات» عن دقة صفر بعد إجابات خاطئة.
- تعاد جميع الموضوعات النشطة، حتى لو لم تحتوِ على أسئلة أو محاولات. تعاد المعطلة فقط إذا للمستخدم محاولات منسوبة إليها؛ لا يظهر تاريخ مستخدم آخر أو موضوع معطل بلا تاريخ لهذا المستخدم.
- تعطيل سؤال لا يغير العدادات التاريخية، لكنه يستبعده من المتاح والمغطى. تعطيل موضوع يستبعد كل أسئلته منهما، مع إبقاء تاريخه وإظهار `status: DISABLED`.
- إعادة تفعيل السؤال وموضوعه تعيد أهليته؛ المحاولات القديمة تكفي لتغطيته. إضافة سؤال متاح قد تقلل التغطية دون تعديل أي محاولة.
- نقل سؤال لا يعيد إسناد المحاولات القديمة: الدقة والمحاولات تبقيان في الموضوع المحفوظ. التغطية تتبع الموضوع الحالي، بما فيها محاولات ما قبل النقل. إذا كان الموضوع الجديد معطلًا فلا يكون السؤال متاحًا أو مغطى.
- `topicName` هو الاسم الحالي؛ لا يوجد snapshot للاسم التاريخي. تغيير الإجابات الصحيحة لا يعيد تصحيح `is_correct` القديم.
- لا توجد سياسة حذف تاريخ في هذه المرحلة؛ العلاقات الحالية تمنع حذف المراجع المستخدمة. دعم الحذف مستقبلًا يتطلب مراجعة هذه التعريفات.

### ثوابت تنفيذ 5C.2

- `correctAttempts <= totalAttempts` و`uniqueQuestionsAttempted <= totalAttempts`، إجمالًا ولكل موضوع تاريخي.
- `coveredQuestionCount <= availableQuestionCount`؛ إجمالي المغطى لا يتجاوز إجمالي الأسئلة الفريدة التاريخية.
- مجموع محاولات الموضوعات وصحيحها يساوي الملخص؛ مجموع المتاح والمغطى يساويه أيضًا.
- **لا يُجمع الفريد التاريخي لكل موضوع للحصول على الإجمالي:** السؤال الذي نُقل ثم حُاول في الموضوع الجديد قد يوجد في مجموعتين تاريخيتين، لكنه سؤال فريد واحد إجمالًا.
- **المغطى الحالي لكل موضوع قد يتجاوز فريده التاريخي** عند نقل سؤال حُاول في موضوع آخر. لا تفرض `coveredQuestionCount <= uniqueQuestionsAttempted` لكل موضوع.
- يُحتسب السؤال المتاح مرة واحدة دون مضاعفة بسبب المحاولات المتعددة. يجب أن تعكس الاستجابة قراءة متسقة للكتالوج والتاريخ عند تغيير حالة سؤال أو نقله أثناء الطلب.

## عقد GET /learning/progress

المسار الكامل: `GET /api/learning/progress`. معرّف العملية `getLearningProgress`، ضمن وسم `learning`. يستخدم `clerkSession` الموجود كما تفعل endpoints المصادقة الحالية.

- لا يقبل query parameters أو request body، بما فيها `userId`. يرفض تنفيذ 5C.2 أي منها بـ400 بعد التحقق من المصادقة والحساب. عدم تعريفها في OpenAPI وحده لا ينفذ الرفض؛ هذا التزام للـhandler المستقبلي.
- حسابا `USER` و`ADMIN` يحصلان على بياناتهما فقط. الدور وحالة الحساب من PostgreSQL، وليس token claims. لا صلاحية لطلب تقدم مستخدم آخر.
- يتبع camelCase و`$ref` و`ErrorResponse` الموجودة. يضيف `LearningProgressResponse` و`LearningProgressSummary` و`LearningTopicProgress` فقط، دون تغيير مخططات أو استجابات المسارات الحالية.
- شكل 200 هو `{ summary, topics }`. الحقول المطلوبة محددة في OpenAPI؛ لا معرف مستخدم أو بيانات شخصية أو إجابات في الاستجابة.
- الموضوعات مرتبة تصاعديًا بحسب `displayOrder` ثم `topicName` ثم `topicId`. لا pagination؛ يعاد الكتالوج والتاريخ حسب السياسة أعلاه.
- كل الاستجابات `Cache-Control: private, no-store`. في تكامل الواجهة المستقبلي يجب عزل cache حسب جلسة المستخدم ومسحها عند الخروج، وإعادة جلب التقدم بعد حفظ محاولة ناجحة.
- لا يعالج هذا endpoint عرض Question Code في History ولا يغير عقدها؛ تلك مهمة منفصلة. لا تُضاف أسماء الأسئلة إلى ملخص التقدم.

| HTTP | السلوك المطلوب مستقبلًا                                                         |
| ---- | ------------------------------------------------------------------------------- |
| 200  | ملخص المستخدم وموضوعاته، بما فيها مستخدم بلا محاولات.                           |
| 400  | query parameters أو body غير مسموح بهما، بما فيه اختيار المستخدم من العميل.     |
| 401  | غياب جلسة Clerk صالحة أو فشل التحقق منها.                                       |
| 403  | مستخدم مصادق عليه وحسابه معطل وفق قاعدة البيانات.                               |
| 500  | تعذر تحميل التقدم؛ `ErrorResponse` عام دون SQL أو بيانات اتصال أو تفاصيل حساسة. |

تظل دلالات HTTP للمسارات الحالية دون تغيير. توليد الأنواع وhooks مؤجل؛ لا ملفات TypeScript يدوية بديلة عن Orval. عند تنفيذ 5C.2 يجب مراجعة أثر `clean` وحفظ التعديلات الحالية قبل أي توليد معتمد.

## أمثلة موثقة

الأسماء وUUID افتراضية وليست نتائج قراءة قاعدة البيانات. الأمثلة موجودة أيضًا في استجابة 200 في OpenAPI. المتاح يصف كتالوج كل سيناريو، وليس افتراضًا بشأن كتالوج التطوير.

### threeAttempts

ثلاث محاولات، منها اثنتان صحيحتان: Q1 صحيحة ثم خاطئة، وQ2 صحيحة؛ Q3 متاح بلا محاولة. المحاولات 3 والأسئلة الفريدة 2.

```json
{
  "summary": {
    "totalAttempts": 3,
    "correctAttempts": 2,
    "overallAccuracy": 66.67,
    "uniqueQuestionsAttempted": 2,
    "availableQuestionCount": 3,
    "coveredQuestionCount": 2,
    "coveragePercent": 66.67
  },
  "topics": [
    {
      "topicId": "11111111-1111-4111-8111-111111111111",
      "topicName": "Routing fundamentals",
      "status": "ACTIVE",
      "displayOrder": 1,
      "totalAttempts": 3,
      "correctAttempts": 2,
      "accuracy": 66.67,
      "uniqueQuestionsAttempted": 2,
      "availableQuestionCount": 3,
      "coveredQuestionCount": 2,
      "coveragePercent": 66.67
    }
  ]
}
```

### noAttempts

مستخدم بلا محاولات، مع سؤالين متاحين.

```json
{
  "summary": {
    "totalAttempts": 0,
    "correctAttempts": 0,
    "overallAccuracy": 0,
    "uniqueQuestionsAttempted": 0,
    "availableQuestionCount": 2,
    "coveredQuestionCount": 0,
    "coveragePercent": 0
  },
  "topics": [
    {
      "topicId": "11111111-1111-4111-8111-111111111111",
      "topicName": "Routing fundamentals",
      "status": "ACTIVE",
      "displayOrder": 1,
      "totalAttempts": 0,
      "correctAttempts": 0,
      "accuracy": 0,
      "uniqueQuestionsAttempted": 0,
      "availableQuestionCount": 2,
      "coveredQuestionCount": 0,
      "coveragePercent": 0
    }
  ]
}
```

### repeatedQuestion

السؤال نفسه خمس مرات، ثلاث صحيحة؛ سؤال آخر بلا محاولة. المحاولات 5 والفريد والمغطى 1 والدقة 60 والتغطية 50.

```json
{
  "summary": {
    "totalAttempts": 5,
    "correctAttempts": 3,
    "overallAccuracy": 60,
    "uniqueQuestionsAttempted": 1,
    "availableQuestionCount": 2,
    "coveredQuestionCount": 1,
    "coveragePercent": 50
  },
  "topics": [
    {
      "topicId": "11111111-1111-4111-8111-111111111111",
      "topicName": "Routing fundamentals",
      "status": "ACTIVE",
      "displayOrder": 1,
      "totalAttempts": 5,
      "correctAttempts": 3,
      "accuracy": 60,
      "uniqueQuestionsAttempted": 1,
      "availableQuestionCount": 2,
      "coveredQuestionCount": 1,
      "coveragePercent": 50
    }
  ]
}
```

### disabledQuestion

بعد المحاولات الثلاث، عُطّل Q1 وQ3. بقي Q2 وحده متاحًا ومغطى؛ التاريخ ثابت والتغطية 100.

```json
{
  "summary": {
    "totalAttempts": 3,
    "correctAttempts": 2,
    "overallAccuracy": 66.67,
    "uniqueQuestionsAttempted": 2,
    "availableQuestionCount": 1,
    "coveredQuestionCount": 1,
    "coveragePercent": 100
  },
  "topics": [
    {
      "topicId": "11111111-1111-4111-8111-111111111111",
      "topicName": "Routing fundamentals",
      "status": "ACTIVE",
      "displayOrder": 1,
      "totalAttempts": 3,
      "correctAttempts": 2,
      "accuracy": 66.67,
      "uniqueQuestionsAttempted": 2,
      "availableQuestionCount": 1,
      "coveredQuestionCount": 1,
      "coveragePercent": 100
    }
  ]
}
```

### movedQuestion

محاولة صحيحة لـQ1 في A، ثم نُقل إلى B. تاريخ A باقٍ، والتغطية في B رغم غياب تاريخ محاولات منسوب إليه.

```json
{
  "summary": {
    "totalAttempts": 1,
    "correctAttempts": 1,
    "overallAccuracy": 100,
    "uniqueQuestionsAttempted": 1,
    "availableQuestionCount": 1,
    "coveredQuestionCount": 1,
    "coveragePercent": 100
  },
  "topics": [
    {
      "topicId": "11111111-1111-4111-8111-111111111111",
      "topicName": "Routing fundamentals",
      "status": "ACTIVE",
      "displayOrder": 1,
      "totalAttempts": 1,
      "correctAttempts": 1,
      "accuracy": 100,
      "uniqueQuestionsAttempted": 1,
      "availableQuestionCount": 0,
      "coveredQuestionCount": 0,
      "coveragePercent": 0
    },
    {
      "topicId": "22222222-2222-4222-8222-222222222222",
      "topicName": "Network access",
      "status": "ACTIVE",
      "displayOrder": 2,
      "totalAttempts": 0,
      "correctAttempts": 0,
      "accuracy": 0,
      "uniqueQuestionsAttempted": 0,
      "availableQuestionCount": 1,
      "coveredQuestionCount": 1,
      "coveragePercent": 100
    }
  ]
}
```

### disabledTopic

عُطّل A بعد محاولة صحيحة؛ تاريخه ظاهر والمتاح والمغطى صفر. B نشط بسؤالين بلا محاولة.

```json
{
  "summary": {
    "totalAttempts": 1,
    "correctAttempts": 1,
    "overallAccuracy": 100,
    "uniqueQuestionsAttempted": 1,
    "availableQuestionCount": 2,
    "coveredQuestionCount": 0,
    "coveragePercent": 0
  },
  "topics": [
    {
      "topicId": "11111111-1111-4111-8111-111111111111",
      "topicName": "Routing fundamentals",
      "status": "DISABLED",
      "displayOrder": 1,
      "totalAttempts": 1,
      "correctAttempts": 1,
      "accuracy": 100,
      "uniqueQuestionsAttempted": 1,
      "availableQuestionCount": 0,
      "coveredQuestionCount": 0,
      "coveragePercent": 0
    },
    {
      "topicId": "22222222-2222-4222-8222-222222222222",
      "topicName": "Network access",
      "status": "ACTIVE",
      "displayOrder": 2,
      "totalAttempts": 0,
      "correctAttempts": 0,
      "accuracy": 0,
      "uniqueQuestionsAttempted": 0,
      "availableQuestionCount": 2,
      "coveredQuestionCount": 0,
      "coveragePercent": 0
    }
  ]
}
```

### emptyCatalog

لا موضوعات نشطة ولا تاريخ للمستخدم؛ جميع العدادات صفر والموضوعات فارغة.

```json
{
  "summary": {
    "totalAttempts": 0,
    "correctAttempts": 0,
    "overallAccuracy": 0,
    "uniqueQuestionsAttempted": 0,
    "availableQuestionCount": 0,
    "coveredQuestionCount": 0,
    "coveragePercent": 0
  },
  "topics": []
}
```

## حدود المرحلة ومعايير قبول التنفيذ اللاحق

تضيف هذه المرحلة الوثيقة وتعريف OpenAPI فقط. لا تشغيل تطبيق، ولا اتصالات قاعدة بيانات، ولا migrations أو seeds أو طلبات قد تكتب بيانات. لا تغييرات في React أو Clerk أو البيئة أو الملفات المولدة.

فحوص 5C.1: صحة YAML وOpenAPI والمراجع الداخلية، تطابق الأمثلة مع المخططات، التحقق الحسابي للأمثلة والثوابت، ومقارنة التعريفات القديمة قبل الإضافة وبعدها. هذه فحوص للعقد وليست دليلًا على endpoint يعمل.

اختبارات 5C.2 المطلوبة: مستخدمان لا يريان بيانات بعضهما، 401/403 ورفض userId، مستخدم بلا تاريخ، التكرار، تعطيل وإعادة تفعيل سؤال وموضوع، نقل قبل وبعد محاولات جديدة، التقريب والمقام صفر، ثبات المجاميع، وعدم تسريب أخطاء PostgreSQL. يجب اختبار عدم تضاعف الأسئلة بسبب joins. لا تكفي صفحة واحدة من Practice History لحساب الإجماليات.

## قرارات التصميم المعروضة للمراجعة قبل 5C.2

1. التغطية محاولة واحدة على الأقل، حتى لو خاطئة؛ لا تعني إتقان السؤال.
2. نسب المحاولات تاريخية ومحفوظة؛ التغطية تتبع الكتالوج الحالي وموضوع السؤال الحالي.
3. إظهار كل الموضوعات النشطة، والمعطلة ذات تاريخ المستخدم فقط؛ أسماء الموضوعات الحالية وليست snapshots تاريخية.
4. نسب عددية بدقة منزلتين كحد أقصى وصفر عند المقام صفر؛ معنى «لا بيانات» في الواجهة يعتمد على العدادات.
5. عقد خاص جديد، مع إبقاء Dashboard Summary وPractice History الحاليين دون تغيير ورفض مدخلات اختيار المستخدم.

بعد اعتماد هذه القرارات تبدأ 5C.2 بتنفيذ endpoint واختباراته وفق موافقة منفصلة. لا انتقال تلقائي إلى API أو Dashboard.
