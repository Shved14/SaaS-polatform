"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Board {
  id: string;
  name: string;
  createdAt: Date;
  _count: {
    tasks: number;
  };
}

interface BoardCardProps {
  board: Board;
  workspaceId: string;
  isOwner: boolean;
  onDelete: (boardId: string) => Promise<void>;
}

export function BoardCard({ board, workspaceId, isOwner, onDelete }: BoardCardProps) {
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    boardId: "",
    boardName: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = () => {
    setDeleteConfirm({
      isOpen: true,
      boardId: board.id,
      boardName: board.name,
    });
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(deleteConfirm.boardId);
    } finally {
      setIsDeleting(false);
      setDeleteConfirm({ isOpen: false, boardId: "", boardName: "" });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ isOpen: false, boardId: "", boardName: "" });
  };

  return (
    <>
      <div className="p-4 border rounded-lg bg-card">
        <Link href={`/app/board/${board.id}`}>
          <h3 className="font-medium text-card-foreground hover:text-primary transition-colors">
            {board.name}
          </h3>
        </Link>
        <p className="text-sm text-muted-foreground mt-1">
          {board._count.tasks} tasks • Created {board.createdAt.toLocaleDateString()}
        </p>
        {isOwner && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteClick}
            className="mt-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            Delete Board
          </Button>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete Board"
        description={`Are you sure you want to delete "${deleteConfirm.boardName}"? This action cannot be undone and all tasks will be permanently removed.`}
        confirmText="Delete Board"
        cancelText="Cancel"
        variant="destructive"
        loading={isDeleting}
      />
    </>
  );
}
