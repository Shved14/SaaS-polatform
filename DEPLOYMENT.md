# 🚀 Развертывание SaaS Platform на сервере

## 📋 Требования
- Ubuntu/Debian VPS с root доступом
- PostgreSQL база данных установлена и запущена
- Nginx установлен
- Node.js 18+ установлен
- Доменное имя указывает на ваш сервер

## 🇷🇺 Русская инструкция по развертыванию

### 1. Подготовка сервера
```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установка PostgreSQL
sudo apt install postgresql postgresql-contrib
sudo -u postgres createuser --interactive
sudo -u postgres createdb saas_platform

# Установка Nginx
sudo apt install nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2. Клонирование проекта
```bash
cd /var/www
git clone <your-repo-url> SaaS-polatform
cd SaaS-polatform
```

### 3. Настройка окружения
```bash
# Создание .env файла
cp .env.example .env
nano .env
```

Обязательно установите в `.env`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/saas_platform"
NEXTAUTH_URL="https://saas-platform.ru"
AUTH_SECRET="your_32_character_secret_here"
NODE_ENV="production"
COOKIE_DOMAIN=".saas-platform.ru"

# OAuth провайдеры (опционально)
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""

# Email (опционально)
RESEND_API_KEY="your_resend_api_key"
RESEND_FROM="TaskFlow <noreply@saas-platform.ru>"
```

### 4. Установка зависимостей и сборка
```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
```

### 5. Настройка прав доступа к файлам
```bash
# Проверка структуры директорий
node scripts/check-uploads.js

# Создание директории для загрузок
mkdir -p public/uploads/tasks
chmod 755 public/uploads/tasks

# Установка прав для веб-сервера
sudo chown -R www-data:www-data public/uploads/
chmod -R 755 public/uploads/
```

### 6. Установка PM2 и запуск
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 7. Настройка Nginx
Создать файл `/etc/nginx/sites-available/saas-platform.ru`:
```nginx
server {
    listen 80;
    server_name saas-platform.ru www.saas-platform.ru;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # ВАЖНО: для корректной работы скачивания файлов
    location /uploads/ {
        alias /var/www/SaaS-polatform/public/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Активировать сайт:
```bash
sudo ln -s /etc/nginx/sites-available/saas-platform.ru /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 8. Настройка SSL
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d saas-platform.ru -d www.saas-platform.ru
```

## 🛠️ Решение проблем со скачиванием файлов

### Проблема: Файлы не скачиваются, ошибка 404

**Причина**: Часто проблема в правах доступа к директории `public/uploads/` или неправильной структуре путей.

**Решение 1: Проверка прав доступа**
```bash
# Проверить текущие права
ls -la public/uploads/

# Установить правильные права
sudo chown -R www-data:www-data public/uploads/
chmod -R 755 public/uploads/
```

**Решение 2: Проверка структуры директорий**
```bash
# Запустить скрипт диагностики
node scripts/check-uploads.js

# Вывод должен показать:
# - Public directory: /var/www/SaaS-polatform/public
# - Uploads directory exists: true
# - Task directories: [список ID задач]
# - Files in each directory: [имена файлов]
```

**Решение 3: Проверка логов**
```bash
# Логи PM2
pm2 logs saas-platform --lines 50

# Логи Nginx  
sudo tail -f /var/log/nginx/error.log

# Проверить логи скачивания файлов
grep "Error reading file" /var/log/pm2/saas-platform.log
```

**Решение 4: Отладка через API**
```bash
# Тестировать endpoint скачивания
curl -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
     -I https://saas-platform.ru/api/attachments/ATTACHMENT_ID/download
```

### Диагностическое логирование в коде

В файле `app/api/attachments/[id]/download/route.ts` добавлено детальное логирование:
- Путь к файлу который пытается прочитать
- Данные вложения из базы данных
- Ошибки чтения файла
- Содержимое директории uploads

**Пример лога при ошибке:**
```
Attempting to read file from: /var/www/SaaS-polatform/public/uploads/tasks/TASK_ID/12345_filename.pdf
Attachment data: {
  id: "407a8ea5-921a-448a-bdb4-56023cc304dc",
  path: "/uploads/tasks/TASK_ID/12345_filename.pdf",
  originalName: "document.pdf",
  contentType: "application/pdf",
  size: 123456
}
Error reading file: Error: ENOENT: no such file or directory
File path attempted: /var/www/SaaS-polatform/public/uploads/tasks/TASK_ID/12345_filename.pdf
```

## 🔧 Обслуживание и обновления

### Обновление приложения
```bash
cd /var/www/SaaS-polatform
git pull
npm ci --production
npm run build
pm2 restart saas-platform
```

### Обновление базы данных
```bash
npx prisma migrate deploy
npx prisma generate
pm2 restart saas-platform
```

## � Мониторинг

### Статус PM2
```bash
pm2 status
pm2 logs saas-platform
pm2 monit
```

### Просмотр логов
```bash
# Последние 100 строк логов
pm2 logs saas-platform --lines 100

# Логи Nginx в реальном времени
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 🔐 Безопасность

- [ ] Изменить пароли по умолчанию
- [ ] Настроить firewall (ufw)
- [ ] Установить fail2ban
- [ ] Настроить регулярные бэкапы
- [ ] Мониторить логи
- [ ] Обновлять зависимости

## ✅ Проверка работоспособности

После развертывания проверьте:
1. **Основная страница**: `https://saas-platform.ru`
2. **Аутентификация**: вход/регистрация работают
3. **Создание рабочего пространства**
4. **Создание доски и задач**
5. **Загрузка файлов в задачи**
6. **СКАЧИВАНИЕ ФАЙЛОВ** ⭐
7. **Изменение названия рабочего пространства**

Ваш SaaS платформа готова! 🎉
