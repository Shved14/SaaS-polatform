"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteModal } from "@/components/modals/ConfirmDeleteModal";

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

      <ConfirmDeleteModal
        isOpen={deleteConfirm.isOpen}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        title="Удалить доску"
        description={`Вы уверены, что хотите удалить "${deleteConfirm.boardName}"? Это действие нельзя отменить и все задачи будут безвозвратно удалены.`}
        confirmText="Удалить доску"
        cancelText="Отмена"
      />
    </>
  );
}
