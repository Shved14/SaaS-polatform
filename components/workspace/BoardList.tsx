"use client";

import { useState } from "react";
import { BoardCard } from "./BoardCard";

interface Board {
  id: string;
  name: string;
  createdAt: Date;
  _count: {
    tasks: number;
  };
}

interface BoardListProps {
  boards: Board[];
  workspaceId: string;
  isOwner: boolean;
}

export function BoardList({ boards, workspaceId, isOwner }: BoardListProps) {
  const [boardList, setBoardList] = useState(boards);

  const handleDeleteBoard = async (boardId: string) => {
    try {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete board");
      }

      // Remove board from list
      setBoardList(prev => prev.filter(board => board.id !== boardId));
    } catch (error) {
      console.error("Error deleting board:", error);
      // You could add toast notification here
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {boardList.map((board) => (
        <BoardCard
          key={board.id}
          board={board}
          workspaceId={workspaceId}
          isOwner={isOwner}
          onDelete={handleDeleteBoard}
        />
      ))}
    </div>
  );
}
