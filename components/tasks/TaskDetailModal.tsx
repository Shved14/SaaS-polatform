"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  User,
  Flag,
  MessageSquare,
  CheckSquare,
  History,
  Edit2,
  Save,
  X,
  Plus,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskStatus, TaskPriority } from "@prisma/client";

// Define TaskActivityType locally to avoid import issues
type TaskActivityType =
  | "CREATED"
  | "UPDATED"
  | "STATUS_CHANGED"
  | "ASSIGNEE_CHANGED"
  | "PRIORITY_CHANGED"
  | "DEADLINE_CHANGED"
  | "COMMENT_ADDED"
  | "SUBTASK_ADDED"
  | "SUBTASK_COMPLETED"
  | "SUBTASK_UNCOMPLETED";

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  workspaceId: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string | null;
  assigneeId: string | null;
  assignee: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  comments: TaskComment[];
  subtasks: Subtask[];
  activities: TaskActivity[];
}

interface TaskComment {
  id: string;
  content: string;
  authorId: string;
  author: {
    id: string;
    name: string | null;
    email: string | null;
  };
  createdAt: string;
}

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

interface TaskActivity {
  id: string;
  action: TaskActivityType;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

const statusOptions = [
  { value: "TODO", label: "To Do", color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300" },
  { value: "IN_PROGRESS", label: "In Progress", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300" },
  { value: "REVIEW", label: "Review", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300" },
  { value: "DONE", label: "Done", color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" },
];

const priorityOptions = [
  { value: "LOW", label: "Low", color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" },
  { value: "MEDIUM", label: "Medium", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300" },
  { value: "HIGH", label: "High", color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300" },
];

export function TaskDetailModal({ isOpen, onClose, taskId, workspaceId }: TaskDetailModalProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    status: "TODO" as TaskStatus,
    priority: "MEDIUM" as TaskPriority,
    deadline: "",
    assigneeId: "",
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [newSubtask, setNewSubtask] = useState("");

  useEffect(() => {
    if (isOpen && taskId) {
      loadTask();
    }
  }, [isOpen, taskId]);

  const loadTask = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tasks/${taskId}`);
      if (!response.ok) throw new Error("Failed to load task");
      const taskData = await response.json();
      setTask(taskData);
      setEditForm({
        title: taskData.title,
        description: taskData.description || "",
        status: taskData.status,
        priority: taskData.priority,
        deadline: taskData.deadline ? new Date(taskData.deadline).toISOString().split('T')[0] : "",
        assigneeId: taskData.assigneeId || "",
      });
    } catch (error) {
      console.error("Error loading task:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Frontend validation
    if (editForm.deadline) {
      const deadlineDate = new Date(editForm.deadline);
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Set to start of day for fair comparison
      if (deadlineDate < now) {
        setEditError("Deadline cannot be in the past");
        return;
      }
    }

    setEditError(null);

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update task");
      }

      await loadTask();
      setEditing(false);
    } catch (error) {
      console.error("Error updating task:", error);
      setEditError(error instanceof Error ? error.message : "Failed to update task");
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });
      if (!response.ok) throw new Error("Failed to add comment");
      setNewComment("");
      await loadTask();
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return;
    try {
      const response = await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newSubtask }),
      });
      if (!response.ok) throw new Error("Failed to add subtask");
      setNewSubtask("");
      await loadTask();
    } catch (error) {
      console.error("Error adding subtask:", error);
    }
  };

  const toggleSubtask = async (subtaskId: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/subtasks/${subtaskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
      if (!response.ok) throw new Error("Failed to update subtask");
      await loadTask();
    } catch (error) {
      console.error("Error updating subtask:", error);
    }
  };

  const deleteSubtask = async (subtaskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/subtasks/${subtaskId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete subtask");
      await loadTask();
    } catch (error) {
      console.error("Error deleting subtask:", error);
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    return statusOptions.find(s => s.value === status)?.color || "";
  };

  const getPriorityColor = (priority: TaskPriority) => {
    return priorityOptions.find(p => p.value === priority)?.color || "";
  };

  const getActivityDescription = (activity: TaskActivity) => {
    switch (activity.action) {
      case "CREATED":
        return "created this task";
      case "UPDATED":
        return "updated this task";
      case "STATUS_CHANGED":
        return `changed status from ${activity.oldValue} to ${activity.newValue}`;
      case "ASSIGNEE_CHANGED":
        return `changed assignee`;
      case "PRIORITY_CHANGED":
        return `changed priority from ${activity.oldValue} to ${activity.newValue}`;
      case "DEADLINE_CHANGED":
        return `changed deadline`;
      case "COMMENT_ADDED":
        return "added a comment";
      case "SUBTASK_ADDED":
        return "added a subtask";
      case "SUBTASK_COMPLETED":
        return "completed a subtask";
      case "SUBTASK_UNCOMPLETED":
        return "uncompleted a subtask";
      default:
        return "performed an action";
    }
  };

  const completedSubtasks = task?.subtasks.filter(st => st.completed).length || 0;
  const totalSubtasks = task?.subtasks.length || 0;
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              {editing ? (
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="text-xl font-semibold border-0 p-0 focus-visible:ring-0"
                />
              ) : (
                task.title
              )}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {editing ? (
                <>
                  <Button size="sm" onClick={handleSave} className="gap-2">
                    <Save className="h-4 w-4" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setEditing(false); setEditError(null); }}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={() => { setEditing(true); setEditError(null); }} className="gap-2">
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={onClose}>
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
          {editError && (
            <div className="mt-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{editError}</p>
            </div>
          )}
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                {editing ? (
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Add a description..."
                    className="min-h-[100px]"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {task.description || "No description provided. Click Edit to add one."}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Subtasks */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckSquare className="h-4 w-4" />
                    Subtasks
                    <Badge variant="secondary" className="text-xs">
                      {completedSubtasks}/{totalSubtasks}
                    </Badge>
                  </CardTitle>
                  <div className="text-xs text-muted-foreground">
                    {Math.round(subtaskProgress)}% complete
                  </div>
                </div>
                {totalSubtasks > 0 && (
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-200"
                      style={{ width: `${subtaskProgress}%` }}
                    />
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {task.subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50">
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={(e) => toggleSubtask(subtask.id, e.target.checked)}
                      className="rounded border-primary"
                    />
                    <span className={cn(
                      "flex-1 text-sm",
                      subtask.completed && "line-through text-muted-foreground"
                    )}>
                      {subtask.title}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteSubtask(subtask.id)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    placeholder="Add a subtask..."
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                  />
                  <Button size="sm" onClick={handleAddSubtask} disabled={!newSubtask.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Comments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Comments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {task.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="text-xs">
                        {comment.author.name?.split(' ').map(n => n[0]).join('').toUpperCase() ||
                          comment.author.email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {comment.author.name || comment.author.email}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleDateString()} at {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{comment.content}</p>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 min-h-[80px]"
                  />
                  <Button onClick={handleAddComment} disabled={!newComment.trim()} className="self-end">
                    Post
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Task Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status */}
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Status</Label>
                  {editing ? (
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as TaskStatus })}
                      className="mt-1 w-full rounded-md border border-input bg-background p-2 text-sm"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Badge className={cn("mt-1", getStatusColor(task.status))}>
                      {statusOptions.find(s => s.value === task.status)?.label}
                    </Badge>
                  )}
                </div>

                {/* Priority */}
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Priority</Label>
                  {editing ? (
                    <select
                      value={editForm.priority}
                      onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as TaskPriority })}
                      className="mt-1 w-full rounded-md border border-input bg-background p-2 text-sm"
                    >
                      {priorityOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Badge className={cn("mt-1", getPriorityColor(task.priority))}>
                      <Flag className="h-3 w-3 mr-1" />
                      {priorityOptions.find(p => p.value === task.priority)?.label}
                    </Badge>
                  )}
                </div>

                {/* Assignee */}
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Assignee</Label>
                  {task.assignee ? (
                    <div className="mt-1 flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {task.assignee.name?.split(' ').map(n => n[0]).join('').toUpperCase() ||
                            task.assignee.email?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{task.assignee.name || task.assignee.email}</span>
                    </div>
                  ) : (
                    <span className="mt-1 text-sm text-muted-foreground">Unassigned</span>
                  )}
                </div>

                {/* Deadline */}
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Deadline</Label>
                  {editing ? (
                    <Input
                      type="date"
                      value={editForm.deadline}
                      onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <div className="mt-1 flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      {task.deadline ? new Date(task.deadline).toLocaleDateString() : "No deadline"}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Dates */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Created</span>
                    <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Updated</span>
                    <span>{new Date(task.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {task.activities.slice(0, 10).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-2 text-sm">
                    <Avatar className="h-6 w-6 flex-shrink-0">
                      <AvatarFallback className="text-xs">
                        {activity.user.name?.[0]?.toUpperCase() ||
                          activity.user.email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <span className="text-muted-foreground">
                        <span className="font-medium">{activity.user.name || activity.user.email}</span>{" "}
                        {getActivityDescription(activity)}
                      </span>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(activity.createdAt).toLocaleDateString()} at {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
