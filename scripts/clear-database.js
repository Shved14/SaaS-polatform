const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    console.log('🧹 Очистка базы данных...');
    
    // Очищаем в правильном порядке из-за внешних ключей
    await prisma.taskActivity.deleteMany({});
    console.log('✅ TaskActivity очищена');
    
    await prisma.taskComment.deleteMany({});
    console.log('✅ TaskComment очищена');
    
    await prisma.subtask.deleteMany({});
    console.log('✅ Subtask очищена');
    
    // TaskAttachment через $executeRaw
    await prisma.$executeRaw`DELETE FROM "TaskAttachment"`;
    console.log('✅ TaskAttachment очищена');
    
    await prisma.task.deleteMany({});
    console.log('✅ Task очищена');
    
    await prisma.board.deleteMany({});
    console.log('✅ Board очищена');
    
    await prisma.workspaceMember.deleteMany({});
    console.log('✅ WorkspaceMember очищена');
    
    await prisma.workspaceInvitation.deleteMany({});
    console.log('✅ WorkspaceInvitation очищена');
    
    await prisma.workspace.deleteMany({});
    console.log('✅ Workspace очищена');
    
    await prisma.verificationCode.deleteMany({});
    console.log('✅ VerificationCode очищена');
    
    const result = await prisma.user.deleteMany({});
    console.log(`✅ User очищена. Удалено ${result.count} пользователей`);
    
    console.log('🎉 База данных полностью очищена!');
    
  } catch (error) {
    console.error('❌ Ошибка при очистке:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();
