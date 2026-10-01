# Database Relationships

```text
users 1 --- * sessions
users * --- * roles        via user_roles
users 1 --- * attempts
topics 1 --- * questions
questions 1 --- * question_options
questions 1 --- * question_images
questions * --- * tags    via question_tags
questions 1 --- * attempts
```

## Cardinality rules

- السؤال ينتمي إلى topic واحد في MVP.
- السؤال يملك خيارين أو أكثر في `MULTIPLE_CHOICE_SINGLE`.
- question images اختيارية ومتعددة معماريًا، حتى لو قدمت الواجهة صورة واحدة أولًا.
- المستخدم يستطيع تسجيل محاولات متعددة للسؤال نفسه.
- لا تُحذف attempts التاريخية عند تعطيل user أو question.