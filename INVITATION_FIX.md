# 🚀 Исправление приглашений - Инструкция по развертыванию

## 📋 Проблемы которые были исправлены:

### 1. ✅ Скачивание файлов с кириллическими именами
- **Проблема**: `TypeError: Cannot convert argument to a ByteString because the character at index 22 has a value of 1053 which is greater than 255`
- **Решение**: Правильное кодирование `Content-Disposition` заголовка по RFC 5987
- **Файлы**: `app/api/attachments/[id]/download/route.ts`

### 2. ✅ API endpoint для приглашений
- **Проблема**: `POST https://saas-platform.ru/api/user/invitations 404 (Not Found)`
- **Решение**: Endpoint существовал, но на сервере был старый код
- **Файлы**: `app/api/user/invitations/route.ts` (уже существовал)

### 3. ✅ Email ссылки для приглашений
- **Проблема**: Email ссылки вели на 404 ошибку
- **Решение**: Создан новый endpoint и страница для принятия приглашений
- **Файлы**: 
  - `app/api/invitations/[token]/route.ts` (новый)
  - `app/invite/[token]/page.tsx` (новый)
  - `app/invite/[workspaceId]/[token]/page.tsx` (для обратной совместимости)

### 4. ✅ Улучшена обработка ошибок
- **Проблема**: Нет детальной информации об ошибках
- **Решение**: Добавлено логирование и понятные сообщения об ошибках
- **Файлы**: `components/notifications/NotificationBell.tsx`

## 🔧 Что нужно сделать на сервере:

### 1. Обновить код
```bash
cd /var/www/SaaS-polatform
git pull
npm run build
pm2 restart saas-platform
```

### 2. Проверить переменные окружения
Убедитесь что в `.env` файле есть:
```env
NEXT_PUBLIC_APP_URL="https://saas-platform.ru"
RESEND_API_KEY="your_resend_api_key"
RESEND_FROM="TaskFlow <noreply@saas-platform.ru>"
```

### 3. Проверить работу API
```bash
# Тестовый endpoint
curl https://saas-platform.ru/api/test/invitations

# Проверить скачивание файлов
curl -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
     https://saas-platform.ru/api/attachments/ATTACHMENT_ID/download
```

## 📧 Как теперь работают приглашения:

### 1. Отправка приглашения
- Owner нажимает "Invite" в workspace settings
- Система создает `WorkspaceInvitation` в базе данных
- Отправляет email с ссылкой `https://saas-platform.ru/invite/TOKEN`

### 2. Принятие приглашения из email
- Пользователь переходит по ссылке из email
- Открывается страница `/invite/TOKEN` с деталями приглашения
- Пользователь нажимает "Accept" (если авторизован) или входит в систему
- Система добавляет пользователя в workspace и редиректит в `/app/workspace/{id}`

### 3. Принятие через уведомления
- Пользователь видит уведомление в колокольчике
- Нажимает "Просмотреть" → вызов `/api/user/invitations` POST
- Успешное принятие → редирект в workspace

## 🧪 Тестирование:

### 1. Тест скачивания файлов
```bash
# 1. Загрузите файл с кириллическим именем в задачу
# 2. Попробуйте скачать его
# 3. Проверьте логи: pm2 logs saas-platform --lines 20
```

### 2. Тест приглашений
```bash
# 1. Отправьте приглашение на email
# 2. Перейдите по ссылке из email
# 3. Примите приглашение
# 4. Проверьте что пользователь появился в workspace
```

### 3. Тест уведомлений
```bash
# 1. Отправьте приглашение пользователю который уже в системе
# 2. Пользователь должен увидеть уведомление в колокольчике
# 3. Нажмите "Просмотреть" - должен редирект в workspace
```

## 🚨 Если что-то не работает:

### 1. Проверьте логи
```bash
pm2 logs saas-platform --lines 50
```

### 2. Проверьте права доступа
```bash
ls -la public/uploads/
chmod -R 755 public/uploads/
```

### 3. Проверьте базу данных
```bash
npx prisma studio
# Посмотрите таблицы: WorkspaceInvitation, Notification, WorkspaceMember
```

### 4. Проверьте email конфигурацию
```bash
# Убедитесь что RESEND_API_KEY правильный
# Проверьте что email отправляется
```

## 📊 Структура URL:

- **Новые email ссылки**: `https://saas-platform.ru/invite/TOKEN`
- **Старые email ссылки**: `https://saas-platform.ru/invite/workspaceId/TOKEN` (редирект)
- **API для уведомлений**: `https://saas-platform.ru/api/user/invitations`
- **API для принятия**: `https://saas-platform.ru/api/invitations/TOKEN`

## ✅ После развертывания проверьте:

1. [ ] Скачивание файлов с кириллическими именами
2. [ ] Отправка и принятие приглашений через email
3. [ ] Принятие приглашений через уведомления
4. [ ] Редирект в workspace после принятия
5. [ ] Отсутствие 404 ошибок в консоли

Все готово для продакшена! 🎉
