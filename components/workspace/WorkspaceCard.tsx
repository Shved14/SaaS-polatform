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
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">{workspace.name}</CardTitle>
            {isOwner && (
              <Badge variant="secondary" className="text-xs">
                Owner
              </Badge>
            )}
          </div>
          <CardDescription>
            Created {workspace.createdAt.toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <FolderOpen className="h-4 w-4" />
              <span>{workspace._count.boards} boards</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{workspace._count.members} members</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-2">
          <div className="flex w-full gap-2">
            <Button asChild variant="outline" size="sm" className="flex-1">
              <Link href={`/app/workspace/${workspace.id}`} className="gap-2">
                <FolderOpen className="h-3 w-3" />
                Open
              </Link>
            </Button>
            {isOwner && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteClick}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 px-3"
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
        title="Delete Workspace"
        description={`Are you sure you want to delete "${deleteConfirm.workspaceName}"? All boards and tasks will be permanently removed. This action cannot be undone.`}
        confirmText="Delete Workspace"
        cancelText="Cancel"
        variant="destructive"
        loading={isDeleting}
      />
    </>
  );
}
