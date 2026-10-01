# Configuration

كل إعداد تشغيلي يقرأ من environment عبر طبقة configuration واحدة تتحقق من القيم عند startup. لا تتوزع قراءة `process.env` داخل business logic.

المتغيرات المخططة موثقة في [`deployment/environment.md`](../deployment/environment.md) و`.env.example`. لا توجد أسرار حقيقية في المستودع.