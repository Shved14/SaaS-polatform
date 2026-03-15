const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkBoards() {
  try {
    const userEmail = 'azazvevip6@gmail.com';
    
    // Находим пользователя
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, plan: true, proUntil: true }
    });

    console.log('👤 Пользователь:', user);
    
    if (user) {
      // Находим все workspace пользователя
      const workspaces = await prisma.workspace.findMany({
        where: { ownerId: user.id },
        select: { id: true, name: true }
      });

      console.log('🏢 Workspace пользователя:');
      for (const ws of workspaces) {
        // Считаем доски в каждом workspace
        const boardCount = await prisma.board.count({
          where: { workspaceId: ws.id }
        });
        console.log(`   - ${ws.name} (${ws.id}): ${boardCount} досок`);
      }
    }

  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBoards();
