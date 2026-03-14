import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // Только для разработки!
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Этот endpoint доступен только в режиме разработки" },
        { status: 403 }
      );
    }

    // Очищаем все связанные таблицы в правильном порядке
    const result = await prisma.$transaction(async (tx) => {
      // Сначала удаляем все зависимости
      await tx.taskActivity.deleteMany({});
      await tx.taskComment.deleteMany({});
      await tx.subtask.deleteMany({});

      // Удаляем вложения через $queryRaw
      await tx.$executeRaw`DELETE FROM "TaskAttachment"`;

      await tx.task.deleteMany({});
      await tx.board.deleteMany({});

      // Удаляем участников и приглашения
      await tx.workspaceMember.deleteMany({});
      await tx.workspaceInvitation.deleteMany({});

      // Удаляем воркспейсы
      await tx.workspace.deleteMany({});

      // Удаляем верификационные коды
      await tx.verificationCode.deleteMany({});

      // Наконец удаляем пользователей
      const deletedUsers = await tx.user.deleteMany({});

      return {
        deletedUsersCount: deletedUsers.count,
        message: "Все данные очищены"
      };
    });

    console.log('✅ Database cleared successfully');

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('❌ Error clearing database:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
