"use client";

import { useState } from "react";
import { DraggableKanbanBoard } from "@/components/kanban/DraggableKanbanBoard";
import { Task } from "@/lib/types";

interface BoardWrapperProps {
  boardId: string;
  initialTasks: Task[];
  workspaceMembers: Array<{ id: string; name: string | null; email: string | null }>;
}

export function BoardWrapper({ boardId, initialTasks, workspaceMembers }: BoardWrapperProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  // Convert workspaceMembers to match DraggableKanbanBoard expectations
  const convertedMembers = workspaceMembers.map(member => ({
    ...member,
    email: member.email || ""
  }));

  return (
    <DraggableKanbanBoard
      boardId={boardId}
      tasks={tasks}
      workspaceMembers={convertedMembers}
      setTasks={setTasks}
    />
  );
}
