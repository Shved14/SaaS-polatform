"use client";

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Plus,
  Calendar,
  AlertCircle,
  MoreHorizontal,
  X,
  Edit2,
  Flag,
  Users,
} from "lucide-react";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: "TODO", title: "TODO" },
  { id: "IN_PROGRESS", title: "IN PROGRESS" },
  { id: "REVIEW", title: "REVIEW" },
  { id: "DONE", title: "DONE" },
];

export interface KanbanTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
}

interface MemberOption {
  id: string;
  name: string | null;
  email?: string | null;
}

interface KanbanBoardProps {
  boardId: string;
  workspaceId: string;
  initialTasks: KanbanTask[];
  members: MemberOption[];
}

export default function KanbanBoard({
  boardId,
  workspaceId,
  initialTasks,
  members,
}: KanbanBoardProps) {
  const [tasks, setTasks] = useState<KanbanTask[]>(initialTasks);
  const [isPending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    taskId: string | null;
    taskTitle: string;
  }>({ isOpen: false, taskId: null, taskTitle: "" });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  // --- Handlers ---
  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsTaskModalOpen(true);
  };
  const handleCloseTaskModal = () => {
    setSelectedTaskId(null);
    setIsTaskModalOpen(false);
  };
  const handleDeleteTask = (taskId: string, taskTitle: string) =>
    setDeleteConfirm({ isOpen: true, taskId, taskTitle });
  const cancelDeleteTask = () =>
    setDeleteConfirm({ isOpen: false, taskId: null, taskTitle: "" });
  const confirmDeleteTask = async () => {
    if (!deleteConfirm.taskId) return;
    try {
      await fetch(`/api/tasks/${deleteConfirm.taskId}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((t) => t.id !== deleteConfirm.taskId));
    } catch (e) {
      console.error("Failed to delete task", e);
    } finally {
      cancelDeleteTask();
    }
  };

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const taskId = String(active.id);
    const columnId = over.id as TaskStatus;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === columnId) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: columnId } : t))
    );

    startTransition(async () => {
      try {
        await fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: columnId }),
        });
      } catch (e) {
        console.error("Failed to update task status", e);
      }
    });
  }

  async function handleQuickEdit(taskId: string, field: string, value: any) {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, [field]: value } : t))
    );

    startTransition(async () => {
      try {
        await fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: value }),
        });
      } catch (e) {
        console.error(`Failed to update task ${field}`, e);
      }
    });
  }

  async function handleCreateTask(formData: FormData) {
    const title = String(formData.get("title") ?? "").trim();
    if (!title) {
      setFormError("Введите название задачи");
      return;
    }

    const assigneeId = String(formData.get("assigneeId") ?? "") || null;
    const deadline = String(formData.get("deadline") ?? "") || null;
    const priority = (String(formData.get("priority") ?? "MEDIUM").toUpperCase() ||
      "MEDIUM") as TaskPriority;

    setCreating(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/boards/${boardId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, assigneeId, deadline, priority }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFormError(data.error || "Не удалось создать задачу");
        return;
      }

      const created: KanbanTask = await res.json();
      setTasks((prev) => [...prev, created]);
    } catch (e) {
      console.error("Create task error", e);
      setFormError("Ошибка создания задачи");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex w-max flex-col gap-6 md:w-full">
      {/* Create Task Card */}
      <Card className="border-0 shadow-soft-lg">
        <CardHeader className="pb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Plus className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Create New Task</h3>
        </CardHeader>
        <CardContent>
          <form
            action={handleCreateTask}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
          >
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                name="title"
                type="text"
                placeholder="e.g., Implement drag & drop"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assigneeId">Assignee</Label>
              <select
                id="assigneeId"
                name="assigneeId"
                defaultValue=""
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                name="priority"
                defaultValue="MEDIUM"
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input id="deadline" name="deadline" type="date" className="h-10" />
            </div>
            <div className="flex items-end gap-2 lg:col-span-5">
              <Button type="submit" disabled={creating}>
                {creating ? "Creating..." : "Create Task"}
              </Button>
              {formError && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {formError}
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Kanban Columns */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 w-max md:w-full md:grid md:grid-cols-2 lg:grid-cols-4">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.title}
              tasks={tasks.filter((t) => t.status === col.id)}
              members={members}
              isPending={isPending}
              onDeleteTask={handleDeleteTask}
              onTaskClick={handleTaskClick}
              onQuickEdit={handleQuickEdit}
            />
          ))}
        </div>
      </DndContext>

      {/* Task Detail Modal */}
      {selectedTaskId && (
        <TaskDetailModal
          isOpen={isTaskModalOpen}
          onClose={handleCloseTaskModal}
          task={tasks.find((t) => t.id === selectedTaskId)!} 
          workspaceMembers={members.map(m => ({
      id: m.id,
      name: m.name,
      email: m.email || ""  // <- заменили null на пустую строку
    }))}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={cancelDeleteTask}
        onConfirm={confirmDeleteTask}
        title="Delete Task"
        description={`Are you sure you want to delete "${deleteConfirm.taskTitle}"? This action cannot be undone.`}
        confirmText="Delete Task"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}

// --- Kanban Column ---
interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  tasks: KanbanTask[];
  members: MemberOption[];
  isPending: boolean;
  onDeleteTask: (id: string, title: string) => void;
  onTaskClick: (id: string) => void;
  onQuickEdit: (taskId: string, field: string, value: any) => void;
}

function KanbanColumn({
  id,
  title,
  tasks,
  members,
  isPending,
  onDeleteTask,
  onTaskClick,
  onQuickEdit,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const getColumnColor = (columnId: TaskStatus) => {
    switch (columnId) {
      case "TODO": return "border-red-200 dark:border-red-800";
      case "IN_PROGRESS": return "border-yellow-200 dark:border-yellow-800";
      case "REVIEW": return "border-blue-200 dark:border-blue-800";
      case "DONE": return "border-green-200 dark:border-green-800";
      default: return "border-border";
    }
  };
  const getIcon = (columnId: TaskStatus) => {
    switch (columnId) {
      case "TODO": return "📋";
      case "IN_PROGRESS": return "🚀";
      case "REVIEW": return "👁️";
      case "DONE": return "✅";
      default: return "📌";
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[400px] w-[320px] flex-shrink-0 flex-col gap-3 rounded-xl border p-4 transition-all duration-250",
        getColumnColor(id),
        isOver ? "ring-2 ring-primary/40 bg-primary/5 scale-[1.02]" : "hover:bg-muted/30 hover:border-primary/20"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getIcon(id)}</span>
          <div>
            <h3 className="font-semibold text-sm">{title}</h3>
            <p className="text-xs text-muted-foreground">
              {tasks.length} task{tasks.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="h-6 min-w-[24px] rounded-full px-2 text-xs font-medium">
          {tasks.length}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {tasks.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 py-8">
            <p className="text-xs text-muted-foreground">No tasks yet</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              members={members}
              isPending={isPending}
              onDeleteTask={onDeleteTask}
              onTaskClick={onTaskClick}
              onQuickEdit={onQuickEdit}
            />
          ))
        )}
      </div>
    </div>
  );
}

// --- Task Card ---
interface TaskCardProps {
  task: KanbanTask;
  members: MemberOption[];
  isPending: boolean;
  onDeleteTask: (id: string, title: string) => void;
  onTaskClick: (id: string) => void;
  onQuickEdit: (taskId: string, field: string, value: any) => void;
}

function TaskCard({ task, members, isPending, onDeleteTask, onTaskClick, onQuickEdit }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  const memberName = task.assigneeName || members.find((m) => m.id === task.assigneeId)?.name || "Unassigned";
  const memberInitials = memberName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const deadlineLabel = task.deadline ? new Date(task.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : null;
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== "DONE";

  const getPriorityVariant = (priority: TaskPriority) => {
    switch (priority) {
      case "HIGH": return "destructive";
      case "LOW": return "success";
      default: return "warning";
    }
  };
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "TODO": return "border-l-red-400";
      case "IN_PROGRESS": return "border-l-yellow-400";
      case "REVIEW": return "border-l-blue-400";
      case "DONE": return "border-l-green-400";
      default: return "border-l-border";
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onTaskClick(task.id)}
      className={cn(
        "task-card group relative border-l-4 bg-card p-3 transition-all duration-200 cursor-grab active:cursor-grabbing",
        getStatusColor(task.status),
        isDragging ? "dragging opacity-80 rotate-2 scale-105 shadow-2xl" : "hover:shadow-soft-lg hover:-translate-y-1",
        "hover:border-primary/30"
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h4 className="line-clamp-2 text-sm font-medium leading-tight">{task.title}</h4>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
              className="-mr-1 -mt-1 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
            >
              <MoreHorizontal className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onTaskClick(task.id); }} className="gap-2">
              <Edit2 className="h-4 w-4" /> Edit Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id, task.title); }} className="gap-2 text-destructive">
              <X className="h-4 w-4" /> Delete Task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {memberName && (
            <Avatar className="h-6 w-6">
              <AvatarFallback>{memberInitials}</AvatarFallback>
            </Avatar>
          )}
          {deadlineLabel && (
            <Badge variant={isOverdue ? "destructive" : "secondary"} className="h-5 text-[10px]">
              <Calendar className="mr-1 h-3 w-3" /> {deadlineLabel}
            </Badge>
          )}
        </div>
        <Badge variant={getPriorityVariant(task.priority)} className="h-5 text-[10px]">
          {task.priority}
        </Badge>
      </div>
    </div>
  );
}
