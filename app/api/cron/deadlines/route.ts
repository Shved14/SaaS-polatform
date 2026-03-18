import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NotificationService } from "@/lib/notification-service";

export const dynamic = 'force-dynamic';

// Эндпоинт для проверки дедлайнов задач
// Должен вызываться ежедневно (например, через cron или Vercel Cron Jobs)
export const GET = async (req: Request) => {
  try {
    // Проверяем секретный ключ для безопасности
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
          not: "DONE" // Исключаем выполненные задачи
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
          include: {
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
          include: {
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

    // Создаем уведомления для задач с дедлайном сегодня
    for (const task of tasksDueToday) {
      if (task.assignee) {
        try {
          await NotificationService.events.taskDeadlineToday(
            task.assignee.id,
            task.title,
            task.board.name,
            task.board.workspace.name,
            task.id,
            task.board.id,
            task.board.workspace.id
          );
        } catch (error) {
          console.error(`Failed to create deadline notification for task ${task.id}:`, error);
        }
      }
    }

    // Создаем уведомления для просроченных задач
    for (const task of overdueTasks) {
      if (task.assignee) {
        try {
          await NotificationService.events.taskOverdue(
            task.assignee.id,
            task.title,
            task.board.name,
            task.board.workspace.name,
            task.id,
            task.board.id,
            task.board.workspace.id
          );
        } catch (error) {
          console.error(`Failed to create overdue notification for task ${task.id}:`, error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: {
        dueToday: tasksDueToday.length,
        overdue: overdueTasks.length
      }
    });

  } catch (error) {
    console.error("Deadline check failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
