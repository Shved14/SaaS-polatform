"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Upload, Download, X, Plus, CheckSquare, Paperclip, Send, Edit2, MessageSquare, User, AlertCircle } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface EnhancedTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: any;
  workspaceMembers: Array<{ id: string; name: string | null; email: string }>;
  onUpdate?: (updatedTask: any) => void;
  onCreate?: (newTask: any) => void;
  mode?: "create" | "edit";
}

type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

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

export function EnhancedTaskModal({
  isOpen,
  onClose,
  task,
  workspaceMembers,
  onUpdate,
  onCreate,
  mode = "create"
}: EnhancedTaskModalProps) {
  const [formData, setFormData] = useState({
    title: task?.title || "",
    description: task?.description || "",
    status: task?.status || "TODO",
    priority: task?.priority || "MEDIUM",
    assigneeId: task?.assigneeId || "",
    deadline: task?.deadline ? task.deadline.split('T')[0] : ""
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = mode === "edit" && task;
  const title = isEdit ? "Редактировать задачу" : "Создать задачу";

  // Валидация формы
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Название задачи обязательно";
    }

    if (formData.deadline) {
      const deadlineDate = new Date(formData.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (deadlineDate < today) {
        newErrors.deadline = "Дедлайн не может быть в прошлом";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null
      };

      if (isEdit && onUpdate) {
        await onUpdate({ ...task, ...submitData });
      } else if (onCreate) {
        await onCreate(submitData);
      }

      onClose();
      setFormData({
        title: "",
        description: "",
        status: "TODO",
        priority: "MEDIUM",
        assigneeId: "",
        deadline: ""
      });
      setErrors({});
    } catch (error) {
      console.error("Failed to save task:", error);
      setErrors({ submit: "Ошибка при сохранении задачи" });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Очищаем ошибку поля при изменении
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // Сброс формы при закрытии
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        title: task?.title || "",
        description: task?.description || "",
        status: task?.status || "TODO",
        priority: task?.priority || "MEDIUM",
        assigneeId: task?.assigneeId || "",
        deadline: task?.deadline ? task.deadline.split('T')[0] : ""
      });
      setErrors({});
    }
  }, [isOpen, task]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {title}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "Измените детали задачи" : "Создайте новую задачу"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Название задачи *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Введите название задачи..."
              className={cn(
                errors.title && "border-red-500 focus:ring-red-500"
              )}
              disabled={loading}
            />
            {errors.title && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.title}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Добавьте описание задачи..."
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Статус</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">К выполнению</SelectItem>
                  <SelectItem value="IN_PROGRESS">В процессе</SelectItem>
                  <SelectItem value="REVIEW">На проверке</SelectItem>
                  <SelectItem value="DONE">Выполнено</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Приоритет</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleInputChange("priority", value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Низкий</SelectItem>
                  <SelectItem value="MEDIUM">Средний</SelectItem>
                  <SelectItem value="HIGH">Высокий</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignee">Исполнитель</Label>
            <Select
              value={formData.assigneeId}
              onValueChange={(value) => handleInputChange("assigneeId", value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите исполнителя" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Без исполнителя</SelectItem>
                {workspaceMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-4 w-4">
                        <AvatarFallback className="text-xs">
                          {member.name?.[0] || member.email[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span>
                        {member.name || member.email}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Дедлайн</Label>
            <Input
              id="deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => handleInputChange("deadline", e.target.value)}
              className={cn(
                errors.deadline && "border-red-500 focus:ring-red-500"
              )}
              disabled={loading}
              min={new Date().toISOString().split('T')[0]} // Минимальная дата - сегодня
            />
            {errors.deadline && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.deadline}
              </p>
            )}
          </div>

          {errors.submit && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.submit}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="min-w-[100px]"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-gray-300 border-t-transparent animate-spin rounded-full" />
                  {isEdit ? "Сохранение..." : "Создание..."}
                </div>
              ) : (
                <>
                  {isEdit ? "Сохранить" : "Создать"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
