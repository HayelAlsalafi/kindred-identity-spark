# Scalability

## Current architecture

المرحلة الأولى تستهدف instance تطبيق واحدة وقاعدة PostgreSQL مُدارة أو محلية. هذا اختيار تشغيل MVP، وليس ادعاء high availability أو سعة معينة.

## Expected growth and bottlenecks

أكثر نقاط النمو احتمالًا:

- حجم `attempts` وعمليات الإحصاء.
- قوائم الأسئلة في لوحة الإدارة.
- صور الأسئلة.
- login وanswer submission تحت الحمل.
- حدود اتصالات PostgreSQL.

## Progressive path

### Stage 1 — MVP

Express stateless، PostgreSQL، pagination، indexes أساسية، structured logs، وhealth checks.

### Stage 2 — Growing user base

قياس latency وquery plans، connection pooling مضبوط، object storage للصور، caching اختياري لقائمة topics، وrate limiting موزع عند الحاجة.

### Stage 3 — Large user base

عدة application instances، cache خارجي إن أثبت القياس فائدته، background workers لتجميع الإحصاءات أو التقارير، ومراقبة متقدمة.

### Stage 4 — High traffic SaaS

توسعة أفقية مدروسة، read replicas عند تبريرها، CDN للصور، queue infrastructure، وعمليات release أكثر صرامة.

## Capacity measurements

قبل أي قرار سعة يجب قياس requests/sec، concurrent users، p95 latency، CPU والذاكرة، DB connections، error rate، growth of attempts، ونمو تخزين الصور.

## Future strategies

- **Caching:** topics metadata وconfiguration قد تُخزن مؤقتًا؛ لا تعتمد correctness على cache.
- **Background jobs:** imports، reports، image processing، وتجميع analytics.
- **Rate limiting:** login، password reset، answer submission، admin APIs، search.
- **Observability:** request IDs، latency، failed auth، database health، resource usage.
- **Media:** adapter يفصل `storage_key` عن provider، لتسهيل الانتقال إلى S3-compatible storage.