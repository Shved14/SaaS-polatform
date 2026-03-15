"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskModal } from "@/components/tasks/TaskModal";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { InviteMemberModal } from "@/components/workspace/InviteMemberModal";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDeleteModal } from "@/components/modals/ConfirmDeleteModal";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  useDroppable,
} from "@dnd-kit/core";
import { Task, User } from "@/lib/types";

interface DraggableKanbanBoardProps {
  boardId: string;
  tasks: Task[];
  workspaceMembers: User[];
  setTasks: (tasks: Task[]) => void;
}

const COLUMNS = [
  { id: "TODO", title: "К выполнению", bgColor: "bg-blue-50 dark:bg-blue-900/20" },
  { id: "IN_PROGRESS", title: "В работе", bgColor: "bg-yellow-50 dark:bg-yellow-900/20" },
  { id: "REVIEW", title: "На проверке", bgColor: "bg-orange-50 dark:bg-orange-900/20" },
  { id: "DONE", title: "Готово", bgColor: "bg-green-50 dark:bg-green-900/20" }
];

function SortableTaskCard({ task, onClick, onEdit, onDelete }: {
  task: Task;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start mb-2">
        <h3
          className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2 cursor-pointer flex-1"
          onClick={onClick}
          {...attributes}
          {...listeners}
        >
          {task.title}
        </h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 ml-2"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
              Просмотр
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(); }}>
              <Edit className="h-4 w-4 mr-2" />
              Изменить
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete?.(); }} className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {task.description && (
        <p
          className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 cursor-pointer"
          onClick={onClick}
          {...attributes}
          {...listeners}
        >
          {task.description}
        </p>
      )}
      <div className="flex items-center justify-between">
        <Badge className={priorityColors[task.priority] || 'bg-yellow-100 text-yellow-800'}>
          {priorityLabels[task.priority] || 'Средний'}
        </Badge>
        {task.deadline && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(task.deadline).toLocaleDateString('ru-RU')}
          </span>
        )}
      </div>
    </div>
  );
}

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

const SortableTaskColumn = ({
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
  const columnTasks = tasks.filter(task => task.status === status);

  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div
      ref={setNodeRef}
      className={`p-4 rounded-lg border-2 transition-colors ${isOver
        ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/10'
        : 'border-gray-200 dark:border-gray-700'
        } ${bgColor}`}
    >
      <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">{title}</h3>
      <div className="text-sm text-muted-foreground mb-3">
        {taskStats} {taskStats === 1 ? "задача" : "задачи"}
      </div>
      <div className="space-y-2">
        <SortableContext
          items={columnTasks.map(task => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {columnTasks.map(task => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
              onEdit={() => onTaskEdit(task)}
              onDelete={() => onTaskDelete(task)}
            />
          ))}
        </SortableContext>
        {taskStats === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Нет задач
          </div>
        )}
      </div>
    </div>
  );
};

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
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    taskId: string | null;
    taskTitle: string;
  }>({
    isOpen: false,
    taskId: null,
    taskTitle: "",
  });

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // DnD handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t: Task) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Remove this handler as it's causing issues
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeTaskId = active.id as string;
    const overStatus = over.id as string;

    // Only handle column drops
    if (COLUMNS.some(col => col.id === overStatus)) {
      const activeTask = tasks.find((t: Task) => t.id === activeTaskId);
      if (activeTask && activeTask.status !== overStatus) {
        const updatedTasks = tasks.map((t: Task) =>
          t.id === activeTaskId ? { ...t, status: overStatus as Task['status'] } : t
        );
        setTasks(updatedTasks);

        // Update task in database
        fetch(`/api/tasks/${activeTaskId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: overStatus,
          }),
        }).catch(console.error);
      }
    }

    setActiveTask(null);
  };

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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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

        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {COLUMNS.map(column => (
          <SortableTaskColumn
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

      <DragOverlay>
        {activeTask ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:shadow-md transition-shadow opacity-50">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2">{activeTask.title}</h3>
            </div>
            {activeTask.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{activeTask.description}</p>
            )}
            <div className="flex items-center justify-between">
              <Badge className={
                activeTask.priority === 'HIGH' ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400" :
                  activeTask.priority === 'MEDIUM' ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400" :
                    "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
              }>
                {activeTask.priority === 'HIGH' ? 'Высокий' : activeTask.priority === 'MEDIUM' ? 'Средний' : 'Низкий'}
              </Badge>
              {activeTask.deadline && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(activeTask.deadline).toLocaleDateString('ru-RU')}
                </span>
              )}
            </div>
          </div>
        ) : null}
      </DragOverlay>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        boardId={boardId}
        workspaceMembers={workspaceMembers}
        onTaskCreated={() => {
          // Refresh tasks after creation
          window.location.reload();
        }}
        onTaskUpdate={(newTask: Task) => {
          const updatedTasks = [...tasks, newTask];
          setTasks(updatedTasks);
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
        onUpdate={(updatedTask: Task) => {
          const updatedTasks = tasks.map((task: Task) =>
            task.id === updatedTask.id ? updatedTask : task
          );
          setTasks(updatedTasks);
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

      <ConfirmDeleteModal
        isOpen={deleteConfirm.isOpen}
        onConfirm={confirmDeleteTask}
        onCancel={cancelDeleteTask}
        title="Удалить задачу"
        description={`Вы уверены, что хотите удалить задачу "${deleteConfirm.taskTitle}"? Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
      />
    </DndContext>
  );
}
