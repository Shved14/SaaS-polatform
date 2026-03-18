import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createApiHandler, requireAuth } from "@/lib/api";
import { NotificationService } from "@/lib/notification-service";

export const dynamic = 'force-dynamic';

// GET /api/cron/reminders - проверка дедлайнов и создание напоминаний
export const GET = createApiHandler(async (req) => {
  // Проверяем секретный ключ для безопасности
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Начало сегодняшнего дня
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); // Завтрашний день

    // Находим задачи с дедлайном сегодня
    const tasksDueToday = await prisma.task.findMany({
      where: {
        deadline: {
          gte: today,
          lt: tomorrow
        },
        status: {
          not: "DONE"
        },
        assigneeId: {
          not: null // Только задачи с назначенным исполнителем
        }
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        board: {
          select: {
            id: true,
            name: true,
            workspace: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    // Находим просроченные задачи
    const overdueTasks = await prisma.task.findMany({
      where: {
        deadline: {
          lt: today // До сегодняшнего дня
        },
        status: {
          not: "DONE"
        },
        assigneeId: {
          not: null
        }
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        board: {
          select: {
            id: true,
            name: true,
            workspace: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    // Проверяем, есть ли уже уведомления о дедлайнах сегодня
    const existingTodayNotifications = await prisma.notification.findMany({
      where: {
        type: "TASK_DEADLINE_TODAY",
        createdAt: {
          gte: today
        }
      }
    });

    // Проверяем, есть ли уже уведомления о просроченных задачах
    const existingOverdueNotifications = await prisma.notification.findMany({
      where: {
        type: "TASK_OVERDUE",
        createdAt: {
          gte: today
        }
      }
    });

    // Создаем уведомления о дедлайнах сегодня (только для новых задач)
    const todayNotifications = tasksDueToday
      .filter(task => {
        // Проверяем, есть ли уже уведомление для этой задачи сегодня
        const existingNotification = existingTodayNotifications.find(
          n => n.data && typeof n.data === 'object' &&
            'taskId' in n.data && n.data.taskId === task.id
        );

        return !existingNotification;
      })
      .map(task => ({
        userId: task.assigneeId!,
        type: "TASK_DEADLINE_TODAY",
        title: "Срок выполнения сегодня",
        message: `Задача «${task.title}» должна быть выполнена сегодня`,
        data: {
          type: "task_deadline_today",
          taskId: task.id,
          boardId: task.boardId,
          workspaceId: task.board.workspace.id,
          taskTitle: task.title,
          boardName: task.board.name,
          workspaceName: task.board.workspace.name,
          deadline: task.deadline?.toISOString()
        }
      }));

    // Создаем уведомления о просроченных задачах (только для новых)
    const overdueNotifications = overdueTasks
      .filter(task => {
        // Проверяем, есть ли уже уведомление для этой задачи
        const existingNotification = existingOverdueNotifications.find(
          n => n.data && typeof n.data === 'object' &&
            'taskId' in n.data && n.data.taskId === task.id
        );

        return !existingNotification;
      })
      .map(task => ({
        userId: task.assigneeId!,
        type: "TASK_OVERDUE",
        title: "Просроченная задача",
        message: `Задача «${task.title}» просрочена на ${task.deadline?.toLocaleDateString('ru-RU')}`,
        data: {
          type: "task_overdue",
          taskId: task.id,
          boardId: task.boardId,
          workspaceId: task.board.workspace.id,
          taskTitle: task.title,
          boardName: task.board.name,
          workspaceName: task.board.workspace.name,
          deadline: task.deadline?.toISOString(),
          daysOverdue: task.deadline ? Math.ceil((today.getTime() - task.deadline.getTime()) / (1000 * 60 * 60 * 24)) : 0
        }
      }));

    // Отправляем уведомления в базу данных
    const allNotifications = [...todayNotifications, ...overdueNotifications];

    if (allNotifications.length > 0) {
      await prisma.notification.createMany({
        data: allNotifications
      });
    }

    // Отправляем в Slack для всех интеграций
    const workspaceIds = [...new Set(tasksDueToday.map(t => t.board.workspace.id)),
    ...new Set(overdueTasks.map(t => t.board.workspace.id))];

    for (const workspaceId of workspaceIds) {
      try {
        await NotificationService.sendSlackWebhook(
          workspaceId,
          `📅 *Напоминания о дедлайнах*\n\n${todayNotifications.length} задач должны быть выполнены сегодня\n${overdueNotifications.length} задач просрочены`,
          undefined // Без ссылки на задачу для общих напоминаний
        );
      } catch (error) {
        console.error(`Failed to send deadline reminders to Slack for workspace ${workspaceId}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      processed: {
        dueToday: todayNotifications.length,
        overdue: overdueNotifications.length,
        total: allNotifications.length
      }
    });

  } catch (error) {
    console.error("Deadline reminder check failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
