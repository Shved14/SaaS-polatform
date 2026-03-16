# 🚨 СРОЧНОЕ ИСПРАВЛЕНИЕ ПРИГЛАШЕНИЙ - ВЫПОЛНИТЬ НЕМЕДЛЕННО!

## Проблема
- ❌ `GET https://saas-platform.ru/invite/TOKEN 404`
- ❌ `POST https://saas-platform.ru/api/user/invitations 404`
- ❌ Приглашения не работают

## Причина
На сервере развернут старый код без новых endpoint'ов для приглашений

## ⚡ БЫСТРОЕ РЕШЕНИЕ (5 минут)

Выполнить на сервере:

```bash
cd /var/www/SaaS-polatform

# 1. Убедиться что все изменения загружены
git pull origin main

# 2. Удалить конфликтующий маршрут (ВАЖНО!)
rm -rf app/invite/\[token\]

# 3. Проверить структуру
ls -R app/invite/
# Должно быть только:
# app/invite/
# └── [workspaceId]/
#     └── [token]/
#         └── page.tsx

# 4. Очистить кэш полностью
rm -rf .next
rm -rf node_modules/.cache

# 5. Установить зависимости на всякий случай
npm install

# 6. Собрать проект
npm run build

# 7. Перезапустить
pm2 restart saas-platform

# 8. Проверить статус
pm2 status
pm2 logs saas-platform --lines 10
```

## 🔍 ПРОВЕРКА ПОСЛЕ ИСПРАВЛЕНИЯ

### 1. Проверить endpoint'ы:
```bash
# Тестовый API
curl https://saas-platform.ru/api/test/invitations

# Проверить основной API
curl -X POST https://saas-platform.ru/api/user/invitations \
  -H "Content-Type: application/json" \
  -d '{"invitationId":"test"}'
```

### 2. Проверить страницу приглашений:
```bash
curl https://saas-platform.ru/invite/test-token
```

### 3. Проверить логи:
```bash
pm2 logs saas-platform --lines 50
```

## 📧 ПРОВЕРИТЬ РАБОТУ ПРИГЛАШЕНИЙ

1. **Отправить приглашение** через UI
2. **Перейти по ссылке** из email
3. **Принять через уведомления** в колокольчике
4. **Проверить редирект** в workspace

## 🚨 ЕСЛИ ОШИБКИ ОСТАЛИСЬ

### Проверить права доступа:
```bash
ls -la app/invite/
chmod -R 755 app/invite/
```

### Проверить переменные окружения:
```bash
cat .env | grep NEXT_PUBLIC_APP_URL
# Должно быть: NEXT_PUBLIC_APP_URL="https://saas-platform.ru"
```

### Проверить базу данных:
```bash
npx prisma db push
```

## 📋 СТРУКТУРА КОТА ДОЛЖНА БЫТЬ:

```
app/
├── api/
│   ├── user/
│   │   └── invitations/
│   │       └── route.ts          ✅ POST/GET/DELETE
│   └── invitations/
│       └── [token]/
│           └── route.ts          ✅ GET/POST по токену
└── invite/
    └── [workspaceId]/
        └── [token]/
            └── page.tsx          ✅ Страница принятия
```

## 🎯 ЧТО ДОЛЖНО РАБОТАТЬ ПОСЛЕ ИСПРАВЛЕНИЯ:

- ✅ `https://saas-platform.ru/invite/TOKEN` → страница принятия
- ✅ `POST /api/user/invitations` → принятие через уведомления  
- ✅ `GET /api/invitations/TOKEN` → получение инфы о приглашении
- ✅ Редирект в workspace после принятия
- ✅ Нет 404 ошибок в консоли

## ⏰ ВРЕМЯ ВЫПОЛНЕНИЯ: 5-10 МИНУТ

**ВЫПОЛНИТЬ НЕМЕДЛЕННО!** 🚀
