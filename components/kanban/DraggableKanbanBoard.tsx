"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskModal } from "@/components/tasks/TaskModal";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { InviteMemberModal } from "@/components/workspace/InviteMemberModal";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBoardStats } from "./BoardStatsContext";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  deadline: Date | null;
  assigneeId: string | null;
  boardId: string;
}

interface DraggableKanbanBoardProps {
  boardId: string;
  tasks: Task[];
  workspaceMembers: Array<{ id: string; name: string | null; email: string }>;
  setTasks: (tasks: Task[]) => void;
}

const COLUMNS = [
  { id: "TODO", title: "К выполнению", bgColor: "bg-blue-50 dark:bg-blue-900/20" },
  { id: "IN_PROGRESS", title: "В работе", bgColor: "bg-yellow-50 dark:bg-yellow-900/20" },
  { id: "REVIEW", title: "На проверке", bgColor: "bg-orange-50 dark:bg-orange-900/20" },
  { id: "DONE", title: "Готово", bgColor: "bg-green-50 dark:bg-green-900/20" }
];

function TaskCard({ task, onClick, onEdit, onDelete }: {
  task: Task;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const priorityColors = {
    LOW: "bg-gray-100 text-gray-700",
    MEDIUM: "bg-yellow-100 text-yellow-700",
    HIGH: "bg-red-100 text-red-700"
  };

  const priorityLabels = {
    LOW: "Низкий",
    MEDIUM: "Средний",
    HIGH: "Высокий"
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-medium text-sm mb-2">{task.title}</h3>
            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`text-xs ${priorityColors[task.priority] || priorityColors.MEDIUM}`}>
              {priorityLabels[task.priority] || priorityLabels.MEDIUM}
            </Badge>
            {task.deadline && (
              <span className="text-xs text-muted-foreground">
                {typeof task.deadline === 'string'
                  ? new Date(task.deadline).toLocaleDateString('ru-RU')
                  : task.deadline.toLocaleDateString('ru-RU')
                }
              </span>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => e.stopPropagation()}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(); }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit task
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete?.(); }} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const TaskColumn = ({
  title,
  status,
  bgColor,
  onTaskClick,
  onTaskEdit,
  onTaskDelete,
  tasks
}: {
  title: string;
  status: string;
  bgColor: string;
  onTaskClick: (task: Task) => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (task: Task) => void;
  tasks: Task[];
}) => {
  const taskStats = tasks.filter(task => task.status === status).length;

  return (
    <div className={`p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 ${bgColor}`}>
      <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">{title}</h3>
      <div className="text-sm text-muted-foreground mb-3">
        {taskStats} {taskStats === 1 ? "задача" : "задачи"}
      </div>
      <div className="space-y-2">
        {tasks
          .filter(task => task.status === status)
          .map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
              onEdit={() => onTaskEdit(task)}
              onDelete={() => onTaskDelete(task)}
            />
          ))}
        {taskStats === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Нет задач
          </div>
        )}
      </div>
    </div>
  );
};

export function DraggableKanbanBoard({ boardId, tasks, workspaceMembers, setTasks }: DraggableKanbanBoardProps) {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    taskId: string | null;
    taskTitle: string;
  }>({
    isOpen: false,
    taskId: null,
    taskTitle: "",
  });

  const { stats, updateStats } = useBoardStats();

  // Task action handlers
  const handleTaskEdit = (task: Task) => {
    setSelectedTask(task);
  };

  const handleTaskDelete = (task: Task) => {
    setDeleteConfirm({
      isOpen: true,
      taskId: task.id,
      taskTitle: task.title,
    });
  };

  const confirmDeleteTask = async () => {
    if (!deleteConfirm.taskId) return;

    try {
      const response = await fetch(`/api/tasks/${deleteConfirm.taskId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const updatedTasks = tasks.filter((t: Task) => t.id !== deleteConfirm.taskId);
        setTasks(updatedTasks);
        setDeleteConfirm({ isOpen: false, taskId: null, taskTitle: "" });
      } else {
        console.error('Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const cancelDeleteTask = () => {
    setDeleteConfirm({ isOpen: false, taskId: null, taskTitle: "" });
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Kanban доска</h2>
          <p className="text-sm text-muted-foreground">
            Управляйте задачами в вашем проекте
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsTaskModalOpen(true)}
            className="gap-2 shadow-soft hover:shadow-soft-lg transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            Создать задачу
          </Button>
          <Button
            onClick={() => setIsInviteModalOpen(true)}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Пригласить
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {COLUMNS.map(column => (
          <TaskColumn
            key={column.id}
            title={column.title}
            status={column.id}
            bgColor={column.bgColor}
            onTaskClick={async (task: Task) => {
              // Load full task data with comments and attachments
              try {
                const response = await fetch(`/api/tasks/${task.id}`);
                if (response.ok) {
                  const fullTask = await response.json();
                  setSelectedTask(fullTask);
                } else {
                  setSelectedTask(task); // Fallback to basic task data
                }
              } catch (error) {
                console.error("Error loading task details:", error);
                setSelectedTask(task); // Fallback to basic task data
              }
            }}
            onTaskEdit={handleTaskEdit}
            onTaskDelete={handleTaskDelete}
            tasks={tasks}
          />
        ))}
      </div>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        boardId={boardId}
        workspaceMembers={workspaceMembers}
        onTaskCreated={() => {
          // Refresh tasks after creation
          window.location.reload();
        }}
        onTaskUpdate={(newTask) => {
          setTasks(prev => [...prev, newTask]);
        }}
      />
      <TaskDetailModal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        workspaceMembers={workspaceMembers.map(member => ({
          ...member,
          email: member.email || ""
        }))}
        onUpdate={(updatedTask) => {
          setTasks(prev => prev.map(task =>
            task.id === updatedTask.id ? updatedTask : task
          ));
          // Also update selectedTask if it's the same task
          if (selectedTask?.id === updatedTask.id) {
            setSelectedTask(updatedTask);
          }
        }}
        onDelete={(taskId) => {
          const updatedTasks = tasks.filter(task => task.id !== taskId);
          setTasks(updatedTasks);
        }}
      />
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        workspaceId={boardId}
      />

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={cancelDeleteTask}
        onConfirm={confirmDeleteTask}
        title="Удалить задачу"
        description={`Вы уверены, что хотите удалить "${deleteConfirm.taskTitle}"? Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
        variant="destructive"
      />
    </>
  );
}
