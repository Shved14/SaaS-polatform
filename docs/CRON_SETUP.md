# Настройка Cron Job для проверки дедлайнов

## Обзор

Cron job `/api/cron/deadlines` должен запускаться ежедневно для проверки задач с истекающими дедлайнами и создания соответствующих уведомлений.

## Переменные окружения

Добавьте в `.env` файл:
```env
CRON_SECRET=your-secret-key-here
```

## Варианты настройки

### 1. Vercel Cron Jobs (рекомендуется)

Создайте файл `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/deadlines",
      "schedule": "0 8 * * *"
    }
  ]
}
```

### 2. Linux Cron

Откройте crontab:
```bash
crontab -e
```

Добавьте строку:
```bash
0 8 * * * curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/cron/deadlines
```

### 3. GitHub Actions

Создайте `.github/workflows/deadline-check.yml`:
```yaml
name: Deadline Check

on:
  schedule:
    - cron: '0 8 * * *'  # Каждый день в 8:00 UTC

jobs:
  deadline-check:
    runs-on: ubuntu-latest
    steps:
      - name: Check deadlines
        run: |
          curl -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
               https://your-domain.com/api/cron/deadlines
```

### 4. Node.js Cron (для разработки)

Добавьте в корень проекта `cron.js`:
```javascript
const cron = require('node-cron');
const https = require('https');

cron.schedule('0 8 * * *', () => {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/cron/deadlines',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.CRON_SECRET}`
    }
  };

  const req = https.request(options, (res) => {
    console.log(`Deadline check status: ${res.statusCode}`);
  });

  req.end();
});

console.log('Deadline checker started');
```

## Логирование

Cron job логирует результаты в консоль:
```json
{
  "success": true,
  "processed": {
    "dueToday": 5,
    "overdue": 2
  }
}
```

## Мониторинг

### 1. Health check endpoint

Добавьте `/api/cron/health`:
```typescript
export const GET = async () => {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    lastCheck: "2024-03-17T08:00:00Z" // Из базы данных
  });
};
```

### 2. Логи в файл

Модифицируйте `/api/cron/deadlines`:
```typescript
import fs from 'fs';

// В конце функции
const logEntry = {
  timestamp: new Date().toISOString(),
  result: {
    dueToday: tasksDueToday.length,
    overdue: overdueTasks.length
  }
};

fs.appendFileSync('deadline-checks.log', JSON.stringify(logEntry) + '\n');
```

## Безопасность

1. **Секретный ключ** - Всегда используйте `CRON_SECRET`
2. **HTTPS** - В production используйте только HTTPS
3. **Rate limiting** - Cron job обходит ограничения
4. **IP whitelist** - Ограничьте доступ к cron эндпоинтам

## Тестирование

### Локальный тест:
```bash
curl -H "Authorization: Bearer your-secret" \
     http://localhost:3000/api/cron/deadlines
```

### Production тест:
```bash
curl -H "Authorization: Bearer your-secret" \
     https://your-domain.com/api/cron/deadlines
```

## Устранение неполадок

### Проблема: Нет уведомлений
1. Проверьте настройки пользователя в `/api/notifications/settings`
2. Убедитесь что `taskDeadlines: true`
3. Проверьте логи cron job

### Проблема: Cron не запускается
1. Проверьте правильность URL
2. Убедитесь что `CRON_SECRET` установлен
3. Проверьте логи платформы (Vercel, GitHub Actions)

### Проблема: Ошибка 401 Unauthorized
1. Проверьте что заголовок `Authorization` правильный
2. Убедитесь что `CRON_SECRET` совпадает

## Альтернативные решения

### 1. Database Trigger
```sql
CREATE OR REPLACE FUNCTION check_deadlines()
RETURNS TRIGGER AS $$
BEGIN
  -- Логика проверки дедлайнов
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deadline_check_trigger
AFTER UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION check_deadlines();
```

### 2. Queue System
Используйте Redis Queue или Bull Queue для асинхронной обработки.

## Производительность

1. **Batch processing** - Обрабатывайте задачи пачками
2. **Indexes** - Убедитесь что индексы по `deadline` существуют
3. **Optimized queries** - Используйте `IN` вместо множественных запросов
4. **Caching** - Кэшируйте результаты проверки

## Мониторинг и алерты

### Prometheus + Grafana
```typescript
// В cron endpoint
const metrics = {
  deadline_checks_total: 1,
  tasks_due_today: tasksDueToday.length,
  tasks_overdue: overdueTasks.length
};

// Отправка в Prometheus
```

### Email алерты
```typescript
if (overdueTasks.length > 10) {
  await NotificationService.sendEmail(
    adminEmail,
    "Много просроченных задач",
    `Обнаружено ${overdueTasks.length} просроченных задач`
  );
}
```
