"use client";

import { useState } from "react";
import { DraggableKanbanBoard } from "@/components/kanban/DraggableKanbanBoard";
import { BoardStatsProvider } from "@/components/kanban/BoardStatsContext";
import { useBoardData } from "@/hooks/useBoardData";
import { BoardClient } from "./BoardClient";

interface BoardPageClientProps {
  boardId: string;
  tasks: any[];
  workspaceMembers: any[];
}

export default function BoardPageClient({ boardId, tasks, workspaceMembers }: BoardPageClientProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const { tasks: boardTasks, stats, moveTask } = useBoardData(tasks);

  const handleTaskCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <BoardClient
        boardId={boardId}
        workspaceMembers={workspaceMembers || []}
        onTaskCreated={handleTaskCreated}
      >
        <div className="space-y-8">
          <BoardStatsProvider>
            {/* Kanban Board */}
            <section className="space-y-6">
              <DraggableKanbanBoard
                boardId={boardId}
                tasks={boardTasks}
                workspaceMembers={workspaceMembers}
              />
            </section>
          </BoardStatsProvider>
        </div>
      </BoardClient>
    </div>
  );
}
