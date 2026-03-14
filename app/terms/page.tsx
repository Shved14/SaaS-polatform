import { Container } from "@/components/layout/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, FileText, CreditCard, AlertTriangle, Mail, Lock, Scale } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
  return (
    <Container className="py-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-[11px] font-medium text-secondary-foreground">
            <FileText className="h-3 w-3" />
            Условия сервиса
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Условия использования TaskFlow
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Последнее обновление: {new Date().toLocaleDateString('ru-RU', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </p>
        </div>

        {/* Introduction */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              1. Введение
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Добро пожаловать в TaskFlow — платформу для управления задачами и проектами. 
              Эти условия использования («Условия») регулируют ваш доступ к и использование нашего сервиса.
            </p>
            <p className="text-sm text-muted-foreground">
              Используя TaskFlow, вы подтверждаете, что прочитали, поняли и согласны соблюдать эти Условия. 
              Если вы не согласны с этими Условиями, пожалуйста, не используйте наш сервис.
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Ключевые моменты:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>TaskFlow предоставляет услуги управления задачами и проектами</li>
                <li>Мы обрабатываем ваши данные в соответствии с нашей политикой конфиденциальности</li>
                <li>Вы несете ответственность за безопасность своего аккаунта</li>
                <li>Некоторые функции могут требовать платной подписки</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* User Accounts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              2. Пользовательские аккаунты
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm mb-2">Регистрация аккаунта</h4>
                <p className="text-sm text-muted-foreground">
                  Для использования TaskFlow вам необходимо создать аккаунт, предоставив достоверную и полную информацию. 
                  Вы несете ответственность за сохранение конфиденциальности данных вашего аккаунта.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-2">Безопасность аккаунта</h4>
                <p className="text-sm text-muted-foreground">
                  Вы обязуетесь:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside mt-2">
                  <li>Не предоставлять доступ к своему аккаунту третьим лицам</li>
                  <li>Использовать надежный пароль и регулярно его обновлять</li>
                  <li>Немедленно сообщать нам о несанкционированном доступе</li>
                  <li>Не использовать аккаунты других лиц</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-2">Прекращение аккаунта</h4>
                <p className="text-sm text-muted-foreground">
                  Мы reserves the right to suspend or terminate your account if you violate these Terms 
                  or engage in fraudulent or illegal activities.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acceptable Use */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              3. Приемлемое использование
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Вы соглашаетесь использовать TaskFlow только для законных целей и в соответствии с этими Условиями.
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-medium text-sm text-green-800 dark:text-green-200 mb-2">Разрешено:</h4>
                <ul className="text-sm text-green-700 dark:text-green-300 space-y-1 list-disc list-inside">
                  <li>Управление личными и рабочими задачами</li>
                  <li>Создание проектов и команд</li>
                  <li>Совместная работа с коллегами</li>
                  <li>Использование всех доступных функций</li>
                </ul>
              </div>
              
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <h4 className="font-medium text-sm text-red-800 dark:text-red-200 mb-2">Запрещено:</h4>
                <ul className="text-sm text-red-700 dark:text-red-300 space-y-1 list-disc list-inside">
                  <li>Размещение незаконного или оскорбительного контента</li>
                  <li>Спам и нежелательная рассылка</li>
                  <li>Попытки взлома системы</li>
                  <li>Нарушение прав интеллектуальной собственности</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              4. Конфиденциальность данных
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Мы ценим вашу конфиденциальность и обрабатываем ваши данные в соответствии с нашей 
              <Link href="/privacy" className="text-primary underline underline-offset-2 ml-1">
                Политикой конфиденциальности
              </Link>.
            </p>
            
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm mb-2">Какие данные мы собираем:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Имя, email и другие данные регистрации</li>
                  <li>Информация о созданных задачах и проектах</li>
                  <li>Данные об использовании сервиса</li>
                  <li>Техническая информация для улучшения сервиса</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-2">Ваши права:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Доступ к вашим персональным данным</li>
                  <li>Исправление неточных данных</li>
                  <li>Удаление аккаунта и связанных данных</li>
                  <li>Экспорт ваших данных</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              5. Платежи и подписки
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              TaskFlow предлагает как бесплатную, так и платные версии с дополнительными функциями.
            </p>
            
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm mb-2">Бесплатная версия:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Базовые функции управления задачами</li>
                  <li>Ограниченное количество проектов</li>
                  <li>Стандартная поддержка</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-2">Платная подписка:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Неограниченное количество проектов и задач</li>
                  <li>Расширенные функции совместной работы</li>
                  <li>Приоритетная поддержка</li>
                  <li>Дополнительные интеграции</li>
                </ul>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm">
                  <strong>Условия оплаты:</strong> Подписки оформляются на ежемесячной или годовой основе. 
                  Вы можете отменить подписку в любой момент. Отмена вступает в силу в конце текущего периода.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liability */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              6. Ответственность
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm mb-2">Наша ответственность:</h4>
                <p className="text-sm text-muted-foreground">
                  Мы стремимся предоставлять надежный сервис, но не гарантируем бесперебойную работу. 
                  TaskFlow предоставляется «как есть» без каких-либо гарантий.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-2">Ограничение ответственности:</h4>
                <p className="text-sm text-muted-foreground">
                  Ни при каких обстоятельствах мы не несем ответственности за косвенные, 
                  случайные или последующие убытки, возникшие в результате использования нашего сервиса.
                </p>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Максимальная ответственность компании перед вами ограничена суммой, 
                    уплаченной вами за подписку за последние 3 месяца.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              7. Связь с нами
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Если у вас есть вопросы по этим Условиям или использованию TaskFlow, пожалуйста, свяжитесь с нами:
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Поддержка:</h4>
                <p className="text-sm text-muted-foreground">
                  Email: support@taskflow.com
                </p>
                <p className="text-sm text-muted-foreground">
                  Время ответа: 24-48 часов
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Юридические вопросы:</h4>
                <p className="text-sm text-muted-foreground">
                  Email: legal@taskflow.com
                </p>
                <p className="text-sm text-muted-foreground">
                  Время ответа: 3-5 рабочих дней
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-4 pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            Эти Условия могут быть обновлены время от времени. Мы уведомим пользователей 
            о существенных изменениях через email или уведомления в приложении.
          </p>
          
          <div className="flex justify-center gap-4 text-sm">
            <Link href="/privacy" className="text-primary underline underline-offset-2">
              Политика конфиденциальности
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link href="/auth/signin" className="text-primary underline underline-offset-2">
              Вернуться к входу
            </Link>
          </div>
        </div>
      </div>
    </Container>
  );
}
