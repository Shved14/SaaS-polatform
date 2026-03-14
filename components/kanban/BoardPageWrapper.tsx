"use client";

import { useBoardStats } from "./BoardStatsContext";
import { DraggableKanbanBoard } from "./DraggableKanbanBoard";

interface BoardPageWrapperProps {
  boardId: string;
  tasks: any[];
  workspaceMembers: any[];
}

export function BoardPageWrapper({ boardId, tasks, workspaceMembers }: BoardPageWrapperProps) {
  const { stats } = useBoardStats();

  return (
    <DraggableKanbanBoard
      boardId={boardId}
      tasks={tasks}
      workspaceMembers={workspaceMembers}
    />
  );
}

export default BoardPageWrapper;
