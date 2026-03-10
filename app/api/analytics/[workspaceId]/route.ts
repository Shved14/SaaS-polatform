import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: { workspaceId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId } = params;

  // Проверяем, что пользователь имеет доступ к workspace
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      owner: true,
      members: {
        select: { userId: true }
      }
    }
  });

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const userId = session.user.id;
  const isOwner = workspace.ownerId === userId;
  const isMember =
    isOwner || workspace.members.some((m) => m.userId === userId);

  if (!isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();

  const tasks = await prisma.task.findMany({
    where: {
      board: {
        workspaceId
      }
    },
    select: {
      id: true,
      title: true,
      status: true,
      deadline: true,
      assigneeId: true,
      updatedAt: true
    }
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "DONE").length;

  // Активность считаем по количеству изменений задач по дням (updatedAt)
  const activityMap = new Map<string, number>();
  for (const task of tasks) {
    const d = new Date(task.updatedAt);
    const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
    activityMap.set(key, (activityMap.get(key) ?? 0) + 1);
  }
  const activity = Array.from(activityMap.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, actionsCount]) => ({ date, actionsCount }));

  // Просроченные задачи сгруппированы по статусу
  const overdueMap = new Map<string, number>();
  for (const task of tasks) {
    if (task.deadline && task.deadline < now && task.status !== "DONE") {
      overdueMap.set(task.status, (overdueMap.get(task.status) ?? 0) + 1);
    }
  }
  const overdueTasks = Array.from(overdueMap.entries()).map(
    ([status, count]) => ({ status, count })
  );

  return NextResponse.json({
    progress: {
      totalTasks,
      completedTasks
    },
    activity,
    overdueTasks
  });
}

