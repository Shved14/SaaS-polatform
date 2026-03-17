# Система уведомлений TaskFlow

## Обзор

Полноценная система уведомлений с настраиваемыми оповещениями, поддержкой email и realtime обновлений.

## Типы уведомлений

### 1. Приглашения в workspace (`WORKSPACE_INVITATION`)
- **Триггер**: Приглашение пользователя в workspace
- **Получатели**: Приглашенный пользователь
- **Действия**: Принять/Отклонить

### 2. Назначение задач (`TASK_ASSIGNED`)
- **Триггер**: Назначение пользователя исполнителем задачи
- **Получатели**: Исполнитель задачи
- **Навигация**: Переход к задаче

### 3. Комментарии к задачам (`TASK_COMMENT_ADDED`)
- **Триггер**: Добавление комментария к задаче
- **Получатели**: Исполнитель и автор задачи
- **Навигация**: Переход к задаче

### 4. Дедлайны (`TASK_DEADLINE_TODAY`, `TASK_OVERDUE`)
- **Триггер**: Ежедневная проверка дедлайнов
- **Получатели**: Исполнители задач
- **Периодичность**: Ежедневно

## API эндпоинты

### GET /api/notifications
Получение списка уведомлений пользователя
```typescript
// Ответ
interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}
```

### POST /api/notifications/read
Пометка уведомлений как прочитанных
```typescript
// Запрос
{
  ids: string[] // Массив ID уведомлений
}

// Ответ
{
  success: true;
  markedCount: number;
}
```

### PUT /api/notifications/read
Пометка всех уведомлений как прочитанных
```typescript
// Ответ
{
  success: true;
  markedCount: number;
}
```

### GET /api/notifications/settings
Получение настроек уведомлений
```typescript
interface NotificationSettings {
  id: string;
  userId: string;
  emailNotifications: boolean;
  taskAssigned: boolean;
  taskComments: boolean;
  taskDeadlines: boolean;
  workspaceInvitations: boolean;
}
```

### PATCH /api/notifications/settings
Обновление настроек уведомлений
```typescript
// Запрос
{
  emailNotifications?: boolean;
  taskAssigned?: boolean;
  taskComments?: boolean;
  taskDeadlines?: boolean;
  workspaceInvitations?: boolean;
}
```

## Настройки пользователя

### Доступные опции:
- **Email уведомления** - Получение копий уведомлений на email
- **Назначение задач** - Уведомления о назначении задач
- **Комментарии к задачам** - Уведомления о новых комментариях
- **Напоминания о дедлайнах** - Уведомления о приближающихся дедлайнах
- **Приглашения в workspace** - Уведомления о приглашениях

## Realtime обновления

Frontend компонент `NotificationBell` автоматически обновляется каждые 30 секунд:
```typescript
useEffect(() => {
  void loadNotifications();
  const timer = setInterval(() => {
    void loadNotifications();
  }, 30_000);
  return () => clearInterval(timer);
}, []);
```

## Cron job для дедлайнов

Эндпоинт `/api/cron/deadlines` должен вызываться ежедневно:
```bash
# Пример вызова
curl -H "Authorization: Bearer $CRON_SECRET" \
     https://your-domain.com/api/cron/deadlines
```

## Интеграция в коде

### Создание уведомлений:
```typescript
import { NotificationService } from "@/lib/notification-service";

// Приглашение в workspace
await NotificationService.events.workspaceInvitation(
  userId,
  workspaceName,
  inviterName,
  invitationToken
);

// Назначение задачи
await NotificationService.events.taskAssigned(
  userId,
  taskTitle,
  boardName,
  workspaceName,
  taskId,
  boardId,
  workspaceId
);
```

## Навигация из уведомлений

Система автоматически перенаправляет пользователя:
- **Задачи**: `/app/workspace/{workspaceId}/board/{boardId}?task={taskId}`
- **Workspace**: `/app/workspace/{workspaceId}`
- **Приглашения**: Обрабатываются через кнопки принятия/отклонения

## Безопасность

1. **Валидация прав доступа** - Проверка доступа к workspace/задаче
2. **Rate limiting** - Защита от спама
3. **CSRF защита** - Проверка источника запросов
4. **Секретный ключ для cron** - Защита эндпоинта проверки дедлайнов

## Производительность

1. **Индексы в БД** - Оптимизация запросов уведомлений
2. **Лимит выборки** - 50 последних уведомлений
3. **Кэширование настроек** - Уменьшение запросов к БД
4. **Оптимистичные обновления** - Сразу обновляем UI при действиях

## Расширение системы

### Возможные улучшения:
1. **Push уведомления** - Интеграция с FCM/OneSignal
2. **WebSocket** - Реальное время вместо polling
3. **Каналы уведомлений** - Группировка по проектам
4. **Шаблоны** - Кастомизация текстов уведомлений
5. **Аналитика** - Статистика по уведомлениям

## Миграция существующих данных

При первом запуске система автоматически создает настройки по умолчанию для всех пользователей:
```typescript
const defaultSettings = {
  emailNotifications: true,
  taskAssigned: true,
  taskComments: true,
  taskDeadlines: true,
  workspaceInvitations: true
};
```
