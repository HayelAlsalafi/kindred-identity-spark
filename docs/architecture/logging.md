# Logging and Observability

## MVP

يجب أن تكون السجلات structured وتحتوي عند الإمكان على:

- timestamp
- level
- request ID
- route
- status code
- duration
- safe actor identifier أو role عند الحاجة

## Never log

Passwords، password hashes، session IDs، cookies، access tokens، API keys، وpayloads الحساسة كاملة.

## Future

يمكن إضافة error tracking وmetrics وdistributed tracing بعد قياس الحاجة. health endpoints يجب أن تفرق بين process حي وdependency سليمة دون كشف تفاصيل البنية التحتية.