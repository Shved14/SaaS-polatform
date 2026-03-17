"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2, Webhook, Settings, Plus, Trash2 } from "lucide-react";

interface Integration {
  id: string;
  type: string;
  webhookUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface IntegrationSettingsProps {
  workspaceId: string;
}

export function IntegrationSettings({ workspaceId }: IntegrationSettingsProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadIntegrations();
  }, [workspaceId]);

  async function loadIntegrations() {
    try {
      setLoading(true);
      const res = await fetch(`/api/workspaces/${workspaceId}/integrations`);
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data);
      }
    } catch (error) {
      console.error("Failed to load integrations:", error);
    } finally {
      setLoading(false);
    }
  }

  async function createIntegration(type: string) {
    if (!newWebhookUrl.trim()) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/workspaces/${workspaceId}/integrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          webhookUrl: newWebhookUrl.trim()
        })
      });

      if (res.ok) {
        await loadIntegrations();
        setNewWebhookUrl("");
      } else {
        const error = await res.json();
        alert(`Ошибка: ${error.error}`);
      }
    } catch (error) {
      console.error("Failed to create integration:", error);
      alert("Ошибка при создании интеграции");
    } finally {
      setSaving(false);
    }
  }

  async function updateIntegration(id: string, isActive: boolean, webhookUrl?: string) {
    try {
      setSaving(true);
      const res = await fetch(`/api/workspaces/${workspaceId}/integrations/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive,
          ...(webhookUrl && { webhookUrl })
        })
      });

      if (res.ok) {
        await loadIntegrations();
      } else {
        const error = await res.json();
        alert(`Ошибка: ${error.error}`);
      }
    } catch (error) {
      console.error("Failed to update integration:", error);
      alert("Ошибка при обновлении интеграции");
    } finally {
      setSaving(false);
    }
  }

  async function deleteIntegration(id: string) {
    if (!confirm("Вы уверены, что хотите удалить эту интеграцию?")) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/workspaces/${workspaceId}/integrations/${encodeURIComponent(id)}`, {
        method: "DELETE"
      });

      if (res.ok) {
        await loadIntegrations();
      } else {
        const error = await res.json();
        alert(`Ошибка: ${error.error}`);
      }
    } catch (error) {
      console.error("Failed to delete integration:", error);
      alert("Ошибка при удалении интеграции");
    } finally {
      setSaving(false);
    }
  }

  async function testWebhook(type: string) {
    try {
      setTesting(true);
      const res = await fetch(`/api/workspaces/${workspaceId}/integrations/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type })
      });

      const result = await res.json();
      if (res.ok) {
        alert(result.success ? "✅ Тестовое сообщение успешно отправлено!" : "❌ " + result.error);
      } else {
        alert("❌ " + result.error);
      }
    } catch (error) {
      console.error("Failed to test webhook:", error);
      alert("Ошибка при тестировании webhook");
    } finally {
      setTesting(false);
    }
  }

  const slackIntegration = integrations.find(i => i.type === "slack");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Интеграции
          </CardTitle>
          <CardDescription>
            Подключите внешние сервисы для автоматических уведомлений
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Slack Integration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">S</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Slack</h3>
                  <p className="text-sm text-muted-foreground">
                    Получайте уведомления о задачах в Slack
                  </p>
                </div>
              </div>
              {slackIntegration && (
                <Switch
                  checked={slackIntegration.isActive}
                  onCheckedChange={(checked: boolean) => updateIntegration(slackIntegration.id, checked)}
                />
              )}
            </div>

            {slackIntegration ? (
              <div className="space-y-3 pl-13 border-l-2">
                <div>
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input
                    id="webhook-url"
                    type="url"
                    placeholder="https://hooks.slack.com/services/..."
                    value={slackIntegration.webhookUrl}
                    onChange={(e) => updateIntegration(slackIntegration.id, slackIntegration.isActive, e.target.value)}
                    className="font-mono"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testWebhook("slack")}
                    disabled={testing}
                  >
                    {testing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Тестирование...
                      </>
                    ) : (
                      <>
                        <Webhook className="mr-2 h-4 w-4" />
                        Тестировать
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteIntegration(slackIntegration.id)}
                    disabled={saving}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Удалить
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="new-webhook-url">Slack Webhook URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="new-webhook-url"
                      type="url"
                      placeholder="https://hooks.slack.com/services/..."
                      value={newWebhookUrl}
                      onChange={(e) => setNewWebhookUrl(e.target.value)}
                      className="font-mono flex-1"
                    />
                    <Button
                      onClick={() => createIntegration("slack")}
                      disabled={saving || !newWebhookUrl.trim()}
                      size="sm"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Создание...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Подключить
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Чтобы создать Slack интеграцию, перейдите в{" "}
                  <a
                    href="https://api.slack.com/apps"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Slack Apps → Create New App
                  </a>
                  {" "}
                  и настройте Incoming Webhooks.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
