"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Crown, User, Trash2, MoreHorizontal, LogOut, AlertTriangle, Edit, X, Users, Save } from "lucide-react";
import { ConfirmDeleteModal } from "@/components/modals/ConfirmDeleteModal";

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
  const { data: session } = useSession();
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

  const [leaveConfirm, setLeaveConfirm] = useState({
    isOpen: false,
    willDelete: false,
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

  const handleLeaveClick = () => {
    // Check if user is the only member
    const otherMembers = workspace.members.filter(m => m.userId !== workspace.ownerId);
    const willDelete = otherMembers.length === 0;

    setLeaveConfirm({
      isOpen: true,
      willDelete,
    });
  };

  const confirmLeave = async () => {
    try {
      await onRemoveMember(workspace.members.find(m => m.userId === session?.user?.id)?.id || "");
      // After successful removal, redirect to dashboard
      window.location.href = "/app/dashboard";
      setLeaveConfirm({ isOpen: false, willDelete: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to leave workspace");
    }
  };

  return (
    <div className="space-y-6">
      {/* Workspace Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Информация о рабочем пространстве</CardTitle>
              <CardDescription>
                Управляйте деталями и настройками рабочего пространства
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
                    <Edit className="h-4 w-4" />
                    Редактировать
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
          <CardTitle>Участники</CardTitle>
          <CardDescription>
            Управляйте участниками рабочего пространства
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
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Crown className="h-3 w-3" />
                Владелец
              </Badge>
              {session?.user?.id === workspace.ownerId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLeaveClick}
                  className="text-destructive hover:text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Покинуть
                </Button>
              )}
            </div>
          </div>

          {/* Members */}
          {workspace.members
            .filter((member) => member.userId !== workspace.ownerId)
            .map((member) => (
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
                          Удалить участника
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
              <h4 className="font-medium mb-3">Пригласить нового участника</h4>
              <form onSubmit={handleInviteSubmit} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Введите email адрес"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={loading || !inviteEmail.trim()}>
                  {loading ? "Приглашение..." : "Пригласить"}
                </Button>
              </form>
              <p className="text-xs text-muted-foreground mt-2">
                Пользователь получит электронное приглашение присоединиться к этому рабочему пространству.
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
              Опасная зона
            </CardTitle>
            <CardDescription>
              Обратимые действия, которые влияют на все рабочее пространство
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
              <div>
                <h4 className="font-medium">Удалить рабочее пространство</h4>
                <p className="text-sm text-muted-foreground">
                  Безвозвратно удалить это рабочее пространство и все его доски и задачи. Это действие нельзя отменить.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={handleDeleteClick}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Удалить рабочее пространство
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteConfirm.isOpen}
        onConfirm={onDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, workspaceName: "" })}
        title="Удалить рабочее пространство"
        description={`Вы уверены, что хотите удалить "${deleteConfirm.workspaceName}"? Все доски и задачи будут безвозвратно удалены. Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
      />

      {/* Remove Member Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={removeMemberConfirm.isOpen}
        onConfirm={confirmRemoveMember}
        onCancel={() => setRemoveMemberConfirm({ isOpen: false, memberId: "", memberName: "" })}
        title="Удалить участника"
        description={`Вы уверены, что хотите удалить "${removeMemberConfirm.memberName}" из рабочего пространства?`}
        confirmText="Удалить"
        cancelText="Отмена"
      />

      {/* Leave Confirmation Modal */}
      <Dialog open={leaveConfirm.isOpen} onOpenChange={(open) => setLeaveConfirm({ ...leaveConfirm, isOpen: open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5" />
              Покинуть рабочее пространство
            </DialogTitle>
            <DialogDescription>
              {leaveConfirm.willDelete ? (
                "Вы - единственный участник этого рабочего пространства. Если вы покинете его, рабочее пространство будет безвозвратно удалено вместе со всеми досками и задачами."
              ) : (
                "Если вы покинете это рабочее пространство, права владельца будут переданы другому участнику."
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setLeaveConfirm({ ...leaveConfirm, isOpen: false })}
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={confirmLeave}
            >
              {leaveConfirm.willDelete ? "Удалить рабочее пространство" : "Покинуть рабочее пространство"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
