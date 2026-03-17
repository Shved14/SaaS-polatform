"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IntegrationSettings } from "@/components/integrations/IntegrationSettings";
import { Loader2, Settings, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function IntegrationsPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<any>(null);

  useEffect(() => {
    loadWorkspace();
  }, [workspaceId]);

  async function loadWorkspace() {
    try {
      setLoading(true);
      const res = await fetch(`/api/workspaces/${workspaceId}`);
      if (res.ok) {
        const data = await res.json();
        setWorkspace(data);
      }
    } catch (error) {
      console.error("Failed to load workspace:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Workspace не найден</h1>
          <p className="text-muted-foreground mb-6">
            Запрошенный workspace не существует или у вас нет доступа
          </p>
          <Link href="/app/dashboard">
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Вернуться к дашборду
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link 
          href={`/app/workspace/${workspaceId}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Вернуться к workspace
        </Link>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="h-8 w-8" />
            Настройки интеграций
          </h1>
          <p className="text-muted-foreground">
            Управляйте внешними сервисами для автоматических уведомлений
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{workspace.name}</CardTitle>
            <CardDescription>
              Настройте интеграции для этого workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <IntegrationSettings workspaceId={workspaceId} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
