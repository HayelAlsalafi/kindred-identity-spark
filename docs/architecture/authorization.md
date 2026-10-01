# Authorization Architecture

## Roles

يُنفذ في البداية دورا `USER` و`ADMIN`. جدول `roles` و`user_roles` يحافظان على قابلية إضافة أدوار مثل `SUPER_ADMIN`, `CONTENT_EDITOR`, و`MODERATOR`.

## Rules

- المستخدم الموثق يستطيع قراءة topics النشطة وممارسة الأسئلة.
- المستخدم يستطيع قراءة إحصاءاته ومحاولاته فقط.
- `ADMIN` يستطيع إدارة topics والأسئلة والمستخدمين وقراءة الإحصاءات الإدارية.
- كل route إداري يستخدم policy server-side مثل `requireRole("ADMIN")`.
- إخفاء روابط الإدارة في frontend تحسين UX فقط وليس ضابطًا أمنيًا.

## Object-level checks

عند قراءة أو تعديل سجل متعلق بمستخدم، يجب أن يطابق `user_id` المستخدم الحالي، إلا في route إداري مصرح به.