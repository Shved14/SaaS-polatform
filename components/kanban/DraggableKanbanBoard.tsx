"use client";

import { useState, useEffect } from "react";
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskModal } from "@/components/tasks/TaskModal";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { InviteMemberModal } from "@/components/workspace/InviteMemberModal";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus } from "lucide-react";
import { useBoardStats } from "./BoardStatsContext";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  deadline: Date | null;
  assigneeId: string | null;
}

interface DraggableKanbanBoardProps {
  boardId: string;
  tasks: Task[];
  workspaceMembers: Array<{ id: string; name: string | null; email: string | null }>;
}

const COLUMNS = [
  { id: "TODO", title: "К выполнению", bgColor: "bg-blue-50" },
  { id: "IN_PROGRESS", title: "В работе", bgColor: "bg-yellow-50" },
  { id: "REVIEW", title: "На проверке", bgColor: "bg-orange-50" },
  { id: "DONE", title: "Готово", bgColor: "bg-green-50" }
];

function TaskCard({ task, isDragging, onClick }: { task: Task; isDragging?: boolean; onClick: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityColors: Record<string, string> = {
    LOW: 'bg-green-100 text-green-800 border-green-200',
    MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    HIGH: 'bg-red-100 text-red-800 border-red-200'
  };

  const priorityLabels: Record<string, string> = {
    LOW: 'Низкий',
    MEDIUM: 'Средний',
    HIGH: 'Высокий'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="mb-2"
    >
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
        <CardContent className="p-3">
          <div className="space-y-2">
            <h4 className="text-sm font-medium leading-tight">{task.title}</h4>
            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
            )}
            <div className="flex items-center justify-between">
              <Badge className={`text-xs ${priorityColors[task.priority] || priorityColors.MEDIUM}`}>
                {priorityLabels[task.priority] || priorityLabels.MEDIUM}
              </Badge>
              {task.deadline && (
                <span className="text-xs text-muted-foreground">
                  {task.deadline.toLocaleDateString('ru-RU')}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Глобальный компонент для доступа к currentTasks
const TaskColumn = ({
  title,
  status,
  bgColor,
  onTaskClick,
  tasks,
  updateStats
}: {
  title: string;
  status: string;
  bgColor: string;
  onTaskClick: (task: Task) => void;
  tasks: Task[];
  updateStats: () => void;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const taskStats = tasks.filter(task => task.status === status).length;

  // Вызываем updateStats после рендеринга
  useEffect(() => {
    updateStats();
  }, [tasks]);

  return (
    <div
      ref={setNodeRef}
      className={`${bgColor} rounded-lg p-4 min-h-[400px] border-2 ${isOver ? 'border-blue-400 bg-opacity-80' : 'border-gray-200'
        } transition-colors`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-sm">{title}</h3>
        <Badge variant="outline" className="text-xs">
          {taskStats}
        </Badge>
      </div>
      <SortableContext
        id={status}
        items={tasks.filter(task => task.status === status).map(task => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {tasks
            .filter(task => task.status === status)
            .map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => setSelectedTask(task)}
              />
            ))}
          {taskStats === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Нет задач
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
};

export function DraggableKanbanBoard({ boardId, tasks, workspaceMembers }: DraggableKanbanBoardProps) {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [currentTasks, setCurrentTasks] = useState(tasks);

  const { stats, updateStats } = useBoardStats();

  // Функция для обновления глобального счетчика
  const updateGlobalStats = () => {
    const todoCount = currentTasks.filter(task => task.status === 'TODO').length;
    const inProgressCount = currentTasks.filter(task => task.status === 'IN_PROGRESS').length;
    const reviewCount = currentTasks.filter(task => task.status === 'REVIEW').length;
    const doneCount = currentTasks.filter(task => task.status === 'DONE').length;

    updateStats({
      total: currentTasks.length,
      todoCount,
      inProgressCount,
      reviewCount,
      doneCount
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    console.log("DragEnd:", { active: active.id, over: over?.id });

    if (!over) {
      console.log("No drop target");
      setActiveId(null);
      return;
    }

    const taskId = active.id as string;
    const newStatus = over.id as "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";

    console.log("Attempting to move task:", taskId, "to status:", newStatus);

    // Находим текущую задачу
    const currentTask = currentTasks.find(task => task.id === taskId);
    if (!currentTask || currentTask.status === newStatus) {
      console.log("Task not found or same status");
      setActiveId(null);
      return;
    }

    console.log("Current task status:", currentTask.status, "New status:", newStatus);

    // Обновляем статус задачи через API
    try {
      console.log("Making API request to:", `/api/tasks/${taskId}/status`);
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      console.log("API Response status:", response.status);

      if (response.ok) {
        console.log("Task status updated successfully");

        // Обновляем локальное состояние
        const updatedTasks = currentTasks.map(task =>
          task.id === taskId ? { ...task, status: newStatus } : task
        );
        setCurrentTasks(updatedTasks);

        // Обновляем глобальную статистику
        updateGlobalStats();
      } else {
        const errorData = await response.json();
        console.error("Failed to update task status:", response.status, errorData);
        alert(`Ошибка: ${errorData.error || "Не удалось обновить статус задачи"}`);
      }
    } catch (error) {
      console.error("Error updating task status:", error);
    }

    setActiveId(null);
  };

  const activeTask = currentTasks.find(task => task.id === activeId);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Kanban доска</h2>
          <p className="text-sm text-muted-foreground">
            Перетаскивайте задачи между колонками для изменения статуса
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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {COLUMNS.map(column => (
            <TaskColumn
              key={column.id}
              title={column.title}
              status={column.id}
              bgColor={column.bgColor}
              onTaskClick={(task: Task) => console.log("Task clicked:", task)}
              tasks={currentTasks}
              updateStats={updateStats}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="opacity-80">
              <TaskCard task={activeTask} isDragging={true} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        boardId={boardId}
        workspaceMembers={workspaceMembers}
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
          setCurrentTasks(prev => prev.map(task =>
            task.id === updatedTask.id ? updatedTask : task
          ));
        }}
        onDelete={(taskId) => {
          setCurrentTasks(prev => prev.filter(task => task.id !== taskId));
        }}
      />
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        workspaceId={boardId}
      />
    </>
  );
}
