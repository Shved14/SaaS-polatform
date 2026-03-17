"use client";

import { useState, useEffect, useCallback } from "react";
import { DndContext, DragEndEvent, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { TaskCard } from "@/components/tasks/TaskCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface EnhancedKanbanBoardProps {
  boardId: string;
  workspaceId: string;
  initialTasks?: Task[];
  workspaceMembers: Array<{ id: string; name: string | null; email: string }>;
  onTaskUpdate?: (updatedTask: any) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskCreate?: () => void;
}

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: "TODO", title: "К выполнению", color: "border-gray-200 dark:border-gray-700" },
  { id: "IN_PROGRESS", title: "В процессе", color: "border-blue-200 dark:border-blue-700" },
  { id: "REVIEW", title: "На проверке", color: "border-purple-200 dark:border-purple-700" },
  { id: "DONE", title: "Выполнено", color: "border-green-200 dark:border-green-700" },
];

// Skeleton компонент для загрузки
function TaskCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
        </div>
        <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-8"></div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/4"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/3"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/5"></div>
      </div>
      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-2/3 mt-2"></div>
    </div>
  );
}

// Skeleton для колонки
function ColumnSkeleton() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 min-h-[400px]">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-8"></div>
      </div>
      <div className="space-y-3">
        <TaskCardSkeleton />
        <TaskCardSkeleton />
        <TaskCardSkeleton />
      </div>
    </div>
  );
}

export function EnhancedKanbanBoard({
  boardId,
  workspaceId,
  initialTasks = [],
  workspaceMembers,
  onTaskUpdate,
  onTaskDelete,
  onTaskCreate
}: EnhancedKanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState<TaskPriority | "all">("all");
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 8 } })
  );

  // Фильтрация задач
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesPriority = filterPriority === "all" || task.priority === filterPriority;
    const matchesStatus = filterStatus === "all" || task.status === filterStatus;

    return matchesSearch && matchesPriority && matchesStatus;
  });

  // Группировка задач по колонкам
  const tasksByStatus = filteredTasks.reduce((acc, task) => {
    if (!acc[task.status]) {
      acc[task.status] = [];
    }
    acc[task.status].push(task);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !active) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );

    if (onTaskUpdate) {
      const updatedTask = tasks.find(t => t.id === taskId);
      if (updatedTask) {
        onTaskUpdate({ ...updatedTask, status: newStatus });
      }
    }
  }, [tasks, onTaskUpdate]);

  const handleTaskClick = useCallback((taskId: string) => {
    // Открытие детальной информации о задаче
    console.log("Task clicked:", taskId);
  }, []);

  const handleTaskUpdate = useCallback(async (updatedTask: any) => {
    setLoading(true);
    try {
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === updatedTask.id ? { ...task, ...updatedTask } : task
        )
      );

      if (onTaskUpdate) {
        await onTaskUpdate(updatedTask);
      }
    } catch (error) {
      console.error("Failed to update task:", error);
    } finally {
      setLoading(false);
    }
  }, [onTaskUpdate]);

  const handleTaskDelete = useCallback(async (taskId: string) => {
    setLoading(true);
    try {
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));

      if (onTaskDelete) {
        await onTaskDelete(taskId);
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    } finally {
      setLoading(false);
    }
  }, [onTaskDelete]);

  // Загрузка состояния
  if (loading && tasks.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((column) => (
          <ColumnSkeleton key={column.id} />
        ))}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="space-y-4">
        {/* Панель фильтров и поиска */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Поиск */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Поиск задач..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Фильтры */}
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as TaskStatus | "all")}
                className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm"
              >
                <option value="all">Все статусы</option>
                {COLUMNS.map(column => (
                  <option key={column.id} value={column.id}>
                    {column.title}
                  </option>
                ))}
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value as TaskPriority | "all")}
                className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm"
              >
                <option value="all">Все приоритеты</option>
                <option value="LOW">Низкий</option>
                <option value="MEDIUM">Средний</option>
                <option value="HIGH">Высокий</option>
              </select>
            </div>
          </div>
        </div>

        {/* Kanban доска */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map((column) => {
            const columnTasks = tasksByStatus[column.id] || [];

            return (
              <div
                key={column.id}
                className={cn(
                  "bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 min-h-[400px]",
                  column.color
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {column.title}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {columnTasks.length}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      boardId={boardId}
                      workspaceId={workspaceId}
                      workspaceMembers={workspaceMembers}
                      onTaskClick={handleTaskClick}
                      onTaskUpdate={handleTaskUpdate}
                      onTaskDelete={handleTaskDelete}
                    />
                  ))}

                  {columnTasks.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                      Нет задач в этой колонке
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DndContext>
  );
}
