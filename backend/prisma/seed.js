const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Default categories
  const categoryNames = ['Plumbing', 'Electrical', 'Cleaning', 'Security', 'Lift/Elevator', 'Parking', 'Other'];
  for (const name of categoryNames) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // Default overdue threshold setting (in days)
  await prisma.setting.upsert({
    where: { key: 'overdue_threshold_days' },
    update: {},
    create: { key: 'overdue_threshold_days', value: '3' },
  });

  // Default admin user
  const adminEmail = 'admin@society.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Admin@123', 10);
    await prisma.user.create({
      data: {
        name: 'Society Admin',
        email: adminEmail,
        passwordHash,
        role: 'admin',
      },
    });
    console.log('Created default admin: admin@society.com / Admin@123');
  }

  // A sample resident for quick testing
  const residentEmail = 'resident@society.com';
  const existingResident = await prisma.user.findUnique({ where: { email: residentEmail } });
  if (!existingResident) {
    const passwordHash = await bcrypt.hash('Resident@123', 10);
    await prisma.user.create({
      data: {
        name: 'Test Resident',
        email: residentEmail,
        passwordHash,
        role: 'resident',
        flatNumber: 'A-101',
      },
    });
    console.log('Created sample resident: resident@society.com / Resident@123');
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
