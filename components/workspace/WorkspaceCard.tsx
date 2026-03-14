"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FolderOpen, Trash2, Users, Calendar } from "lucide-react";

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
      <Card className="group relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card/50 to-card backdrop-blur-sm transition-all duration-300 hover:shadow-soft-2xl hover:-translate-y-2 hover:border-primary/20">
        {/* Фоновый декоративный элемент */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <CardHeader className="relative pb-4 border-b border-border/50 bg-card/80 backdrop-blur-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {/* Иконка рабочего пространства */}
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-soft-lg group-hover:scale-105 transition-transform duration-200">
                  <FolderOpen className="h-6 w-6" />
                </div>
                {/* Свечение для иконки */}
                <div className="absolute -inset-2 bg-primary/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-foreground">{workspace.name}</CardTitle>
                <p className="text-xs text-muted-foreground font-medium">Рабочее пространство</p>
              </div>
            </div>
            {isOwner && (
              <Badge variant="secondary" className="text-xs font-medium bg-primary/10 text-primary border border-primary/20 shadow-soft">
                Владелец
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pb-4">
          {/* Метрики */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 border border-border/30">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-soft">
                <FolderOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{workspace._count.boards}</p>
                <p className="text-xs text-muted-foreground">Досок</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/20 border border-border/30">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500 text-white shadow-soft">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{workspace._count.members}</p>
                <p className="text-xs text-blue-100">Участников</p>
              </div>
            </div>
          </div>

          {/* Описание */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 border border-border/30">
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Создано <span className="font-medium text-foreground">{workspace.createdAt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-4 border-t border-border/50 bg-card/80 backdrop-blur-sm">
          <div className="flex w-full gap-3">
            <Button asChild variant="outline" size="sm" className="flex-1 gap-2 bg-background/50 hover:bg-background border border-border/30 hover:border-primary/30 hover:text-primary transition-all duration-200">
              <Link href={`/app/workspace/${workspace.id}`} className="flex items-center justify-center">
                <FolderOpen className="h-4 w-4" />
                <span>Открыть</span>
              </Link>
            </Button>
            {isOwner && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteClick}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 hover:scale-105 transition-all duration-200 px-3"
              >
                <Trash2 className="h-4 w-4" />
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
