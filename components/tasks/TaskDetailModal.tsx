"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, User, MessageSquare, CheckSquare, History, Edit2, Trash2 } from "lucide-react";

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: any;
  workspaceMembers: Array<{ id: string; name: string | null; email: string }>;
  onUpdate?: (updatedTask: any) => void;
  onDelete?: (taskId: string) => void;
}

const priorityColors: Record<string, string> = {
  LOW: 'bg-blue-100 text-blue-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-red-100 text-red-800'
};

const priorityLabels: Record<string, string> = {
  LOW: 'Низкий',
  MEDIUM: 'Средний',
  HIGH: 'Высокий'
};

const statusColors: Record<string, string> = {
  TODO: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  REVIEW: 'bg-orange-100 text-orange-800',
  DONE: 'bg-green-100 text-green-800'
};

const statusLabels: Record<string, string> = {
  TODO: 'К выполнению',
  IN_PROGRESS: 'В работе',
  REVIEW: 'На проверке',
  DONE: 'Готово'
};

export function TaskDetailModal({ isOpen, onClose, task, workspaceMembers, onUpdate, onDelete }: TaskDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [comment, setComment] = useState("");
  const [editedTask, setEditedTask] = useState({
    title: task?.title || "",
    description: task?.description || "",
    priority: task?.priority || "MEDIUM",
    assigneeId: task?.assigneeId || "",
    deadline: task?.deadline ? new Date(task.deadline).toISOString().split('T')[0] : "",
    status: task?.status || "TODO"
  });

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editedTask),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        onUpdate?.(updatedTask);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;

    try {
      const response = await fetch(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: comment }),
      });

      if (response.ok) {
        setComment("");
        setIsAddingComment(false);
        onUpdate?.({ ...task, comments: [...(task.comments || []), { content: comment, createdAt: new Date() }] });
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleDelete = async () => {
    if (confirm("Вы уверены, что хотите удалить эту задачу?")) {
      try {
        const response = await fetch(`/api/tasks/${task.id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          onDelete?.(task.id);
          onClose();
        }
      } catch (error) {
        console.error("Error deleting task:", error);
      }
    }
  };

  const assignee = workspaceMembers.find(m => m.id === task?.assigneeId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">
              {isEditing ? (
                <Input
                  value={editedTask.title}
                  onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                  className="text-xl font-semibold"
                />
              ) : (
                task?.title
              )}
            </DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Основная информация */}
          <div className="lg:col-span-2 space-y-6">
            {/* Описание */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Описание
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={editedTask.description}
                    onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                    placeholder="Добавьте описание задачи..."
                    rows={4}
                  />
                ) : (
                  <div className="whitespace-pre-wrap text-sm">
                    {task?.description || "Нет описания"}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Комментарии */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Комментарии
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isAddingComment ? (
                  <div className="space-y-2">
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Напишите комментарий..."
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleAddComment} size="sm">
                        Добавить
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsAddingComment(false);
                          setComment("");
                        }}
                        size="sm"
                      >
                        Отмена
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingComment(true)}
                    className="w-full"
                  >
                    Добавить комментарий
                  </Button>
                )}

                <div className="space-y-3">
                  {task?.comments?.map((comment: any, index: number) => (
                    <div key={index} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.author?.avatar} />
                        <AvatarFallback>
                          {comment.author?.name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {comment.author?.name || "Anonymous"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleString('ru-RU')}
                          </span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Боковая панель */}
          <div className="space-y-6">
            {/* Метаданные */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Детали</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Статус */}
                <div>
                  <Label className="text-sm font-medium">Статус</Label>
                  <div className="mt-1">
                    {isEditing ? (
                      <Select
                        value={editedTask.status}
                        onValueChange={(value) => setEditedTask({ ...editedTask, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TODO">К выполнению</SelectItem>
                          <SelectItem value="IN_PROGRESS">В работе</SelectItem>
                          <SelectItem value="REVIEW">На проверке</SelectItem>
                          <SelectItem value="DONE">Готово</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={statusColors[task?.status] || 'bg-gray-100 text-gray-800'}>
                        {statusLabels[task?.status] || 'Неизвестно'}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Приоритет */}
                <div>
                  <Label className="text-sm font-medium">Приоритет</Label>
                  <div className="mt-1">
                    {isEditing ? (
                      <Select
                        value={editedTask.priority}
                        onValueChange={(value) => setEditedTask({ ...editedTask, priority: value })}
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
                    ) : (
                      <Badge className={priorityColors[task?.priority] || 'bg-yellow-100 text-yellow-800'}>
                        {priorityLabels[task?.priority] || 'Средний'}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Исполнитель */}
                <div>
                  <Label className="text-sm font-medium">Исполнитель</Label>
                  <div className="mt-1">
                    {isEditing ? (
                      <Select
                        value={editedTask.assigneeId}
                        onValueChange={(value) => setEditedTask({ ...editedTask, assigneeId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите исполнителя" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Без исполнителя</SelectItem>
                          {workspaceMembers.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name || member.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {assignee?.name || assignee?.email || "Не назначен"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Срок */}
                <div>
                  <Label className="text-sm font-medium">Срок выполнения</Label>
                  <div className="mt-1">
                    {isEditing ? (
                      <Input
                        type="date"
                        value={editedTask.deadline}
                        onChange={(e) => setEditedTask({ ...editedTask, deadline: e.target.value })}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {task?.deadline
                            ? new Date(task.deadline).toLocaleDateString('ru-RU')
                            : "Не указан"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Кнопки действий */}
            {isEditing && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-2">
                    <Button onClick={handleSave} className="flex-1">
                      Сохранить
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      className="flex-1"
                    >
                      Отмена
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
