const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    // Hash password: "super-admin123" using bcrypt
    const passwordHash = await bcrypt.hash('super-admin123', 10);

    // Delete existing if any
    await prisma.superAdmin.deleteMany();
    
    const superAdmin = await prisma.superAdmin.create({
      data: {
        email: 'admin@devrisk.ai',
        passwordHash,
        name: 'Super Admin',
      },
    });

    console.log('✓ SuperAdmin created:', superAdmin);
    console.log('\nLogin credentials:');
    console.log('Email: admin@devrisk.ai');
    console.log('Password: super-admin123');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
