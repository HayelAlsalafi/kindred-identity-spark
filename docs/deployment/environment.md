# Environment Variables

هذه المتغيرات مخططة وليست مستخدمة بعد لأن التطبيق لم يُنفذ.

| Name | Required | Example | Purpose / usage | Security |
| --- | --- | --- | --- | --- |
| `NODE_ENV` | yes | `development` | runtime mode | لا تضع production بالخطأ محليًا |
| `PORT` | yes | `3000` | HTTP port | لا يحتوي سرًا |
| `DATABASE_URL` | yes | `postgresql://user:password@localhost:5432/ccna` | PostgreSQL pool | سر؛ لا تسجل أو تلتزم به |
| `SESSION_SECRET` | yes | `replace-with-random-secret` | cookie/session signing support | سر قوي، لا يُشارك |
| `SESSION_TTL_SECONDS` | no | `604800` | session expiry | قيمة تشغيلية |
| `CORS_ORIGIN` | yes | `http://localhost:5173` | allowed browser origin | لا تستخدم wildcard مع credentials |
| `UPLOAD_MAX_BYTES` | no | `5242880` | image upload limit | يحمي الموارد |
| `STORAGE_PROVIDER` | no | `local` | media adapter selection | لا يحتوي credential |
| `STORAGE_BUCKET` | no | `ccna-question-images` | object storage location | metadata فقط؛ credentials خارج الملف |

عند إضافة مزود تخزين يجب توثيق أسماء credentials في secret manager دون وضع قيم حقيقية في الوثائق.