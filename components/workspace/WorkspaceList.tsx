"use client";

import { useState } from "react";
import { WorkspaceCard } from "./WorkspaceCard";

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

interface WorkspaceListProps {
  workspaces: Workspace[];
  userId: string;
}

export function WorkspaceList({ workspaces, userId }: WorkspaceListProps) {
  const [workspaceList, setWorkspaceList] = useState(workspaces);

  const handleDeleteWorkspace = async (workspaceId: string) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete workspace");
      }

      // Remove workspace from list
      setWorkspaceList(prev => prev.filter(workspace => workspace.id !== workspaceId));
      
      // Redirect to dashboard after successful deletion
      window.location.href = "/app/dashboard";
    } catch (error) {
      console.error("Error deleting workspace:", error);
      // You could add toast notification here
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {workspaceList.map((workspace) => (
        <WorkspaceCard
          key={workspace.id}
          workspace={workspace}
          userId={userId}
          onDelete={handleDeleteWorkspace}
        />
      ))}
    </div>
  );
}
