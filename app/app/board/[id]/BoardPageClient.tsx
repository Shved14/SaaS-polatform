"use client";

import { useState } from "react";
import { DraggableKanbanBoard } from "@/components/kanban/DraggableKanbanBoard";
import { BoardStatsProvider } from "@/components/kanban/BoardStatsContext";
import { useBoardData } from "@/hooks/useBoardData";
import { BoardClient } from "./BoardClient";
import { TaskModal } from "@/components/tasks/TaskModal";
import { InviteMemberModal } from "@/components/workspace/InviteMemberModal";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Task, User } from "@/lib/types";

interface BoardPageClientProps {
  boardId: string;
  tasks: Task[];
  workspaceMembers: User[];
}

export default function BoardPageClient({ boardId, tasks: initialTasks, workspaceMembers }: BoardPageClientProps) {
  const { tasks: boardTasks, stats, moveTask, setTasks, handleTaskCreated: addTask } = useBoardData(initialTasks);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const router = useRouter();

  const openTaskModal = () => setIsTaskModalOpen(true);
  const openInviteModal = () => setIsInviteModalOpen(true);

  const handleTaskCreated = (newTask: Task) => {
    addTask(newTask);
    setIsTaskModalOpen(false);
  };

  const handleTaskUpdate = (newTask: Task) => {
    setTasks(prevTasks => prevTasks.map(task =>
      task.id === newTask.id ? newTask : task
    ));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Button
        variant="outline"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Назад к рабочему пространству
      </Button>

      <BoardClient
        boardId={boardId}
        workspaceMembers={workspaceMembers || []}
        stats={stats}
        onTaskModalOpen={openTaskModal}
        onInviteModalOpen={openInviteModal}
      />

      <BoardStatsProvider>
        {/* Kanban Board */}
        <section className="space-y-6">
          <DraggableKanbanBoard
            boardId={boardId}
            tasks={boardTasks}
            workspaceMembers={workspaceMembers}
            setTasks={setTasks}
          />
        </section>
      </BoardStatsProvider>

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        boardId={boardId}
        workspaceMembers={workspaceMembers}
        onTaskCreated={handleTaskCreated}
        onTaskUpdate={handleTaskUpdate}
      />

      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        workspaceId={boardId}
      />
    </div>
  );
}
