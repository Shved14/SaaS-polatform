"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TaskModal } from "@/components/tasks/TaskModal";
import { InviteMemberModal } from "@/components/workspace/InviteMemberModal";
import { Plus, UserPlus } from "lucide-react";

interface BoardClientProps {
  boardId: string;
  workspaceMembers: Array<{ id: string; name: string | null; email: string | null }>;
  children: React.ReactNode;
  onTaskCreated?: () => void;
}

export function BoardClient({ boardId, workspaceMembers, children, onTaskCreated }: BoardClientProps) {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const openTaskModal = () => setIsTaskModalOpen(true);
  const openInviteModal = () => setIsInviteModalOpen(true);

  return (
    <>

      {children}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        boardId={boardId}
        workspaceMembers={workspaceMembers.map(member => ({
          ...member,
          email: member.email || ""
        }))}
        onTaskCreated={onTaskCreated}
      />
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        workspaceId={boardId}
      />
    </>
  );
}
