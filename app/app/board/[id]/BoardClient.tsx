"use client";

import { Button } from "@/components/ui/button";
import { TaskModal } from "@/components/tasks/TaskModal";
import { InviteMemberModal } from "@/components/workspace/InviteMemberModal";
import { Plus, UserPlus } from "lucide-react";
import { useBoardStats } from "@/components/kanban/BoardStatsContext";

interface BoardClientProps {
  boardId: string;    
  workspaceMembers: Array<{ id: string; name: string | null; email: string | null }>;
  children: React.ReactNode;
    onTaskCreated?: (newTask: any) => void
}

export function BoardClient({ boardId, workspaceMembers, children, onTaskCreated }: BoardClientProps) {
  return (
    <>
      {children}
      <TaskModal
        isOpen={false} // Will be controlled by parent
        onClose={() => { }} // Will be controlled by parent
        boardId={boardId}
        workspaceMembers={workspaceMembers.map(member => ({
          ...member,
          email: member.email || ""
        }))}
        onTaskCreated={onTaskCreated}
      />
      <InviteMemberModal
        isOpen={false} // Will be controlled by parent
        onClose={() => { }} // Will be controlled by parent
        workspaceId={boardId}
      />
    </>
  );
}
