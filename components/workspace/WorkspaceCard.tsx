"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FolderOpen, Trash2, Users } from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  createdAt: Date;
  ownerId: string;
  _count: {
    boards: number;
    members: number;
  };
}

interface WorkspaceCardProps {
  workspace: Workspace;
  userId: string;
  onDelete: (workspaceId: string) => Promise<void>;
}

export function WorkspaceCard({ workspace, userId, onDelete }: WorkspaceCardProps) {
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    workspaceId: "",
    workspaceName: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = () => {
    setDeleteConfirm({
      isOpen: true,
      workspaceId: workspace.id,
      workspaceName: workspace.name,
    });
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(deleteConfirm.workspaceId);
    } finally {
      setIsDeleting(false);
      setDeleteConfirm({ isOpen: false, workspaceId: "", workspaceName: "" });
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ isOpen: false, workspaceId: "", workspaceName: "" });
  };

  const isOwner = workspace.ownerId === userId;

  return (
    <>
      <Card className="transition-all duration-200 hover:shadow-soft-lg hover:-translate-y-1 border-border/60 bg-card/95 backdrop-blur-sm shadow-soft">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg font-semibold">{workspace.name}</CardTitle>
            {isOwner && (
              <Badge variant="secondary" className="text-xs font-medium">
                Владелец
              </Badge>
            )}
          </div>
          <CardDescription className="text-sm">
            Создано {workspace.createdAt.toLocaleDateString('ru-RU')}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <FolderOpen className="h-4 w-4 text-primary" />
              <span>{workspace._count.boards} досок</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-primary" />
              <span>{workspace._count.members} участников</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-2">
          <div className="flex w-full gap-2">
            <Button asChild variant="outline" size="sm" className="flex-1 gap-2 hover-scale">
              <Link href={`/app/workspace/${workspace.id}`} className="gap-2">
                <FolderOpen className="h-3 w-3" />
                Открыть
              </Link>
            </Button>
            {isOwner && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteClick}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 px-3 hover-scale"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Удалить рабочее пространство"
        description={`Вы уверены, что хотите удалить "${deleteConfirm.workspaceName}"? Все доски и задачи будут безвозвратно удалены. Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
        variant="destructive"
        loading={isDeleting}
      />
    </>
  );
}
