# Database Schema

هذا التصميم بدأ تنفيذه في Phase 1. جدول `topics` مطبق في development PostgreSQL؛ بقية الجداول ما زالت مخططًا.

## `users`

| Field | Type | Rules | Purpose |
| --- | --- | --- | --- |
| `id` | UUID | PK | هوية المستخدم |
| `email` | varchar | unique, not null | login |
| `password_hash` | varchar | not null | Argon2id hash |
| `display_name` | varchar | not null | الاسم المعروض |
| `status` | enum | default `ACTIVE` | إيقاف الحساب دون حذف التاريخ |
| `created_at` | timestamptz | default now | الإنشاء |
| `updated_at` | timestamptz | default now | آخر تعديل |

## `roles`

`id` UUID PK، `code` varchar unique (`USER`, `ADMIN`)، `name` varchar، timestamps.

## `user_roles`

`user_id` UUID FK إلى users، `role_id` UUID FK إلى roles، `created_at`. المفتاح الأساسي مركب من `(user_id, role_id)`.

## `sessions`

`id` UUID PK، `user_id` UUID FK، `token_hash` varchar unique، `expires_at` timestamptz، `created_at`، `last_seen_at`. لا يُخزن token الخام.

## `topics`

`id` UUID PK، `slug` varchar unique، `name` varchar، `description` text nullable، `display_order` integer default 0، `status` enum (`ACTIVE`, `DISABLED`)، timestamps.

## `questions`

`id` UUID PK، `public_id` varchar unique immutable مثل `CCNA-Q-000001`، `topic_id` UUID FK، `text` text، `type` enum، `difficulty` enum، `explanation` text، `reference_notes` text nullable، `status` enum (`DRAFT`, `ACTIVE`, `DISABLED`)، timestamps.

## `question_options`

`id` UUID PK، `question_id` UUID FK، `option_key` varchar، `option_text` text، `display_order` integer، `is_correct` boolean، timestamps. يجب أن يفرض service أن single-choice يملك إجابة صحيحة واحدة على الأقل وبحد أقصى واحدة.

## `question_images`

`id` UUID PK، `question_id` UUID FK، `storage_provider` varchar، `storage_key` varchar، `mime_type` varchar، `byte_size` bigint، `width` integer nullable، `height` integer nullable، `caption` text nullable، `display_order` integer default 0، timestamps. هذا يسمح بأكثر من صورة مستقبلًا.

## `tags`

`id` UUID PK، `slug` varchar unique، `name` varchar unique، timestamps.

## `question_tags`

`question_id` UUID FK، `tag_id` UUID FK، المفتاح الأساسي مركب، timestamps.

## `attempts`

`id` UUID PK، `user_id` UUID FK، `question_id` UUID FK، `selected_option_id` UUID FK nullable عند دعم أنواع مستقبلية، `selected_answer_snapshot` text nullable، `correct_option_id` UUID FK nullable، `is_correct` boolean، `started_at` timestamptz، `submitted_at` timestamptz، `duration_seconds` integer، `attempt_number` integer، `created_at`.

يحفظ attempt snapshot مناسبًا للتاريخ، ولا يُعدّل بعد الإنشاء. إذا تغير محتوى السؤال لاحقًا تبقى نتيجة المحاولة مفهومة من السجل التاريخي.

## Enums

- `QuestionType`: `MULTIPLE_CHOICE_SINGLE` الآن، مع مساحة مستقبلية للأنواع الأخرى.
- `Difficulty`: `BEGINNER`, `INTERMEDIATE`, `ADVANCED` (القيم النهائية تُثبت في Phase 1).
- `UserStatus`: `ACTIVE`, `DISABLED`.

## Integrity rules

- `public_id` لا يتغير عند تعديل question.
- لا hard delete لسؤال له attempts؛ يستخدم `DISABLED`.
- حذف topic مسموح فقط عندما لا توجد questions مرتبطة، أو يتحول إلى disabled حسب policy.