# Indexes

الفهارس المقترحة عند إنشاء schema:

- `users(email)` unique.
- `roles(code)` unique.
- `sessions(token_hash)` unique و`(user_id, expires_at)`.
- `topics(slug)` unique و`(status, display_order)`.
- `questions(public_id)` unique، و`(topic_id, status)`، و`(difficulty, status)`، و`(created_at)`.
- `question_options(question_id, display_order)`.
- `question_images(question_id, display_order)`.
- `tags(slug)` و`tags(name)` unique.
- `attempts(user_id, created_at)`، `(user_id, question_id, created_at)`، `(question_id, created_at)`، و`(user_id, is_correct)`.

فهرس البحث النصي الكامل لا يُضاف قبل معرفة query الفعلية وحجم البيانات. يجب فحص query plans مع نمو بنك الأسئلة.