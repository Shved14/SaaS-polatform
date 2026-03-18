"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bell, MessageSquare, Clock, AlertTriangle, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface NotificationSettingsData {
  id: string;
  userId: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  taskAssigned: boolean;
  taskComment: boolean;
  taskDeadlineToday: boolean;
  taskOverdue: boolean;
  workspaceInvitation: boolean;
  taskCreated: boolean;
}

const settingsConfig = [
  {
    key: "taskAssigned" as const,
    label: "Назначение задач",
    description: "Уведомления, когда вам назначают задачу",
    icon: Bell,
  },
  {
    key: "taskComment" as const,
    label: "Комментарии к задачам",
    description: "Уведомления о новых комментариях в задачах",
    icon: MessageSquare,
  },
  {
    key: "taskCreated" as const,
    label: "Новые задачи в команде",
    description: "Уведомления о создании задач в вашем workspace",
    icon: Sparkles,
  },
  {
    key: "taskDeadlineToday" as const,
    label: "Напоминания о дедлайнах",
    description: "Уведомления, когда срок задачи наступает сегодня",
    icon: Clock,
  },
  {
    key: "taskOverdue" as const,
    label: "Просроченные задачи",
    description: "Уведомления о просроченных задачах",
    icon: AlertTriangle,
  },
  {
    key: "workspaceInvitation" as const,
    label: "Приглашения в workspace",
    description: "Уведомления о приглашениях в рабочие пространства",
    icon: Users,
  },
];

export default function NotificationSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<NotificationSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/notifications/settings");
        if (res.ok) {
          setSettings(await res.json());
        }
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function updateSetting(key: keyof NotificationSettingsData, value: boolean) {
    if (!settings) return;
    const updated = { ...settings, [key]: value };
    setSettings(updated);

    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/notifications/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value })
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8 text-center">
        <p className="text-muted-foreground">Не удалось загрузить настройки</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Button variant="outline" asChild className="mb-6">
        <Link href="/app/dashboard">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад
        </Link>
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Настройки уведомлений</h1>
        <p className="text-muted-foreground mt-1">
          Управляйте тем, какие уведомления вы хотите получать
        </p>
      </div>

      {/* General settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Каналы доставки</CardTitle>
          <CardDescription>Выберите, как вы хотите получать уведомления</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Push уведомления</p>
                <p className="text-xs text-muted-foreground">Браузерные push-уведомления</p>
              </div>
            </div>
            <Switch
              checked={settings.pushEnabled}
              onCheckedChange={(v) => updateSetting("pushEnabled", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Event settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Типы уведомлений</CardTitle>
          <CardDescription>Включите или отключите уведомления по типам событий</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settingsConfig.map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
              <Switch
                checked={settings[item.key]}
                onCheckedChange={(v) => updateSetting(item.key, v)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Save status */}
      <div className="mt-4 text-center text-xs text-muted-foreground h-5">
        {saving && "Сохранение..."}
        {saved && "✓ Сохранено"}
      </div>
    </div>
  );
}
