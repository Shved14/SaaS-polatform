const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestWorkspace() {
  try {
    // Находим пользователя
    const user = await prisma.user.findUnique({
      where: { email: 'azazvevip6@gmail.com' },
      select: { id: true, plan: true, proUntil: true }
    });

    if (!user) {
      console.log('❌ Пользователь не найден');
      return;
    }

    console.log('👤 Найден пользователь:', user);

    // Создаем тестовый workspace
    const workspace = await prisma.workspace.create({
      data: {
        name: 'Test Workspace',
        ownerId: user.id,
        members: {
          create: {
            userId: user.id,
            role: 'OWNER'
          }
        }
      }
    });

    console.log('✅ Workspace создан:', workspace.id);

    // Создаем 4 доски (превышаем лимит)
    for (let i = 1; i <= 4; i++) {
      try {
        const board = await prisma.board.create({
          data: {
            name: `Test Board ${i}`,
            workspaceId: workspace.id
          }
        });
        console.log(`✅ Доска ${i} создана:`, board.id);
      } catch (error) {
        console.log(`❌ Ошибка создания доски ${i}:`, error.message);
      }
    }

  } catch (error) {
    console.error('❌ Общая ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestWorkspace();
