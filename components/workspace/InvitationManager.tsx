"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  Users, 
  Copy, 
  CheckCircle, 
  X, 
  Plus,
  Trash2,
  RefreshCw
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Invitation {
  id: string;
  email: string;
  status: "pending" | "accepted" | "expired";
  token: string;
  expiresAt: string;
  createdAt: string;
  workspace: {
    id: string;
    name: string;
  };
  inviter: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface InvitationManagerProps {
  workspaceId: string;
  userId: string;
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  accepted: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  expired: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
};

const statusLabels = {
  pending: "Ожидает",
  accepted: "Принято",
  expired: "Истёк"
};

export function InvitationManager({ workspaceId, userId }: InvitationManagerProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/invitations`);
      if (response.ok) {
        const data = await response.json();
        setInvitations(data);
      }
    } catch (error) {
      console.error("Failed to load invitations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvitation = async () => {
    if (!email.trim()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          workspaceId
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setShowCreateModal(false);
          setEmail("");
          await loadInvitations(); // Перезагружаем список
        }
      }
    } catch (error) {
      console.error("Failed to create invitation:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvitation = async (invitationId: string) => {
    if (!confirm("Вы уверены, что хотите удалить это приглашение?")) {
      return;
    }

    try {
      const response = await fetch(`/api/invite/${invitationId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        await loadInvitations();
      }
    } catch (error) {
      console.error("Failed to delete invitation:", error);
    }
  };

  const handleCopyInviteLink = (invitationToken: string) => {
    const inviteLink = `${window.location.origin}/invite/${invitationToken}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteLink);
      // Можно добавить уведомление об успешном копировании
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case "pending":
        return { color: statusColors.pending, label: statusLabels.pending };
      case "accepted":
        return { color: statusColors.accepted, label: statusLabels.accepted };
      case "expired":
        return { color: statusColors.expired, label: statusLabels.expired };
      default:
        return { color: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400", label: status };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Управление приглашениями
          <Button
            variant="outline"
            size="sm"
            onClick={loadInvitations}
            disabled={loading}
            className="ml-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Создание приглашения */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium mb-3">Создать приглашение</h3>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Email пользователя"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mb-2"
              />
            </div>
            <Button
              onClick={handleCreateInvitation}
              disabled={loading || !email.trim()}
              className="px-4 py-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mr-2"></div>
                  Отправка...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Отправить приглашение
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Список приглашений */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium mb-3">Приглашения</h3>
          
          {invitations.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Нет приглашений</p>
            </div>
          ) : (
            invitations.map((invitation) => {
              const statusInfo = formatStatus(invitation.status);
              
              return (
                <div key={invitation.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-sm">
                            {invitation.inviter.name?.[0] || invitation.inviter.email[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{invitation.inviter.name || invitation.inviter.email}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            пригласил пользователя
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs", statusInfo.color)}
                        >
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Mail className="h-4 w-4" />
                      <span>{invitation.email}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Users className="h-4 w-4" />
                      <span>{invitation.workspace?.name || "Unknown Workspace"}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <CalendarIcon className="h-4 w-4" />
                      <span>{formatDate(invitation.createdAt)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="h-4 w-4" />
                      <span>
                        {invitation.status === "expired" 
                          ? `Истёк ${formatDate(invitation.expiresAt)}`
                          : `Истекает ${formatDate(invitation.expiresAt)}`
                        }
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyInviteLink(invitation.token)}
                      className="text-gray-600 dark:text-gray-400"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Копировать ссылку
                    </Button>
                    
                    {invitation.status === "pending" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteInvitation(invitation.id)}
                        className="text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Удалить
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
