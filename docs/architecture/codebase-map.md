# Codebase Map

هذا هو الهيكل المستهدف، وليس شجرة ملفات منفذة بعد:

```text
CCNA-SaaS/
├── src/
│   ├── client/                 # React UI and feature pages
│   ├── server/                 # Express API and application services
│   └── shared/                 # DTOs, enums, shared validation contracts
├── database/
│   ├── schema/                 # Drizzle table definitions
│   ├── migrations/             # Versioned database migrations
│   └── seed/                   # Small fictional development dataset
├── public/                     # Static public assets only
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/                       # Portable engineering documentation
├── .env.example                # Safe environment template
├── package.json                # Commands and dependencies
└── README.md                   # Developer entry point
```

عند التنفيذ ستُضاف ملفات config مثل `tsconfig.json`, `vite.config.ts`, و`drizzle.config.ts`. يجب تحديث هذه الخريطة عند تغير الحدود المعمارية، لا عند كل ملف مكون صغير.