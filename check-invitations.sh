#!/bin/bash

echo "🔍 Проверка системы приглашений..."

# Проверить существование файлов
echo "📁 Проверка файлов:"
if [ -f "app/api/user/invitations/route.ts" ]; then
    echo "✅ app/api/user/invitations/route.ts"
else
    echo "❌ app/api/user/invitations/route.ts - НЕ НАЙДЕН"
fi

if [ -f "app/api/invitations/[token]/route.ts" ]; then
    echo "✅ app/api/invitations/[token]/route.ts"
else
    echo "❌ app/api/invitations/[token]/route.ts - НЕ НАЙДЕН"
fi

if [ -f "app/invite/[workspaceId]/[token]/page.tsx" ]; then
    echo "✅ app/invite/[workspaceId]/[token]/page.tsx"
else
    echo "❌ app/invite/[workspaceId]/[token]/page.tsx - НЕ НАЙДЕН"
fi

if [ -d "app/invite/[token]" ]; then
    echo "❌ app/invite/[token] - КОНФЛИКТУЮЩАЯ ПАПКА, УДАЛИТЕ ЕЕ!"
else
    echo "✅ Конфликтующих папок нет"
fi

# Проверить переменные окружения
echo ""
echo "🌍 Переменные окружения:"
if grep -q "NEXT_PUBLIC_APP_URL" .env; then
    echo "✅ NEXT_PUBLIC_APP_URL найден"
    grep "NEXT_PUBLIC_APP_URL" .env
else
    echo "❌ NEXT_PUBLIC_APP_URL НЕ НАЙДЕН в .env"
fi

# Проверить статус PM2
echo ""
echo "🚀 Статус PM2:"
pm2 status

echo ""
echo "📝 Последние логи:"
pm2 logs saas-platform --lines 5

echo ""
echo "🔗 Проверка endpoint'ов:"
echo "GET https://saas-platform.ru/api/test/invitations"
echo "GET https://saas-platform.ru/invite/test-token"
