# Security Model

## Implemented

لا توجد ضوابط منفذة بعد؛ هذا القسم يصف متطلبات التنفيذ.

## Threats and controls

| Threat | Planned control |
| --- | --- |
| Unauthorized admin access | Server-side role policy on every admin route |
| Password theft | Argon2id, never return or log hashes |
| Session theft | HTTP-only secure cookie, hashed server-side sessions, expiry |
| Mass assignment | Explicit request DTOs and service-level allowlists |
| Invalid answer manipulation | Server loads correct answer and calculates result |
| SQL injection | Drizzle parameterization and validated query inputs |
| Brute-force login | Future rate limiting and lockout; basic validation in MVP |
| Large image upload | MIME/size/dimension validation and storage adapter |
| Data leakage | Response DTOs omit secrets and unrelated user records |
| XSS | React escaping, careful rendering of question text, CSP review |
| CSRF | SameSite cookie plus CSRF strategy if cross-site mutation is introduced |

## Secret management

الأسرار تأتي من environment أو secret manager. `.env.example` يحوي placeholders فقط. لا تُحفظ credentials داخل git أو logs.

## Future hardening

2FA، email verification، password reset، audit logs، distributed rate limiting، dependency scanning، وsecurity review قبل الإنتاج.