import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Password@123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@nutriguard.rw' },
    update: {
      password: hashedPassword,
      status: UserStatus.APPROVED,
    },
    create: {
      email: 'admin@nutriguard.rw',
      password: hashedPassword,
      name: 'System Admin',
      role: UserRole.ADMIN,
      status: UserStatus.APPROVED,
    },
  });

  // Create a Health Center
  const hc = await prisma.healthCenter.upsert({
    where: { name: 'Kigali Health Center' },
    update: {},
    create: {
      name: 'Kigali Health Center',
      location: 'Kigali, Rwanda',
      province: 'Kigali City',
      district: 'Nyarugenge',
      sector: 'Nyarugenge',
      cell: 'Kiyovu',
      village: 'Village 1',
    },
  });

  // Create Health Workers
  const nurse = await prisma.user.upsert({
    where: { email: 'nurse@nutriguard.rw' },
    update: {},
    create: {
      email: 'nurse@nutriguard.rw',
      password: hashedPassword,
      name: 'Alice Nurse',
      role: UserRole.NURSE,
      status: UserStatus.APPROVED,
      healthCenterId: hc.id,
    },
  });

  const chw = await prisma.user.upsert({
    where: { email: 'chw@nutriguard.rw' },
    update: {},
    create: {
      email: 'chw@nutriguard.rw',
      password: hashedPassword,
      name: 'Bob CHW',
      role: UserRole.CHW,
      status: UserStatus.APPROVED,
      healthCenterId: hc.id,
    },
  });

  // Create 3 Children
  const childrenData = [
    { name: 'Child One', dob: new Date('2024-01-01'), gender: 'M', motherName: 'Mother One' },
    { name: 'Child Two', dob: new Date('2024-02-01'), gender: 'F', motherName: 'Mother Two' },
    { name: 'Child Three', dob: new Date('2024-03-01'), gender: 'M', motherName: 'Mother Three' },
  ];

  for (const child of childrenData) {
    await prisma.child.create({
      data: {
        ...child,
        district: 'Nyarugenge',
        sector: 'Nyarugenge',
        cell: 'Kiyovu',
        village: 'Village 1',
        chwId: chw.id,
        healthCenterId: hc.id,
      },
    });
  }

  console.log('Seeded admin, health center, health workers, and 3 children.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
