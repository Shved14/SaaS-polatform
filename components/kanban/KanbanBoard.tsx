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
import { cn } from "@/lib/utils";

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
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border bg-card p-3 text-sm">
        <form
          action={handleCreateTask}
          className="flex flex-wrap items-end gap-3"
        >
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">
              Название задачи
            </label>
            <input
              name="title"
              type="text"
              placeholder="Например, реализовать drag & drop"
              className="h-9 w-64 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">
              Исполнитель
            </label>
            <select
              name="assigneeId"
              className="h-9 min-w-[160px] rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              defaultValue=""
            >
              <option value="">Не назначен</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">
              Приоритет
            </label>
            <select
              name="priority"
              defaultValue="MEDIUM"
              className="h-9 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">
              Дедлайн
            </label>
            <input
              name="deadline"
              type="date"
              className="h-9 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <Button type="submit" size="sm" disabled={creating}>
            {creating ? "Создание..." : "Создать задачу"}
          </Button>
          {formError && (
            <span className="text-xs text-red-500">{formError}</span>
          )}
        </form>
      </section>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="w-full overflow-x-auto pb-2 scroll-smooth">
          <div className="flex gap-4 min-w-max md:grid md:min-w-0 md:grid-cols-4 md:gap-4">
            {COLUMNS.map((column) => (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                tasks={tasks.filter((t) => t.status === column.id)}
                members={members}
                isUpdating={isPending}
              />
            ))}
          </div>
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
}

function KanbanColumn({
  id,
  title,
  tasks,
  members,
  isUpdating
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[200px] min-w-[260px] flex-shrink-0 flex-col gap-2 rounded-lg border p-2 text-xs md:min-w-0 md:flex-shrink",
        id === "TODO" && "kanban-column-todo",
        id === "IN_PROGRESS" && "kanban-column-inprogress",
        id === "REVIEW" && "kanban-column-review",
        id === "DONE" && "kanban-column-done",
        isOver && "ring-2 ring-primary/40"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold uppercase tracking-wide text-[10px]">
          {title}
        </span>
        <span className="rounded-full bg-card px-2 py-0.5 text-[10px] text-muted-foreground">
          {tasks.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            members={members}
            isUpdating={isUpdating}
          />
        ))}
      </div>
    </div>
  );
}

interface TaskCardProps {
  task: KanbanTask;
  members: MemberOption[];
  isUpdating: boolean;
}

function TaskCard({ task, members, isUpdating }: TaskCardProps) {
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
    "Не назначен";

  const deadlineLabel = task.deadline
    ? new Date(task.deadline).toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "short",
        day: "numeric"
      })
    : "Без дедлайна";

  const priorityColor =
    task.priority === "HIGH"
      ? "bg-red-500/10 text-red-700"
      : task.priority === "LOW"
      ? "bg-emerald-500/10 text-emerald-700"
      : "bg-amber-500/10 text-amber-700";

  const statusColor =
    task.status === "DONE"
      ? "border-emerald-200 bg-emerald-50"
      : task.status === "IN_PROGRESS" || task.status === "REVIEW"
      ? "border-amber-200 bg-amber-50"
      : "border-red-200 bg-red-50";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "cursor-grab touch-none rounded-md border p-2 text-[11px] shadow-sm transition hover:border-primary/60 hover:shadow",
        statusColor,
        isDragging && "opacity-70 ring-2 ring-primary/40"
      )}
    >
      <p className="mb-1 line-clamp-2 font-medium">{task.title}</p>
      <div className="flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground">
        <span className="rounded-full bg-muted px-2 py-0.5">
          {memberName}
        </span>
        <span className={cn("rounded-full px-2 py-0.5", priorityColor)}>
          {task.priority}
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5">
          {deadlineLabel}
        </span>
      </div>
      {isUpdating && (
        <p className="mt-1 text-[10px] text-muted-foreground">
          Синхронизация...
        </p>
      )}
    </div>
  );
}

