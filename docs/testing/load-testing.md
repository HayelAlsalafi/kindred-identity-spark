# Load Testing Strategy

لم تُجرَ اختبارات حمل ولا توجد أرقام concurrent users معتمدة.

## Scenarios

- concurrent login traffic
- concurrent question reads
- concurrent answer submissions
- admin search/filter traffic
- large question bank pagination
- large attempts aggregation
- database connection saturation

## Measurements

تُقاس RPS، p50/p95/p99 latency، error rate، CPU، memory، database CPU، connection count، query duration، attempts/day، ونمو الصور.

## Method

استخدم أداة قابلة للتكرار مثل k6 أو Artillery في بيئة staging ببيانات synthetic، مع baseline ثم زيادات تدريجية. لا تُجرى اختبارات ضغط على production دون خطة وموافقة.

## Exit criteria

لا نعلن رقم سعة قبل وجود workload موثق، بيئة محددة، نتائج محفوظة، وحدود فشل واضحة.