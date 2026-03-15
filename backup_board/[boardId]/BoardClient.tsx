"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TaskModal } from "@/components/tasks/TaskModal";
import { InviteMemberModal } from "@/components/workspace/InviteMemberModal";
import { Plus, UserPlus } from "lucide-react";

interface BoardClientProps {
  boardId: string;
  workspaceMembers: Array<{ id: string; name: string | null; email: string }>;
  children: React.ReactNode;
}

export function BoardClient({ boardId, workspaceMembers, children }: BoardClientProps) {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const openTaskModal = () => setIsTaskModalOpen(true);
  const openInviteModal = () => setIsInviteModalOpen(true);

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Kanban доска</h2>
          <p className="text-sm text-muted-foreground">
            Перетаскивайте задачи между колонками для изменения статуса
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={openTaskModal}
            className="gap-2 shadow-soft hover:shadow-soft-lg transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            Создать задачу
          </Button>

        </div>
      </div>
      {children}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        boardId={boardId}
        workspaceMembers={workspaceMembers}
      />
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        workspaceId={boardId}
      />
    </>
  );
}
