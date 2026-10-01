# Portable Deployment

التطبيق مصمم ليعمل خارج Replit عبر Node.js وPostgreSQL قياسيين.

## Required components

- Node.js 22 LTS runtime
- PostgreSQL compatible database
- Environment variables من `.env.example`
- Persistent/object storage عند تفعيل الصور
- Reverse proxy أو platform TLS في الإنتاج

## Deployment shape

```text
Reverse proxy / platform
  -> Node application process
  -> PostgreSQL
  -> object storage adapter (when enabled)
```

يمكن لاحقًا بناء Docker image دون تغيير domain logic، بشرط إبقاء migrations وconfiguration واضحة. لا يفترض التطبيق مسارات Replit أو خدمات Replit الخاصة.

## Migration checklist

1. توفير PostgreSQL ونسخة backup.
2. توفير environment variables.
3. تثبيت dependencies من lockfile.
4. تشغيل migrations.
5. تشغيل health checks.
6. تشغيل seed فقط في بيئة development.
7. تكوين TLS وsecure cookies.
8. تكوين logs وmonitoring.