"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ActivityFeed } from "@/components/activity/ActivityFeed";

export default function ActivityPage({ 
  params 
}: { 
  params: { workspaceId: string } 
}) {
  const [showFeed, setShowFeed] = useState(false);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад к workspace
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Activity Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                История всех действий в workspace. Отслеживайте создание задач, изменение статусов, комментарии и другие события команды.
              </p>
              
              <Button
                onClick={() => setShowFeed(true)}
                className="w-full"
              >
                Показать Activity Feed
              </Button>
            </CardContent>
          </Card>
        </div>

        {showFeed && (
          <div className="lg:col-span-3">
            <ActivityFeed workspaceId={params.workspaceId} userId={""} />
          </div>
        )}
      </div>
    </div>
  );
}
