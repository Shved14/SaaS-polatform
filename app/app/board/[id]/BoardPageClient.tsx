"use client";

import { useState } from "react";
import { DraggableKanbanBoard } from "@/components/kanban/DraggableKanbanBoard";
import { BoardStatsProvider } from "@/components/kanban/BoardStatsContext";
import { useBoardData } from "@/hooks/useBoardData";
import { BoardClient } from "./BoardClient";
import { TaskModal } from "@/components/tasks/TaskModal";
import { InviteMemberModal } from "@/components/workspace/InviteMemberModal";

interface BoardPageClientProps {
  boardId: string;
  tasks: any[];
  workspaceMembers: any[];
}

export default function BoardPageClient({ boardId, tasks: initialTasks, workspaceMembers }: BoardPageClientProps) {
  const { tasks: boardTasks, stats, moveTask, setTasks } = useBoardData(initialTasks);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const openTaskModal = () => setIsTaskModalOpen(true);
  const openInviteModal = () => setIsInviteModalOpen(true);

  const handleTaskCreated = () => {
    // Close modals
    setIsTaskModalOpen(false);
    setIsInviteModalOpen(false);
  };

  const handleTaskUpdate = (newTask: any) => {
    // Add new task to the list
    setTasks(prevTasks => [...prevTasks, newTask]);
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
                setTasks={setTasks}
              />
            </section>
          </BoardStatsProvider>
        </div>
      </BoardClient>

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        boardId={boardId}
        workspaceMembers={workspaceMembers.map(member => ({
          ...member,
          email: member.email || ""
        }))}
        onTaskCreated={handleTaskCreated}
        onTaskUpdate={handleTaskUpdate}
      />
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        workspaceId={boardId}
      />
    </div>
  );
}
