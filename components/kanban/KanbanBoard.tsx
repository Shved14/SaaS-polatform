"use client";

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable
} from "@dnd-kit/core";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Plus, Calendar, User, AlertCircle, MoreHorizontal, X } from "lucide-react";

type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: "TODO", title: "TODO" },
  { id: "IN_PROGRESS", title: "IN PROGRESS" },
  { id: "REVIEW", title: "REVIEW" },
  { id: "DONE", title: "DONE" }
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
  name: string;
}

interface KanbanBoardProps {
  boardId: string;
  initialTasks: KanbanTask[];
  members: MemberOption[];
}

export default function KanbanBoard({
  boardId,
  initialTasks,
  members
}: KanbanBoardProps) {
  const [tasks, setTasks] = useState<KanbanTask[]>(initialTasks);
  const [isPending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 }
    })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const taskId = String(active.id);
    const columnId = over.id as TaskStatus;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === columnId) return;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
            ...t,
            status: columnId
          }
          : t
      )
    );

    startTransition(async () => {
      try {
        await fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: columnId })
        });
      } catch (e) {
        console.error("Failed to update task status", e);
      }
    });
  }

  async function handleCreateTask(formData: FormData) {
    const title = String(formData.get("title") ?? "").trim();
    const assigneeId = String(formData.get("assigneeId") ?? "") || null;
    const deadline = String(formData.get("deadline") ?? "") || null;
    const priority = (String(
      formData.get("priority") ?? "MEDIUM"
    )?.toUpperCase() || "MEDIUM") as TaskPriority;

    if (!title) {
      setFormError("Введите название задачи");
      return;
    }

    setCreating(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/boards/${boardId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          assigneeId,
          deadline,
          priority
        })
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
      <Card className="border-0 shadow-soft-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Plus className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Create New Task</h3>
          </div>
        </CardHeader>
        <CardContent>
          <form
            action={handleCreateTask}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
          >
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Task Title
              </Label>
              <Input
                id="title"
                name="title"
                type="text"
                placeholder="e.g., Implement drag & drop"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assigneeId" className="text-sm font-medium">
                Assignee
              </Label>
              <select
                id="assigneeId"
                name="assigneeId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                defaultValue=""
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
              <Label htmlFor="priority" className="text-sm font-medium">
                Priority
              </Label>
              <select
                id="priority"
                name="priority"
                defaultValue="MEDIUM"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline" className="text-sm font-medium">
                Deadline
              </Label>
              <Input
                id="deadline"
                name="deadline"
                type="date"
                className="h-10"
              />
            </div>
            <div className="flex items-end gap-2 lg:col-span-5">
              <Button
                type="submit"
                size="sm"
                disabled={creating}
                className="h-10 px-6"
              >
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

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 w-max md:w-full md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-4">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              tasks={tasks.filter((t) => t.status === column.id)}
              members={members}
              isUpdating={isPending}
              onDeleteTask={(id) =>
                setTasks((prev) => prev.filter((t) => t.id !== id))
              }
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  tasks: KanbanTask[];
  members: MemberOption[];
  isUpdating: boolean;
  onDeleteTask: (id: string) => void;
}

function KanbanColumn({
  id,
  title,
  tasks,
  members,
  isUpdating,
  onDeleteTask
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id
  });

  const getColumnColor = (columnId: TaskStatus) => {
    switch (columnId) {
      case "TODO":
        return "kanban-column-todo border-red-200 dark:border-red-800";
      case "IN_PROGRESS":
        return "kanban-column-inprogress border-yellow-200 dark:border-yellow-800";
      case "REVIEW":
        return "kanban-column-review border-blue-200 dark:border-blue-800";
      case "DONE":
        return "kanban-column-done border-green-200 dark:border-green-800";
      default:
        return "border-border";
    }
  };

  const getIcon = (columnId: TaskStatus) => {
    switch (columnId) {
      case "TODO":
        return "📋";
      case "IN_PROGRESS":
        return "🚀";
      case "REVIEW":
        return "👁️";
      case "DONE":
        return "✅";
      default:
        return "📌";
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[400px] w-[320px] flex-shrink-0 flex-col gap-3 rounded-xl border p-4 transition-all duration-200",
        getColumnColor(id),
        isOver && "ring-2 ring-primary/40 bg-primary/5"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getIcon(id)}</span>
          <div>
            <h3 className="font-semibold text-sm">{title}</h3>
            <p className="text-xs text-muted-foreground">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <Badge
          variant="secondary"
          className="h-6 min-w-[24px] rounded-full px-2 text-xs font-medium"
        >
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
              isUpdating={isUpdating}
              onDeleteTask={onDeleteTask}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface TaskCardProps {
  task: KanbanTask;
  members: MemberOption[];
  isUpdating: boolean;
  onDeleteTask: (id: string) => void;
}

function TaskCard({ task, members, isUpdating, onDeleteTask }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id
    });

  const style = transform
    ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`
    }
    : undefined;

  const memberName =
    task.assigneeName ||
    members.find((m) => m.id === task.assigneeId)?.name ||
    "Unassigned";

  const memberInitials = memberName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const deadlineLabel = task.deadline
    ? new Date(task.deadline).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    })
    : null;

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== "DONE";

  const getPriorityVariant = (priority: TaskPriority) => {
    switch (priority) {
      case "HIGH":
        return "destructive";
      case "LOW":
        return "success";
      default:
        return "warning";
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "TODO":
        return "border-l-red-400";
      case "IN_PROGRESS":
        return "border-l-yellow-400";
      case "REVIEW":
        return "border-l-blue-400";
      case "DONE":
        return "border-l-green-400";
      default:
        return "border-l-border";
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "task-card group relative border-l-4 bg-card p-3 transition-all duration-200",
        getStatusColor(task.status),
        isDragging && "dragging",
        "hover:shadow-soft-lg"
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h4 className="line-clamp-2 text-sm font-medium leading-tight">
          {task.title}
        </h4>
        <button
          type="button"
          onClick={async (e) => {
            e.stopPropagation();
            e.preventDefault();
            onDeleteTask(task.id);
            try {
              await fetch(`/api/tasks/${task.id}`, {
                method: "DELETE"
              });
            } catch (err) {
              console.error("Failed to delete task", err);
            }
          }}
          className="-mr-1 -mt-1 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px]">
              {memberInitials}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground truncate max-w-[80px]">
            {memberName}
          </span>
        </div>
        <Badge variant={getPriorityVariant(task.priority)} className="h-5 px-1.5 text-[10px] font-medium">
          {task.priority}
        </Badge>
      </div>

      {deadlineLabel && (
        <div className={cn(
          "mt-2 flex items-center gap-1 text-xs",
          isOverdue ? "text-destructive" : "text-muted-foreground"
        )}>
          <Calendar className="h-3 w-3" />
          <span>{deadlineLabel}</span>
          {isOverdue && <AlertCircle className="h-3 w-3" />}
        </div>
      )}

      {isUpdating && (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span>Syncing...</span>
        </div>
      )}
    </div>
  );
}

