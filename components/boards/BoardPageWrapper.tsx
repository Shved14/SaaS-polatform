"use client";

import { useState } from "react";
import { TaskModal } from "@/components/tasks/TaskModal";
import { InviteMemberModal } from "@/components/workspace/InviteMemberModal";

interface BoardPageWrapperProps {
  children: React.ReactNode;
  boardId: string;
  workspaceMembers: Array<{ id: string; name: string | null; email: string }>;
}

export function BoardPageWrapper({ children, boardId, workspaceMembers }: BoardPageWrapperProps) {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  return (
    <>
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
