import { prisma } from "./prisma";

export async function createTaskNotification(
  type: 'TASK_CREATED' | 'TASK_DELETED',
  taskData: {
    taskId: string;
    taskTitle: string;
    boardId: string;
    boardName: string;
    workspaceId: string;
    workspaceName: string;
    creatorId: string;
    creatorName: string;
  },
  excludeUserId?: string
) {
  try {
    // Get all workspace members except the creator
    const members = await prisma.workspaceMember.findMany({
      where: {
        workspaceId: taskData.workspaceId,
        userId: { not: excludeUserId || taskData.creatorId }
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Create notifications for all members
    const notifications = members.map(member => ({
      userId: member.userId,
      type: type,
      data: {
        taskId: taskData.taskId,
        taskTitle: taskData.taskTitle,
        boardId: taskData.boardId,
        boardName: taskData.boardName,
        workspaceId: taskData.workspaceId,
        workspaceName: taskData.workspaceName,
        creatorId: taskData.creatorId,
        creatorName: taskData.creatorName,
        message: type === 'TASK_CREATED' 
          ? `New task "${taskData.taskTitle}" created in "${taskData.boardName}"`
          : `Task "${taskData.taskTitle}" deleted from "${taskData.boardName}"`
      },
      isRead: false,
    }));

    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications
      });
    }

    return { success: true, notifiedCount: notifications.length };
  } catch (error) {
  console.error('Error creating task notification:', error);

  const message = error instanceof Error ? error.message : String(error);

  return { success: false, error: message };
}
}
