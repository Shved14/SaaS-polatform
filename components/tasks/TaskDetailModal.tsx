"use client";

import { useState, useEffect } from "react";
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
import { Calendar, Clock, User, MessageSquare, CheckSquare, History, Edit2, Trash2, Paperclip, Upload, Download, X } from "lucide-react";
import { Toast, ToastContainer } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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
  const [attachments, setAttachments] = useState<any[]>([]);
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
    fileId: string | null;
    fileName: string;
  }>({
    isOpen: false,
    fileId: null,
    fileName: "",
  });

  const addToast = (message: string, type: "success" | "error" | "info") => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Load attachments when task changes
  useEffect(() => {
    if (task?.id) {
      loadAttachments();
    }
  }, [task]);

  const loadAttachments = async () => {
    try {
      const response = await fetch(`/api/attachments?taskId=${task.id}`);
      if (response.ok) {
        const data = await response.json();
        setAttachments(data);
      }
    } catch (error) {
      console.error("Error loading attachments:", error);
    }
  };

  // Update local state when task prop changes
  useEffect(() => {
    if (task) {
      setEditedTask({
        title: task.title || "",
        description: task.description || "",
        priority: task.priority || "MEDIUM",
        assigneeId: task.assigneeId || "",
        deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : "",
        status: task.status || "TODO"
      });
    }
  }, [task]);

  const handleSave = async () => {
    console.log("Saving task with data:", editedTask);

    // Prepare data for API - convert date to datetime format if present
    const saveData = { ...editedTask };
    if (saveData.deadline) {
      saveData.deadline = new Date(saveData.deadline).toISOString();
    }

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(saveData),
      });

      console.log("Save response status:", response.status);

      if (response.ok) {
        const updatedTask = await response.json();
        console.log("Updated task:", updatedTask);
        onUpdate?.(updatedTask);
        setIsEditing(false);
        addToast("Задача успешно сохранена!", "success");
      } else {
        const errorData = await response.json();
        console.error("Save error:", errorData);
        addToast(`Ошибка: ${errorData.error || "Не удалось сохранить задачу"}`, "error");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      addToast("Произошла ошибка при сохранении задачи", "error");
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
        // Reload task data to get updated comments
        const taskResponse = await fetch(`/api/tasks/${task.id}`);
        if (taskResponse.ok) {
          const updatedTask = await taskResponse.json();
          onUpdate?.(updatedTask);
        }
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("Uploading file:", file.name, file.size, file.type);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('taskId', task.id);

      const response = await fetch('/api/attachments', {
        method: 'POST',
        body: formData
      });

      console.log("Upload response status:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("Upload result:", result);

        // Add to attachments list for immediate display
        const newAttachment = {
          id: result.id,
          filename: result.originalName,
          originalName: result.filename,
          size: result.size,
          contentType: file.type,
          path: result.url
        };

        setAttachments(prev => [newAttachment, ...prev]);
        addToast("Файл успешно загружен!", "success");
      } else {
        const errorData = await response.json();
        console.error("Upload error:", errorData);
        addToast(`Ошибка загрузки: ${errorData.error || "Не удалось загрузить файл"}`, "error");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      addToast("Произошла ошибка при загрузке файла", "error");
    }

    // Reset input
    e.target.value = '';
  };

  const handleDownloadFile = (attachment: any) => {
    // Create download link
    const link = document.createElement('a');
    link.href = attachment.path;
    link.download = attachment.filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        addToast("Файл успешно удален!", "success");
        setDeleteFileConfirm({ isOpen: false, fileId: null, fileName: "" });
      } else {
        console.error('Failed to delete file');
        addToast("Не удалось удалить файл", "error");
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      addToast("Произошла ошибка при удалении файла", "error");
    }
  };

  const cancelDeleteFile = () => {
    setDeleteFileConfirm({ isOpen: false, fileId: null, fileName: "" });
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
    <>
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
                          min={new Date().toISOString().split('T')[0]} // Prevent past dates
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

      {/* Delete file confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteFileConfirm.isOpen}
        onClose={cancelDeleteFile}
        onConfirm={confirmDeleteFile}
        title="Удалить файл"
        description={`Вы уверены, что хотите удалить файл "${deleteFileConfirm.fileName}"? Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
        variant="destructive"
      />
    </>
  );
}
