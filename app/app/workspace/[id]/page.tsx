"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteModal } from "@/components/modals/ConfirmDeleteModal";
import { WorkspaceSettings } from "@/components/workspace/WorkspaceSettings";
import { BoardCard } from "@/components/workspace/BoardCard";
import {
  Users,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Crown,
  AlertTriangle,
  ArrowLeft,
  FolderOpen,
  Calendar,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/hooks/use-toast";

interface WorkspacePageProps {
  params: { id: string };
  searchParams: { tab?: string; error?: string; name?: string; success?: string };
}

interface WorkspaceMember {
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
  createdAt: Date;
  ownerId: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
  };
  members: WorkspaceMember[];
  _count?: {
    boards: number;
    members: number;
  };
}

interface Board {
  id: string;
  name: string;
  createdAt: Date;
  workspaceId: string;
}

export default function WorkspacePage({ params, searchParams }: WorkspacePageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { addToast } = useToast();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    boardId: "",
    boardName: "",
    type: "" as "workspace" | "board"
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Загрузка данных
  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user?.id) {
      redirect("/auth/signin");
      return;
    }

    const loadData = async () => {
      try {
        const response = await fetch(`/api/workspaces/${params.id}`, {
          cache: "no-store"
        });

        if (!response.ok) {
          redirect("/app/dashboard");
          return;
        }

        const workspaceData = await response.json();
        setWorkspace(workspaceData);

        const boardsResponse = await fetch(`/api/workspaces/${params.id}/boards`, {
          cache: "no-store"
        });

        if (boardsResponse.ok) {
          const boardsData = await boardsResponse.json();
          setBoards(boardsData);
        }
      } catch (err) {
        console.error("Failed to load workspace:", err);
        redirect("/app/dashboard");
      }
    };

    loadData();
  }, [params.id, status, session?.user?.id]);

  // Обработка URL параметров
  useEffect(() => {
    if (searchParams.error === "board_exists") {
      setError(`Доска с названием "${decodeURIComponent(searchParams.name || '')}" уже существует`);
    } else if (searchParams.error === "board_limit") {
      setError("Достигнут лимит досок для бесплатного тарифа");
    } else if (searchParams.success === "board_created") {
      setSuccess("Доска успешно создана");
      setNewBoardName(""); // Очищаем поле после успешного создания
    }
  }, [searchParams]);

  const handleDeleteBoard = async (boardId: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete board");
      }

      // Remove board from list
      setBoards(prev => prev.filter(board => board.id !== boardId));

      // Close dialog
      setDeleteConfirm({ isOpen: false, boardId: "", boardName: "", type: "board" });

      // Show success message
      setSuccess("Доска успешно удалена");

      // Clear error message
      setError(null);
    } catch (err) {
      setError("Ошибка при удалении доски");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleInviteMember = async (email: string) => {
    try {
      const response = await fetch(`/api/workspaces/${params.id}/invite`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to invite member");
      }

      setSuccess("Приглашение отправлено!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка при отправке приглашения");
      throw err;
    }
  };

  const handleLeaveWorkspace = async () => {
    try {
      const response = await fetch(`/api/workspaces/${params.id}/leave`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ workspaceId: params.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to leave workspace");
      }

      router.push("/app/dashboard");
      addToast("Вы покинули рабочее пространство", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Ошибка при выходе из рабочего пространства", "error");
      throw err;
    }
  };

  const handleCreateBoard = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;

    try {
      const response = await fetch(`/api/workspaces/${params.id}/boards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "BOARD_EXISTS") {
          setError(`Доска "${name}" уже существует`);
        } else if (data.error === "BOARD_LIMIT") {
          setError("Достигнут лимит досок для бесплатного тарифа");
        } else {
          setError("Достигнут лимит досок для бесплатного тарифа");
        }
        return;
      }

      // Add new board to list
      const newBoard = {
        id: data.id,
        name: data.name,
        createdAt: new Date(),
        workspaceId: params.id
      };
      setBoards(prev => [newBoard, ...prev]);

      // Clear form
      setNewBoardName("");
      setError(null);
      setSuccess("Доска успешно создана");

    } catch (error) {
      console.error("Error creating board:", error);
      setError("Ошибка при создании доски");
    }
  };

  if (!workspace) {
    return (
      <Container className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Загрузка...</p>
        </div>
      </Container>
    );
  }

  const isOwner = session?.user?.id === workspace.ownerId;

  return (
    <Container className="py-8 space-y-8">
      {/* Уведомления об ошибках и успехе */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
          <p className="font-medium">{success}</p>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/app/dashboard" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Назад
            </Link>
          </Button>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <FolderOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {workspace.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              Рабочее пространство • {isOwner ? "Владелец" : "Участник"}
            </p>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-soft border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Доски</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workspace._count?.boards || 0}</div>
            <p className="text-xs text-muted-foreground">
              Активных досок
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-soft border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Участники</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workspace._count?.members || 0}</div>
            <p className="text-xs text-muted-foreground">
              Участников в команде
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-soft border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Создано</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(workspace.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(workspace.createdAt).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Boards Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Доски</h2>
            <p className="text-sm text-muted-foreground">
              Управляйте досками этого рабочего пространства
            </p>
          </div>
          {isOwner && (
            <form onSubmit={handleCreateBoard} className="flex gap-2">
              <Input
                type="text"
                name="name"
                placeholder="Название доски"
                value={newBoardName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewBoardName(e.target.value)}
                className="w-48"
                required
              />
              <input type="hidden" name="workspaceId" value={params.id} />
              <Button type="submit" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Создать
              </Button>
            </form>
          )}
        </div>

        {boards.length === 0 ? (
          <Card className="text-center py-12 shadow-soft border-border/60">
            <CardContent>
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ещё нет досок</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto text-center">
                Создайте вашу первую доску, чтобы начать организовывать задачи и работать с командой.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {boards.map((board) => (
              <Card key={board.id} className="shadow-soft border-border/60 hover:shadow-soft-lg transition-all duration-200 hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="text-lg">{board.name}</CardTitle>
                  <CardDescription>
                    Доска создана {new Date(board.createdAt).toLocaleDateString('ru-RU')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      Активна
                    </Badge>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/app/board/${board.id}`}>Открыть</Link>
                      </Button>
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm({
                            isOpen: true,
                            boardId: board.id,
                            boardName: board.name,
                            type: "board"
                          })}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          Удалить
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Members Section */}
      {isOwner && (
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Участники</h2>
            <p className="text-sm text-muted-foreground">
              Управляйте участниками рабочего пространства
            </p>
          </div>

          <WorkspaceSettings
            workspace={workspace}
            isOwner={isOwner}
            onUpdate={async (updates) => {
              try {
                const response = await fetch(`/api/workspaces/${params.id}`, {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(updates),
                });

                if (!response.ok) {
                  throw new Error("Failed to update workspace");
                }

                const updatedWorkspace = await response.json();
                setWorkspace(updatedWorkspace);
                setSuccess("Название рабочего пространства обновлено");
                setError(null);
              } catch (err) {
                setError("Ошибка при обновлении рабочего пространства");
                throw err;
              }
            }}
            onDelete={async () => {
              try {
                const response = await fetch(`/api/workspaces/${params.id}`, {
                  method: "DELETE",
                });

                if (!response.ok) {
                  throw new Error("Failed to delete workspace");
                }

                router.push("/app/dashboard");
                addToast("Рабочее пространство удалено", "success");
              } catch (err) {
                addToast("Ошибка при удалении рабочего пространства", "error");
                throw err;
              }
            }}
            onRemoveMember={async (memberId) => {
              try {
                const response = await fetch(`/api/workspaces/${params.id}/members/${memberId}`, {
                  method: "DELETE",
                });

                if (!response.ok) {
                  throw new Error("Failed to remove member");
                }

                // Refresh workspace data
                window.location.reload();
                addToast("Участник удален", "success");
              } catch (err) {
                addToast("Ошибка при удалении участника", "error");
                throw err;
              }
            }}
            onInviteMember={handleInviteMember}
          />
        </section>
      )}

      {/* Member Actions Section */}
      {!isOwner && (
        <section className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Управление участником</CardTitle>
              <CardDescription>
                Управляйте своим участием в этом рабочем пространстве
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                <div>
                  <h4 className="font-medium">Покинуть рабочее пространство</h4>
                  <p className="text-sm text-muted-foreground">
                    Если вы покинете это рабочее пространство, вы потеряете доступ ко всем доскам и задачам в нём.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={handleLeaveWorkspace}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Покинуть
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, boardId: "", boardName: "", type: "board" })}
        onConfirm={() => handleDeleteBoard(deleteConfirm.boardId)}
        title={`Удалить ${deleteConfirm.type === "workspace" ? "рабочее пространство" : "доску"}`}
        description={`Вы уверены, что хотите удалить "${deleteConfirm.boardName}"? Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
        variant="destructive"
        loading={isDeleting}
      />
    </Container>
  );
}
