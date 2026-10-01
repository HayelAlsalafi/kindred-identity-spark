# Data Flow

## Submit answer

```text
Practice page
  -> POST /api/v1/attempts
  -> authenticate current user
  -> validate questionId and selected option
  -> load active question and option from database
  -> derive correctness server-side
  -> calculate submittedAt and duration from server timestamps
  -> insert immutable attempt
  -> return result DTO with explanation
  -> render correct/incorrect state
```

الـ frontend قد يرسل `startedAt` كمرجع لبدء العرض، لكن الخادم لا يثق بالمدة المحسوبة في المتصفح وحدها.

## Admin question creation

```text
Admin form
  -> POST /api/v1/admin/questions
  -> session + ADMIN policy
  -> validate DTO
  -> transaction: question + options + tags + image metadata
  -> return question summary
```

## Statistics

صفحات الإحصاءات تستدعي aggregation queries على `attempts` مرتبطة بـ `questions` و`topics`. لا تُنقل السجلات الخام كاملة إلى المتصفح.