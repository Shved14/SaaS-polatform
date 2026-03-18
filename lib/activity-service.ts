import { prisma } from "@/lib/prisma";

export type ActivityAction =
  | "created_task"
  | "updated_task"
  | "deleted_task"
  | "comment_added"
  | "status_changed"
  | "assigned_task"
  | "unassigned_task"
  | "created_board"
  | "updated_board"
  | "deleted_board"
  | "invited_user"
  | "joined_workspace"
  | "left_workspace";

export type EntityType =
  | "task"
  | "board"
  | "workspace"
  | "comment"
  | "user";

interface ActivityData {
  oldValues?: Record<string, any>;
  newValue?: any;
  comment?: string;
  metadata?: Record<string, any>;
}

export const ActivityService = {
  async logActivity(
    userId: string,
    action: ActivityAction,
    entityId: string,
    entityType: EntityType,
    data?: ActivityData
  ) {
    try {
      console.log("Logging activity:", { userId, action, entityId, entityType, data });

      await prisma.activity.create({
        data: {
          userId,
          action,
          entityId,
          entityType,
          details: (data || {}) as any,
          metadata: {
            timestamp: new Date().toISOString(),
            // Не используем window и fetch на сервере
            userAgent: "server",
            ip: null
          }
        }
      });

      console.log("Activity logged successfully");
    } catch (error) {
      console.error("Failed to log activity:", error);
    }
  },

  async getActivities(
    userId: string,
    options?: {
      limit?: number;
      entityType?: EntityType;
      entityId?: string;
      action?: ActivityAction;
    }
  ) {
    try {
      const where: any = {
        userId
      };

      if (options?.entityType) {
        where.entityType = options.entityType;
      }

      if (options?.entityId) {
        where.entityId = options.entityId;
      }

      if (options?.action) {
        where.action = options.action;
      }

      const activities = await prisma.activity.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        take: options?.limit || 50,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          }
        }
      });

      return activities;
    } catch (error) {
      console.error("Failed to get activities:", error);
      return [];
    }
  },

  // Удобные методы для логирования типовых действий
  task: {
    created: (userId: string, taskId: string, taskTitle: string) =>
      ActivityService.logActivity(userId, "created_task", taskId, "task", {
        newValue: { title: taskTitle }
      }),

    updated: (userId: string, taskId: string, oldTask: any, newTask: any) =>
      ActivityService.logActivity(userId, "updated_task", taskId, "task", {
        oldValues: {
          title: oldTask.title,
          status: oldTask.status,
          priority: oldTask.priority,
          assigneeId: oldTask.assigneeId,
          deadline: oldTask.deadline
        },
        newValue: {
          title: newTask.title,
          status: newTask.status,
          priority: newTask.priority,
          assigneeId: newTask.assigneeId,
          deadline: newTask.deadline
        }
      }),

    deleted: (userId: string, taskId: string, taskTitle: string) =>
      ActivityService.logActivity(userId, "deleted_task", taskId, "task", {
        newValue: { title: taskTitle }
      }),

    assigned: (userId: string, taskId: string, taskTitle: string, assigneeName: string) =>
      ActivityService.logActivity(userId, "assigned_task", taskId, "task", {
        newValue: { title: taskTitle, assigneeName }
      }),

    unassigned: (userId: string, taskId: string, taskTitle: string) =>
      ActivityService.logActivity(userId, "unassigned_task", taskId, "task", {
        newValue: { title: taskTitle }
      }),

    statusChanged: (userId: string, taskId: string, oldStatus: string, newStatus: string, taskTitle?: string) =>
      ActivityService.logActivity(userId, "status_changed", taskId, "task", {
        oldValues: { status: oldStatus },
        newValue: { status: newStatus, title: taskTitle }
      })
  },

  comment: {
    added: (userId: string, taskId: string, taskTitle: string, commentText: string) =>
      ActivityService.logActivity(userId, "comment_added", taskId, "task", {
        newValue: { title: taskTitle },
        comment: commentText
      })
  },

  board: {
    created: (userId: string, boardId: string, boardName: string) =>
      ActivityService.logActivity(userId, "created_board", boardId, "board", {
        newValue: { name: boardName }
      }),

    updated: (userId: string, boardId: string, oldBoard: any, newBoard: any) =>
      ActivityService.logActivity(userId, "updated_board", boardId, "board", {
        oldValues: {
          name: oldBoard.name,
          description: oldBoard.description
        },
        newValue: {
          name: newBoard.name,
          description: newBoard.description
        }
      }),

    deleted: (userId: string, boardId: string, boardName: string) =>
      ActivityService.logActivity(userId, "deleted_board", boardId, "board", {
        newValue: { name: boardName }
      })
  },

  workspace: {
    userInvited: (userId: string, workspaceId: string, workspaceName: string, invitedUserName: string) =>
      ActivityService.logActivity(userId, "invited_user", workspaceId, "workspace", {
        newValue: { name: workspaceName },
        metadata: { invitedUser: invitedUserName }
      }),

    userJoined: (userId: string, workspaceId: string, workspaceName: string) =>
      ActivityService.logActivity(userId, "joined_workspace", workspaceId, "workspace", {
        newValue: { name: workspaceName }
      }),

    userLeft: (userId: string, workspaceId: string, workspaceName: string) =>
      ActivityService.logActivity(userId, "left_workspace", workspaceId, "workspace", {
        newValue: { name: workspaceName }
      })
  }
};
