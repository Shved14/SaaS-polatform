const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('../lib/password');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    const hashedPassword = await hashPassword('test12345');
    
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
        emailVerified: new Date(),
        plan: 'FREE'
      }
    });

    console.log('✅ Тестовый пользователь создан!');
    console.log('📧 Email: test@example.com');
    console.log('🔐 Password: test12345');
    console.log('👤 User ID:', user.id);
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
