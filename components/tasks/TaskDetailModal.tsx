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
import { CalendarIcon, Upload, Download, X, Plus, CheckSquare, Paperclip, Send, Edit2, MessageSquare, User } from "lucide-react";
import { Toast, ToastContainer } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ConfirmDeleteModal } from "@/components/modals/ConfirmDeleteModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: any;
  workspaceMembers: Array<{ id: string; name: string | null; email: string }>;
  onUpdate?: (updatedTask: any) => void;
  onDelete?: (taskId: string) => void;
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
  REVIEW: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
  DONE: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
};

const statusLabels = {
  TODO: 'К выполнению',
  IN_PROGRESS: 'В работе',
  REVIEW: 'На проверке',
  DONE: 'Готово'
};

export function TaskDetailModal({ isOpen, onClose, task, workspaceMembers, onUpdate, onDelete }: TaskDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [editedTask, setEditedTask] = useState({
    title: task?.title || "",
    description: task?.description || "",
    priority: task?.priority || "MEDIUM",
    assigneeId: task?.assigneeId || "",
    deadline: task?.deadline ? new Date(task.deadline).toISOString().split('T')[0] : "",
    status: task?.status || "TODO"
  });
  const [toasts, setToasts] = useState<{ id: string; message: string; type: "success" | "error" | "info" }[]>([]);
  const [deleteFileConfirm, setDeleteFileConfirm] = useState<{
    isOpen: boolean;
    fileId: string;
    fileName: string;
  }>({
    isOpen: false,
    fileId: "",
    fileName: "",
  });
  const [deleteSubtaskConfirm, setDeleteSubtaskConfirm] = useState<{
    isOpen: boolean;
    subtaskId: string;
    subtaskTitle: string;
  }>({
    isOpen: false,
    subtaskId: "",
    subtaskTitle: "",
  });
const priorityKey = task?.priority as keyof typeof priorityColors | undefined;
  const addToast = (message: string, type: "success" | "error" | "info") => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Загружаем комментарии, вложения и подзадачи при изменении задачи
  useEffect(() => {
    if (task?.id && isOpen) {
      // Загружаем комментарии
      fetch(`/api/tasks/${task.id}/comments`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setComments(data);
          }
        })
        .catch(console.error);

      // Загружаем вложения
      fetch(`/api/attachments?taskId=${task.id}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setAttachments(data);
          }
        })
        .catch(console.error);

      // Загружаем подзадачи
      fetch(`/api/tasks/${task.id}/subtasks`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setSubtasks(data);
          }
        })
        .catch(console.error);
    }
  }, [task?.id, isOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('taskId', task!.id);

    try {
      const response = await fetch('/api/attachments', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setAttachments(prev => [result, ...prev]);
        addToast("Файл загружен", "success");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      addToast("Ошибка при загрузке файла", "error");
    }
  };

  const handleDownloadFile = (attachment: any) => {
    const link = document.createElement('a');
    link.href = attachment.path;
    link.download = attachment.filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;

    try {
      const response = await fetch(`/api/tasks/${task?.id}/subtasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newSubtaskTitle.trim()
        })
      });

      if (response.ok) {
        const newSubtask = await response.json();
        setSubtasks(prev => [...prev, newSubtask]);
        setNewSubtaskTitle("");
        addToast("Подзадача добавлена", "success");
      } else {
        const errorData = await response.json();
        addToast(`Ошибка: ${errorData.error || "Не удалось добавить подзадачу"}`, "error");
      }
    } catch (error) {
      console.error("Error adding subtask:", error);
      addToast("Произошла ошибка при добавлении подзадачи", "error");
    }
  };

  const handleToggleSubtask = async (subtaskId: string) => {
    const subtask = subtasks.find(s => s.id === subtaskId);
    if (!subtask) return;

    try {
      const response = await fetch(`/api/tasks/${task?.id}/subtasks/${subtaskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completed: !subtask.completed
        })
      });

      if (response.ok) {
        const updatedSubtask = await response.json();
        setSubtasks(prev => prev.map(s =>
          s.id === subtaskId ? updatedSubtask : s
        ));
      } else {
        const errorData = await response.json();
        addToast(`Ошибка: ${errorData.error || "Не удалось обновить подзадачу"}`, "error");
      }
    } catch (error) {
      console.error("Error toggling subtask:", error);
      addToast("Произошла ошибка при обновлении подзадачи", "error");
    }
  };

  const handleDeleteSubtask = (subtaskId: string, subtaskTitle: string) => {
    setDeleteSubtaskConfirm({
      isOpen: true,
      subtaskId,
      subtaskTitle,
    });
  };

  const confirmDeleteSubtask = async () => {
    if (!deleteSubtaskConfirm.subtaskId) return;

    try {
      const response = await fetch(`/api/tasks/${task?.id}/subtasks/${deleteSubtaskConfirm.subtaskId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSubtasks(prev => prev.filter(subtask => subtask.id !== deleteSubtaskConfirm.subtaskId));
        addToast("Подзадача удалена", "success");
        setDeleteSubtaskConfirm({ isOpen: false, subtaskId: "", subtaskTitle: "" });
      } else {
        const errorData = await response.json();
        addToast(`Ошибка: ${errorData.error || "Не удалось удалить подзадачу"}`, "error");
      }
    } catch (error) {
      console.error("Error deleting subtask:", error);
      addToast("Произошла ошибка при удалении подзадачи", "error");
    }
  };

  const cancelDeleteSubtask = () => {
    setDeleteSubtaskConfirm({ isOpen: false, subtaskId: "", subtaskTitle: "" });
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      const response = await fetch(`/api/tasks/${task?.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: comment.trim()
        })
      });

      if (response.ok) {
        const newComment = await response.json();
        setComments(prev => [...prev, newComment]);
        setComment("");
        setIsAddingComment(false);
        addToast("Комментарий добавлен", "success");
      } else {
        const errorData = await response.json();
        console.error("Error adding comment:", errorData);
        addToast(`Ошибка: ${errorData.error || "Не удалось добавить комментарий"}`, "error");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      addToast("Произошла ошибка при добавлении комментария", "error");
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/tasks/${task?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedTask)
      });

      if (response.ok) {
        const updatedTask = await response.json();
        onUpdate?.(updatedTask);
        setIsEditing(false);
        addToast("Задача обновлена", "success");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      addToast("Произошла ошибка при сохранении задачи", "error");
    }
  };

  const handleDeleteFile = (attachmentId: string, fileName: string) => {
    setDeleteFileConfirm({
      isOpen: true,
      fileId: attachmentId,
      fileName: fileName,
    });
  };

  const confirmDeleteFile = async () => {
    if (!deleteFileConfirm.fileId) return;

    try {
      const response = await fetch(`/api/attachments/${deleteFileConfirm.fileId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setAttachments(prev => prev.filter(a => a.id !== deleteFileConfirm.fileId));
        addToast("Файл удален", "success");
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      addToast("Ошибка при удалении файла", "error");
    }

    setDeleteFileConfirm({ isOpen: false, fileId: "", fileName: "" });
  };

  const cancelDeleteFile = () => {
    setDeleteFileConfirm({ isOpen: false, fileId: "", fileName: "" });
  };
const statusKey = task?.status as keyof typeof statusColors | undefined;
  const assignee = workspaceMembers.find(m => m.id === task?.assigneeId);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
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
                  task?.title || "Без названия"
                )}
              </DialogTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>

            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Основная информация */}
            <div className="lg:col-span-2 space-y-6">
              {/* Информация о задаче */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Информация о задаче</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
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
                          <Badge className={statusKey ? statusColors[statusKey] : 'bg-gray-100 text-gray-800'}>
  {statusKey ? statusLabels[statusKey] : 'Неизвестно'}
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
                          <Badge className={priorityKey ? priorityColors[priorityKey] : 'bg-yellow-100 text-yellow-800'}>
  {priorityKey ? priorityLabels[priorityKey] : 'Средний'}
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
                              <SelectItem value="none">Без исполнителя</SelectItem>
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
                            min={new Date().toISOString().split('T')[0]}
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {task?.deadline
                                ? new Date(task.deadline).toLocaleDateString('ru-RU')
                                : "Не указан"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Описание */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Описание</CardTitle>
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

              {/* Подзадачи */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckSquare className="h-5 w-5" />
                    Подзадачи
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Добавление новой подзадачи */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Новая подзадача..."
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                      className="flex-1"
                    />
                    <Button onClick={handleAddSubtask} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Список подзадач */}
                  <div className="space-y-2">
                    {subtasks.map((subtask) => (
                      <div key={subtask.id} className="flex items-center gap-2 p-2 rounded-lg border dark:border-gray-700">
                        <button
                          onClick={() => handleToggleSubtask(subtask.id)}
                          className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${subtask.completed
                            ? 'bg-blue-500 border-blue-500 text-white'
                            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-400'
                            }`}
                        >
                          {subtask.completed && (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                        <span className={`flex-1 text-sm ${subtask.completed
                          ? 'line-through text-muted-foreground'
                          : 'text-gray-900 dark:text-gray-100'
                          }`}>
                          {subtask.title}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSubtask(subtask.id, subtask.title)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {subtasks.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        Нет подзадач
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Вложения */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Paperclip className="h-5 w-5" />
                    Вложения
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Upload button */}
                  <div>
                    <input
                      type="file"
                      id="file-upload"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('file-upload')?.click()}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Загрузить файл
                    </Button>
                  </div>

                  {/* Attachments list */}
                  <div className="space-y-2">
                    {attachments.map((attachment: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                            <Paperclip className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{attachment.filename}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {(attachment.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadFile(attachment)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteFile(attachment.id, attachment.filename)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {attachments.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground text-sm dark:text-gray-400">
                        Нет вложенных файлов
                      </div>
                    )}
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
            {/* Комментарии */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Комментарии
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Добавление комментария */}
                {isAddingComment ? (
                  <form onSubmit={handleAddComment} className="space-y-3">
                    <Textarea
                      placeholder="Напишите комментарий..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        size="sm"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Отправить
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddingComment(false)}
                        size="sm"
                      >
                        Отмена
                      </Button>
                    </div>
                  </form>
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
                  {comments.map((comment: any, index: number) => (
                    <div key={index} className="flex gap-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.author?.avatar} />
                        <AvatarFallback className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          {comment.author?.name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                            {comment.author?.name || "Anonymous"}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(comment.createdAt).toLocaleString('ru-RU')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 dark:text-gray-200">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Toast notifications */}
      <ToastContainer>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </ToastContainer>

      {/* Delete file confirmation modal */}
      <ConfirmDeleteModal
        isOpen={deleteFileConfirm.isOpen}
        onConfirm={confirmDeleteFile}
        onCancel={cancelDeleteFile}
        title="Удалить файл"
        description={`Вы уверены, что хотите удалить файл "${deleteFileConfirm.fileName}"? Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
      />

      {/* Delete subtask confirmation modal */}
      <ConfirmDeleteModal
        isOpen={deleteSubtaskConfirm.isOpen}
        onConfirm={confirmDeleteSubtask}
        onCancel={cancelDeleteSubtask}
        title="Удалить подзадачу"
        description={`Вы уверены, что хотите удалить подзадачу "${deleteSubtaskConfirm.subtaskTitle}"? Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
      />
    </>
  );
}
