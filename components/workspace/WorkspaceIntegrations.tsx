"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Webhook, 
  Slack, 
  TestTube, 
  Trash2, 
  Plus, 
  CheckCircle, 
  XCircle,
  Loader2
} from "lucide-react";

interface Integration {
  id: string;
  type: string;
  webhookUrl?: string;
  isActive: boolean;
  createdAt: string;
}

interface WorkspaceIntegrationsProps {
  workspaceId: string;
  integrations: Integration[];
  onAddIntegration: (type: string, webhookUrl: string) => Promise<void>;
  onTestIntegration: (integrationId: string) => Promise<{ success: boolean; message: string }>;
  onToggleIntegration: (integrationId: string, isActive: boolean) => Promise<void>;
  onDeleteIntegration: (integrationId: string) => Promise<void>;
}

export function WorkspaceIntegrations({
  workspaceId,
  integrations,
  onAddIntegration,
  onTestIntegration,
  onToggleIntegration,
  onDeleteIntegration,
}: WorkspaceIntegrationsProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState<{ [key: string]: boolean }>({});
  const [testResults, setTestResults] = useState<{ [key: string]: { success: boolean; message: string } }>({});

  const handleAddIntegration = async (type: string) => {
    if (!newWebhookUrl.trim()) return;

    setLoading(true);
    try {
      await onAddIntegration(type, newWebhookUrl.trim());
      setNewWebhookUrl("");
      setShowAddForm(false);
    } catch (error) {
      console.error("Failed to add integration:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestIntegration = async (integrationId: string) => {
    setTesting(prev => ({ ...prev, [integrationId]: true }));
    try {
      const result = await onTestIntegration(integrationId);
      setTestResults(prev => ({ ...prev, [integrationId]: result }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [integrationId]: { success: false, message: "Ошибка при тестировании" }
      }));
    } finally {
      setTesting(prev => ({ ...prev, [integrationId]: false }));
    }
  };

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case "slack":
        return <Slack className="h-5 w-5" />;
      default:
        return <Webhook className="h-5 w-5" />;
    }
  };

  const getIntegrationName = (type: string) => {
    switch (type) {
      case "slack":
        return "Slack";
      default:
        return "Webhook";
    }
  };

  const slackIntegration = integrations.find(i => i.type === "slack");

  return (
    <div className="space-y-6">
      {/* Slack Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
              <Slack className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Slack Integration</CardTitle>
              <CardDescription>
                Получайте уведомления о задачах и событиях в Slack
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {slackIntegration ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-medium">Slack подключен</p>
                    <p className="text-sm text-muted-foreground">
                      Webhook: {slackIntegration.webhookUrl?.substring(0, 50)}...
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestIntegration(slackIntegration.id)}
                    disabled={testing[slackIntegration.id]}
                  >
                    {testing[slackIntegration.id] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <TestTube className="h-4 w-4" />
                    )}
                    Test
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleIntegration(slackIntegration.id, !slackIntegration.isActive)}
                  >
                    {slackIntegration.isActive ? "Отключить" : "Включить"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteIntegration(slackIntegration.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {testResults[slackIntegration.id] && (
                <Alert className={testResults[slackIntegration.id].success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <AlertDescription className="flex items-center gap-2">
                    {testResults[slackIntegration.id].success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    {testResults[slackIntegration.id].message}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  Чтобы подключить Slack, создайте Incoming Webhook в настройках Slack и вставьте URL ниже.
                </AlertDescription>
              </Alert>
              
              {!showAddForm ? (
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Подключить Slack
                </Button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="webhook-url">Webhook URL</Label>
                    <Input
                      id="webhook-url"
                      type="url"
                      placeholder="https://hooks.slack.com/services/..."
                      value={newWebhookUrl}
                      onChange={(e) => setNewWebhookUrl(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAddIntegration("slack")}
                      disabled={loading || !newWebhookUrl.trim()}
                      className="flex-1"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      {loading ? "Подключение..." : "Подключить"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewWebhookUrl("");
                      }}
                    >
                      Отмена
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Other Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Другие интеграции</CardTitle>
          <CardDescription>
            Скоро будут доступны другие интеграции
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Webhook className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Другие интеграции находятся в разработке</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
