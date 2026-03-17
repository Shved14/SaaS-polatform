"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Bell } from "lucide-react";

interface NotificationSettings {
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
  createdAt: string;
  updatedAt: string;
}

interface NotificationSettingsProps {
  className?: string;
}

export function NotificationSettings({ className }: NotificationSettingsProps) {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function loadSettings() {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    if (!settings) return;

    try {
      setSaving(true);
      const res = await fetch("/api/notifications/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setOpen(false);
      }
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (open) {
      void loadSettings();
    }
  }, [open]);

  function updateSetting<K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  }

  if (loading || !settings) {
    return (
      <div className={className}>
        <Button variant="ghost" size="sm" disabled>
          <Bell className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className={className}>
          <Bell className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Настройки уведомлений</DialogTitle>
          <DialogDescription>
            Выберите, какие уведомления вы хотите получать
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-enabled" className="text-sm font-medium">
              Email уведомления
            </Label>
            <input
              id="email-enabled"
              type="checkbox"
              checked={settings.emailEnabled}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSetting("emailEnabled", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="push-enabled" className="text-sm font-medium">
              Push уведомления
            </Label>
            <input
              id="push-enabled"
              checked={settings.pushEnabled}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSetting("pushEnabled", e.target.checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="task-assigned" className="text-sm font-medium">
              Назначение задач
            </Label>
            <input
              id="task-assigned"
              checked={settings.taskAssigned}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSetting("taskAssigned", e.target.checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="task-comment" className="text-sm font-medium">
              Комментарии к задачам
            </Label>
            <input
              id="task-comment"
              checked={settings.taskComment}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSetting("taskComment", e.target.checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="task-created" className="text-sm font-medium">
              Новые задачи в команде
            </Label>
            <input
              id="task-created"
              checked={settings.taskCreated}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSetting("taskCreated", e.target.checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="task-deadline" className="text-sm font-medium">
              Напоминания о дедлайнах
            </Label>
            <input
              id="task-deadline"
              checked={settings.taskDeadlineToday}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSetting("taskDeadlineToday", e.target.checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="task-overdue" className="text-sm font-medium">
              Просроченные задачи
            </Label>
            <input
              id="task-overdue"
              checked={settings.taskOverdue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSetting("taskOverdue", e.target.checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="workspace-invitation" className="text-sm font-medium">
              Приглашения в workspace
            </Label>
            <input
              id="workspace-invitation"
              checked={settings.workspaceInvitation}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSetting("workspaceInvitation", e.target.checked)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? "Сохранение..." : "Сохранить"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
