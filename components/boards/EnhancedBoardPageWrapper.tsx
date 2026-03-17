"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Settings, Loader2, ArrowLeft } from "lucide-react";
import { EnhancedKanbanBoard } from "@/components/kanban/EnhancedKanbanBoard";
import { EnhancedTaskModal } from "@/components/tasks/EnhancedTaskModal";
import { ConfirmDeleteModal } from "@/components/modals/ConfirmDeleteModal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { GlobalToastProvider, useToast } from "@/components/ui/enhanced-toast";
import { ActivityService } from "@/lib/activity-service";

type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string | null;
  assignee: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  boardId: string;
  createdAt: string;
  updatedAt: string;
}

interface Board {
  id: string;
  name: string;
  description: string | null;
  workspaceId: string;
}

interface WorkspaceMember {
  id: string;
  name: string | null;
  email: string;
}

interface EnhancedBoardPageWrapperProps {
  boardId: string;
  workspaceId: string;
  initialBoard?: Board;
  initialTasks?: Task[];
  initialMembers?: WorkspaceMember[];
  onBoardUpdate?: (updatedBoard: any) => void;
  onBoardDelete?: (boardId: string) => void;
}

export function EnhancedBoardPageWrapper({
  boardId,
  workspaceId,
  initialBoard,
  initialTasks = [],
  initialMembers = [],
  onBoardUpdate,
  onBoardDelete
}: EnhancedBoardPageWrapperProps) {
  const [board, setBoard] = useState<Board | null>(initialBoard || null);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [members, setMembers] = useState<WorkspaceMember[]>(initialMembers);
  const [loading, setLoading] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showBoardSettings, setShowBoardSettings] = useState(false);

  const { success, error, info, loading: loadingToast } = useToast();

  // Загрузка данных
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Загрузка доски
        const boardResponse = await fetch(`/api/boards/${boardId}`);
        if (boardResponse.ok) {
          const boardData = await boardResponse.json();
          setBoard(boardData);
        }

        // Загрузка задач
        const tasksResponse = await fetch(`/api/boards/${boardId}/tasks`);
        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          setTasks(tasksData);
        }

        // Загрузка участников
        const membersResponse = await fetch(`/api/workspaces/${workspaceId}/members`);
        if (membersResponse.ok) {
          const membersData = await membersResponse.json();
          setMembers(membersData);
        }
      } catch (error) {
        console.error("Failed to load board data:", error);
        error("Ошибка загрузки данных доски");
      } finally {
        setLoading(false);
      }
    };

    if (!initialBoard || initialTasks.length === 0) {
      loadData();
    }
  }, [boardId, workspaceId, initialBoard, initialTasks, initialMembers]);

  const handleTaskCreate = async (newTask: any) => {
    try {
      const response = await fetch(`/api/boards/${boardId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask)
      });

      if (response.ok) {
        const createdTask = await response.json();
        setTasks(prev => [...prev, createdTask]);
        setShowTaskModal(false);

        // Логируем создание задачи
        ActivityService.task.created(
          newTask.userId,
          createdTask.id || '',
          createdTask.title,
          members
        );

        success("Задача успешно создана!");
      } else {
        const errorData = await response.json();
        error(errorData.error || "Ошибка при создании задачи");
      }
    } catch (error) {
      console.error("Failed to create task:", error);
      error("Ошибка при создании задачи");
    } finally {
      setLoading(false);
    }
  };

  const handleTaskUpdate = async (updatedTask: any) => {
    try {
      const response = await fetch(`/api/tasks/${updatedTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTask)
      });

      if (response.ok) {
        setTasks(prev =>
          prev.map(task =>
            task.id === updatedTask.id ? { ...task, ...updatedTask } : task
          )
        );
        success("Задача успешно обновлена!");
      } else {
        const errorData = await response.json();
        error(errorData.error || "Ошибка при обновлении задачи");
      }
    } catch (error) {
      console.error("Failed to update task:", error);
      error("Ошибка при обновлении задачи");
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        setTasks(prev => prev.filter(task => task.id !== taskId));
        success("Задача успешно удалена!");
      } else {
        const errorData = await response.json();
        error(errorData.error || "Ошибка при удалении задачи");
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
      error("Ошибка при удалении задачи");
    }
  };

  const handleBoardDelete = async () => {
    if (!board) return;

    try {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        success("Доска успешно удалена!");
        // Перенаправление на workspace
        window.location.href = `/app/workspace/${workspaceId}`;
      } else {
        const errorData = await response.json();
        error(errorData.error || "Ошибка при удалении доски");
      }
    } catch (error) {
      console.error("Failed to delete board:", error);
      error("Ошибка при удалении доски");
    }
  };

  // Получение статистики
  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === "DONE").length;
    const inProgress = tasks.filter(t => t.status === "IN_PROGRESS").length;
    const overdue = tasks.filter(t => {
      if (!t.deadline) return false;
      const deadline = new Date(t.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return deadline < today;
    }).length;

    return { total, completed, inProgress, overdue };
  };

  const stats = getTaskStats();

  if (loading && !board) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Загрузка доски...</p>
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Доска не найдена</p>
        </div>
      </div>
    );
  }

  return (
    <GlobalToastProvider>
      <div className="space-y-6">
        {/* Header с навигацией и статистикой */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
                className="text-gray-600 dark:text-gray-400"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Назад
              </Button>

              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {board.name}
                </h1>
                {board.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {board.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Статистика */}
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.total}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Всего задач
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.inProgress}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    В процессе
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.completed}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Выполнено
                  </div>
                </div>
                {stats.overdue > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {stats.overdue}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Просрочено
                    </div>
                  </div>
                )}
              </div>

              {/* Кнопки действий */}
              <div className="flex gap-2">
                <Button onClick={() => setShowTaskModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Новая задача
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setShowBoardSettings(true)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Настройки
                </Button>
              </div>
            </div>
          </div>

          {/* Индикаторы дедлайнов */}
          {stats.overdue > 0 && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-red-600 rounded-full animate-pulse"></div>
                <p className="text-sm text-red-600 dark:text-red-400">
                  У вас есть {stats.overdue} просроченн{stats.overdue === 1 ? "ая" : "ых"} задач{stats.overdue === 1 ? "а" : ""}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Kanban доска */}
        <EnhancedKanbanBoard
          boardId={boardId}
          workspaceId={workspaceId}
          initialTasks={tasks}
          workspaceMembers={members}
          onTaskUpdate={handleTaskUpdate}
          onTaskDelete={handleTaskDelete}
          onTaskCreate={() => setShowTaskModal(true)}
        />
      </div>

      {/* Модальное окно создания/редактирования задачи */}
      <EnhancedTaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        workspaceMembers={members}
        onCreate={handleTaskCreate}
        onUpdate={handleTaskUpdate}
        mode={selectedTask ? "edit" : "create"}
      />

      {/* Модальное окно подтверждения удаления доски */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onConfirm={handleBoardDelete}
        onCancel={() => setShowDeleteModal(false)}
        title="Удалить доску"
        description={`Вы уверены, что хотите удалить доску "${board.name}"? Все задачи на этой доске будут также удалены.`}
        confirmText="Удалить доску"
      />
    </GlobalToastProvider>
  );
}
