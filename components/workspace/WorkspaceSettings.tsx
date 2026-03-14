"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Crown,
  User,
  MoreHorizontal,
  Edit2,
  Save,
  X,
  Trash2,
  Plus,
  Users,
  AlertTriangle,
} from "lucide-react";

interface Member {
  id: string;
  userId: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
  };
  members: Member[];
}

interface WorkspaceSettingsProps {
  workspace: Workspace;
  isOwner: boolean;
  onUpdate: (updates: Partial<Workspace>) => Promise<void>;
  onDelete: () => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
  onInviteMember: (email: string) => Promise<void>;
}

export function WorkspaceSettings({
  workspace,
  isOwner,
  onUpdate,
  onDelete,
  onRemoveMember,
  onInviteMember,
}: WorkspaceSettingsProps) {
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: workspace.name,
  });
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    workspaceName: "",
  });

  const [removeMemberConfirm, setRemoveMemberConfirm] = useState({
    isOpen: false,
    memberId: "",
    memberName: "",
  });

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      await onUpdate(editForm);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update workspace");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditForm({
      name: workspace.name,
    });
    setEditing(false);
    setError(null);
  };

  const handleDeleteClick = () => {
    setDeleteConfirm({
      isOpen: true,
      workspaceName: workspace.name,
    });
  };

  const handleRemoveMemberClick = (member: Member) => {
    setRemoveMemberConfirm({
      isOpen: true,
      memberId: member.id,
      memberName: member.user.name || member.user.email,
    });
  };

  const confirmRemoveMember = async () => {
    try {
      await onRemoveMember(removeMemberConfirm.memberId);
      setRemoveMemberConfirm({ isOpen: false, memberId: "", memberName: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await onInviteMember(inviteEmail.trim());
      setInviteEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Workspace Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Workspace Information</CardTitle>
              <CardDescription>
                Manage your workspace details and settings
              </CardDescription>
            </div>
            {isOwner && (
              <div className="flex gap-2">
                {!editing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(true)}
                    className="gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </Button>
                ) : (
                  <>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={loading}
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {loading ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="grid gap-4">
            <div>
              <Label htmlFor="name">Workspace Name</Label>
              {editing ? (
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="mt-1"
                />
              ) : (
                <p className="mt-1 text-sm font-medium">{workspace.name}</p>
              )}
            </div>

            <div>
              <Label>Owner</Label>
              <div className="mt-1 flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {workspace.owner.name?.[0] || workspace.owner.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">
                  {workspace.owner.name || workspace.owner.email}
                </span>
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Crown className="h-3 w-3" />
                  Owner
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Members ({workspace.members.length + 1})
          </CardTitle>
          <CardDescription>
            Manage workspace members and their roles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Owner */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>
                  {workspace.owner.name?.[0] || workspace.owner.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {workspace.owner.name || workspace.owner.email}
                </p>
                <p className="text-sm text-muted-foreground">{workspace.owner.email}</p>
              </div>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Crown className="h-3 w-3" />
              Owner
            </Badge>
          </div>

          {/* Members */}
          {workspace.members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {member.user.name?.[0] || member.user.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {member.user.name || member.user.email}
                  </p>
                  <p className="text-sm text-muted-foreground">{member.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <User className="h-3 w-3" />
                  {member.role}
                </Badge>
                {isOwner && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleRemoveMemberClick(member)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove Member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          ))}

          {/* Invite Member */}
          {isOwner && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Invite New Member</h4>
              <form onSubmit={handleInviteSubmit} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={loading}>
                  {loading ? "Inviting..." : "Invite"}
                </Button>
              </form>
              <p className="text-xs text-muted-foreground mt-2">
                The user will receive an email invitation to join this workspace.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      {isOwner && (
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions that affect your entire workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
              <div>
                <h4 className="font-medium">Delete Workspace</h4>
                <p className="text-sm text-muted-foreground">
                  Permanently delete this workspace and all its boards and tasks. This action cannot be undone.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={handleDeleteClick}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Workspace
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, workspaceName: "" })}
        onConfirm={onDelete}
        title="Delete Workspace"
        description={`Are you sure you want to delete "${deleteConfirm.workspaceName}"? All boards and tasks will be permanently removed. This action cannot be undone.`}
        confirmText="Delete Workspace"
        cancelText="Cancel"
        variant="destructive"
      />

      {/* Remove Member Confirmation Dialog */}
      <ConfirmDialog
        isOpen={removeMemberConfirm.isOpen}
        onClose={() => setRemoveMemberConfirm({ isOpen: false, memberId: "", memberName: "" })}
        onConfirm={confirmRemoveMember}
        title="Remove Member"
        description={`Are you sure you want to remove "${removeMemberConfirm.memberName}" from the workspace?`}
        confirmText="Remove Member"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
