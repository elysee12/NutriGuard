import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Password@123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@nutriguard.rw' },
    update: {},
    create: {
      email: 'admin@nutriguard.rw',
      password: hashedPassword,
      name: 'System Admin',
      role: UserRole.ADMIN,
      status: UserStatus.APPROVED,
    },
  });

  console.log('Seeded admin user only.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
