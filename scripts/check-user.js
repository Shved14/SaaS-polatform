const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUser() {
  try {
    // Проверяем всех пользователей
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        plan: true,
        proUntil: true,
        createdAt: true
      }
    });

    console.log('👥 Пользователи в системе:');
    users.forEach(user => {
      console.log(`📧 Email: ${user.email}`);
      console.log(`💳 План: ${user.plan}`);
      console.log(`📅 PRO до: ${user.proUntil || 'Бессрочно'}`);
      console.log(`📅 Создан: ${user.createdAt}`);
      console.log('---');
    });

    // Проверяем доски
    const boards = await prisma.board.findMany({
      select: {
        id: true,
        name: true,
        workspaceId: true,
        createdAt: true
      }
    });

    console.log('📋 Доски в системе:');
    const boardsByWorkspace = {};
    boards.forEach(board => {
      if (!boardsByWorkspace[board.workspaceId]) {
        boardsByWorkspace[board.workspaceId] = [];
      }
      boardsByWorkspace[board.workspaceId].push(board);
    });

    Object.keys(boardsByWorkspace).forEach(workspaceId => {
      console.log(`🏢 Workspace ${workspaceId}: ${boardsByWorkspace[workspaceId].length} досок`);
    });

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
