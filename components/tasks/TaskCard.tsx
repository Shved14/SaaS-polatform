"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  AlertCircle, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  User,
  Clock,
  CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { ConfirmDeleteModal } from "@/components/modals/ConfirmDeleteModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

interface TaskCardProps {
  task: {
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
  };
  boardId: string;
  workspaceId: string;
  onTaskClick?: (taskId: string) => void;
  onTaskUpdate?: (updatedTask: any) => void;
  onTaskDelete?: (taskId: string) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  workspaceMembers: Array<{ id: string; name: string | null; email: string }>;
}

const priorityColors = {
  LOW: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  HIGH: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
};

const priorityLabels = {
  LOW: "Низкий",
  MEDIUM: "Средний",
  HIGH: "Высокий"
};

const statusColors = {
  TODO: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  REVIEW: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
  DONE: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
};

const statusLabels = {
  TODO: "К выполнению",
  IN_PROGRESS: "В процессе",
  REVIEW: "На проверке",
  DONE: "Выполнено"
};

export function TaskCard({ 
  task, 
  boardId, 
  workspaceId, 
  onTaskClick, 
  onTaskUpdate, 
  onTaskDelete,
  isDragging = false,
  isDragOver = false,
  workspaceMembers 
}: TaskCardProps) {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Проверка дедлайна
  const getDeadlineStatus = () => {
    if (!task.deadline) return null;
    
    const deadline = new Date(task.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (deadline < today) {
      return { status: "overdue", color: "text-red-600 dark:text-red-400", label: "Просрочено" };
    } else if (deadline < tomorrow) {
      return { status: "today", color: "text-orange-600 dark:text-orange-400", label: "Сегодня" };
    } else {
      return { status: "normal", color: "text-gray-600 dark:text-gray-400", label: "" };
    }
  };

  const deadlineStatus = getDeadlineStatus();
  const isOverdue = deadlineStatus?.status === "overdue";
  const isDueToday = deadlineStatus?.status === "today";

  const handleTaskClick = () => {
    if (onTaskClick) {
      onTaskClick(task.id);
    }
  };

  const handleDelete = async () => {
    if (!onTaskDelete) return;
    
    setIsDeleting(true);
    try {
      await onTaskDelete(task.id);
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Failed to delete task:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDeadline = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  return (
    <>
      <Card 
        className={cn(
          "cursor-pointer transition-all duration-200 hover:shadow-md",
          isDragging && "opacity-50 rotate-2 scale-95",
          isDragOver && "ring-2 ring-blue-400",
          isOverdue && "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10"
        )}
        onClick={handleTaskClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm leading-tight truncate pr-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {task.title}
              </h3>
              
              {/* Индикаторы дедлайна */}
              {(deadlineStatus) && (
                <div className="flex items-center gap-2 mt-2">
                  {isOverdue && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {deadlineStatus.label}
                    </Badge>
                  )}
                  {isDueToday && !isOverdue && (
                    <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
                      <Clock className="w-3 h-3 mr-1" />
                      {deadlineStatus.label}
                    </Badge>
                  )}
                </div>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setShowDetailModal(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Изменить
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setShowDeleteModal(true)}
                  className="text-red-600 dark:text-red-400"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
            {/* Приоритет */}
            <Badge 
              variant="outline" 
              className={cn("text-xs", priorityColors[task.priority])}
            >
              {priorityLabels[task.priority]}
            </Badge>
            
            {/* Статус */}
            <Badge 
              variant="outline" 
              className={cn("text-xs", statusColors[task.status])}
            >
              {statusLabels[task.status]}
            </Badge>
            
            {/* Исполнитель */}
            {task.assignee && (
              <div className="flex items-center gap-1">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-xs">
                    {task.assignee.name?.[0] || task.assignee.email[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate max-w-20">
                  {task.assignee.name || task.assignee.email}
                </span>
              </div>
            )}
            
            {/* Дедлайн */}
            {task.deadline && (
              <div className={cn("flex items-center gap-1", deadlineStatus?.color)}>
                <Calendar className="h-3 w-3" />
                <span>{formatDeadline(task.deadline)}</span>
              </div>
            )}
          </div>
          
          {/* Описание */}
          {task.description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
              {task.description}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Модальное окно детальной информации */}
      <TaskDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        task={task}
        workspaceMembers={workspaceMembers}
        onUpdate={onTaskUpdate}
      />

      {/* Модальное окно подтверждения удаления */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        title="Удалить задачу"
        description={`Вы уверены, что хотите удалить задачу "${task.title}"?`}
      />
    </>
  );
}
