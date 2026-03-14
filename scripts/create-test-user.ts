import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/password';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Удаляем существующего тестового пользователя если есть
    await prisma.user.deleteMany({
      where: { email: 'test@example.com' }
    });

    // Создаем нового с известным паролем
    const hashedPassword = await hashPassword('password123');
    
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
        emailVerified: new Date(),
        plan: 'FREE'
      }
    });

    console.log('✅ Test user created successfully!');
    console.log('Email: test@example.com');
    console.log('Password: password123');
    console.log('User ID:', user.id);
    console.log('Password hash:', hashedPassword);
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
