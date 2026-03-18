import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/layout/container";
import { AnalyticsClient } from "./AnalyticsClient";

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const userId = session.user.id;

  // Получаем все рабочие пространства пользователя
  const workspaces = await prisma.workspace.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } }
      ]
    },
    select: {
      id: true,
      name: true
    }
  });

  // Получаем все доски пользователя
  const boards = await prisma.board.findMany({
    where: {
      workspace: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      }
    },
    select: {
      id: true,
      name: true,
      workspaceId: true,
      workspace: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  // Получаем все задачи (будем фильтровать на клиенте)
  const tasks = await prisma.task.findMany({
    where: {
      board: {
        workspace: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } }
          ]
        }
      }
    },
    include: {
      assignee: true,
      board: {
        select: {
          id: true,
          name: true,
          workspaceId: true
        }
      }
    }
  });

  return (
    <Container className="space-y-8 py-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Аналитика задач
        </h1>
        <p className="text-sm text-muted-foreground">
          Сводка по статусам, просроченным задачам и нагрузке на участников.
        </p>
      </header>

      <AnalyticsClient
        tasks={tasks}
        workspaces={workspaces}
        boards={boards}
      />
    </Container>
  );
}

