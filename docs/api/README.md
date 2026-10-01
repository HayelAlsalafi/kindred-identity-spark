# API Design

الـ foundation الحالية تنفذ endpoints الثلاثة المعلّمة أدناه. بقية مسارات SaaS الواردة في التصميم المعماري ما زالت مخططة ولم تُضف إلى العقد.

## Conventions

- Base path: `/api/v1`
- JSON request/response
- Session cookie authentication
- Pagination: `limit` محدود و`cursor` أو `page`
- Error format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {}
  }
}
```

## Public and authenticated routes

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/healthz` | none | implemented process health |
| GET | `/topics` | none in foundation | implemented active topics |
| GET | `/dashboard/summary` | none in foundation | implemented foundation summary |

The response contracts are generated from `lib/api-spec/openapi.yaml` and validated in server routes with `@workspace/api-zod`.

### `GET /healthz`

- **Purpose:** confirms the API process is responding.
- **Request:** no parameters or body.
- **Response:** `{ "status": "ok" }`.
- **Errors:** not explicitly customized in this foundation.

### `GET /topics`

- **Purpose:** returns active topics ordered by `displayOrder`, then name.
- **Request:** no parameters or body.
- **Response:** array of `TopicSummary` objects.
- **Current values:** question and progress metrics are zero because questions and attempts are not implemented.
- **Errors:** database failures are handled by the server error path; no synthetic fallback is returned.

### `GET /dashboard/summary`

- **Purpose:** returns the foundation dashboard aggregate.
- **Request:** no parameters or body.
- **Response:** `DashboardSummary` with active topic count and first ordered topic as `focusTopic`.
- **Current values:** question, attempt, accuracy, study time, and streak metrics are zero until later phases.
- **Errors:** database failures are handled by the server error path; no synthetic fallback is returned.

## Planned admin routes

These routes are not implemented. When implemented, every route must require authenticated `ADMIN` role:

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/admin/overview` | dashboard aggregates |
| GET/POST | `/admin/topics` | list/create topics |
| PATCH | `/admin/topics/:topicId` | edit/disable/reorder topic |
| GET | `/admin/questions` | paginated search/filter |
| POST | `/admin/questions` | create question |
| GET | `/admin/questions/:questionId` | admin preview |
| PATCH | `/admin/questions/:questionId` | edit question |
| POST | `/admin/questions/:questionId/images` | attach image metadata/file |
| DELETE | `/admin/questions/:questionId` | deactivate when policy allows |
| GET | `/admin/users` | paginated users |
| GET | `/admin/users/:userId/statistics` | basic user statistics |

## Planned attempt submission contract

Planned request:

```json
{
  "questionId": "uuid",
  "selectedOptionId": "uuid",
  "startedAt": "2026-09-26T10:00:00.000Z"
}
```

The server loads the question and correct option, computes correctness, records authoritative `submittedAt`, and stores duration. The response includes `isCorrect`, selected/correct option identifiers, explanation, and attempt metadata without exposing unrelated user data.

## Current validation and security

- Implemented foundation routes validate response payloads with generated Zod schemas.
- Authentication and authorization are not implemented yet.
- Question ID and attempt protections are planned for the question engine phase.