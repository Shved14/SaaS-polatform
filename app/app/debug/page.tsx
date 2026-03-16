"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, RefreshCw, Mail, Bell } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  data: any;
  isRead: boolean;
  createdAt: string;
}

interface Invitation {
  id: string;
  email: string;
  workspaceId: string;
  workspaceName: string;
  token: string;
  status: string;
  expiresAt: string;
}

export default function DebugPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/debug-notifications");
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      const data = await response.json();
      setNotifications(data.notifications || []);
      setInvitations(data.invitations || []);
      setUser(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const fixNotifications = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/fix-notifications", { method: "POST" });
      if (!response.ok) {
        throw new Error("Failed to fix notifications");
      }
      const data = await response.json();
      setSuccess(data.message);
      await fetchData(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fix notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchData();
    }
  }, [session]);

  if (!session?.user) {
    return (
      <Container className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p>Please sign in to access this page.</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Диагностика приглашений</h1>
            <p className="text-muted-foreground">Проверка и исправление системы приглашений</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchData} disabled={loading} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Обновить
            </Button>
            <Button onClick={fixNotifications} disabled={loading}>
              Исправить уведомления
            </Button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
            <CheckCircle className="h-4 w-4" />
            <span>{success}</span>
          </div>
        )}

        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle>Информация о пользователе</CardTitle>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="space-y-2">
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Name:</strong> {user.name || "Не указано"}</p>
              </div>
            ) : (
              <p>Загрузка...</p>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Уведомления ({notifications.length})
            </CardTitle>
            <CardDescription>Текущие уведомления в системе</CardDescription>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <p className="text-muted-foreground">Уведомлений нет</p>
            ) : (
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <div key={notif.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={notif.isRead ? "secondary" : "default"}>
                        {notif.isRead ? "Прочитано" : "Новое"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(notif.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="font-medium">{notif.type}</p>
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                      <pre className="whitespace-pre-wrap text-xs">
                        {JSON.stringify(notif.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invitations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Приглашения ({invitations.length})
            </CardTitle>
            <CardDescription>Активные приглашения в базе данных</CardDescription>
          </CardHeader>
          <CardContent>
            {invitations.length === 0 ? (
              <p className="text-muted-foreground">Приглашений нет</p>
            ) : (
              <div className="space-y-3">
                {invitations.map((inv) => (
                  <div key={inv.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={inv.status === "pending" ? "default" : "secondary"}>
                        {inv.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Истекает: {new Date(inv.expiresAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="font-medium">{inv.workspaceName}</p>
                    <p className="text-sm text-muted-foreground">{inv.email}</p>
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                      <p><strong>Token:</strong> {inv.token}</p>
                      <p><strong>Workspace ID:</strong> {inv.workspaceId}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
