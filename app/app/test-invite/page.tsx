"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle, Mail, Send } from "lucide-react";

export default function TestInvitePage() {
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const sendTestInvitation = async () => {
    if (!email || !workspaceId) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setLogs([]);

    try {
      addLog("Starting invitation send process...");
      
      const response = await fetch(`/api/workspaces/${workspaceId}/invite`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      addLog(`API Response status: ${response.status}`);
      addLog(`API Response ok: ${response.ok}`);

      const data = await response.json();
      addLog(`API Response data: ${JSON.stringify(data, null, 2)}`);

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invitation");
      }

      setSuccess("Invitation sent successfully!");
      addLog("✅ Invitation completed successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send invitation";
      setError(errorMessage);
      addLog(`❌ Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

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
        <div>
          <h1 className="text-2xl font-semibold">Тестовое приглашение</h1>
          <p className="text-muted-foreground">Отправка тестового приглашения для проверки системы</p>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Отправить приглашение
            </CardTitle>
            <CardDescription>Заполните форму для отправки тестового приглашения</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email получателя</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
            <div>
              <Label htmlFor="workspaceId">Workspace ID</Label>
              <Input
                id="workspaceId"
                value={workspaceId}
                onChange={(e) => setWorkspaceId(e.target.value)}
                placeholder="workspace-id-here"
              />
              <p className="text-xs text-muted-foreground mt-1">
                ID рабочего пространства (можно найти в URL страницы workspace)
              </p>
            </div>
            <Button onClick={sendTestInvitation} disabled={loading} className="w-full">
              <Send className="h-4 w-4 mr-2" />
              {loading ? "Отправка..." : "Отправить приглашение"}
            </Button>
          </CardContent>
        </Card>

        {logs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Логи выполнения</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-3 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Container>
  );
}
