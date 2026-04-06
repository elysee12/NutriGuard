import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class SystemLogService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, action: string, role: UserRole) {
    return this.prisma.systemLog.create({
      data: {
        userId,
        action,
        role,
      },
    });
  }

  async findAll() {
    return this.prisma.systemLog.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { time: 'desc' },
    });
  }
}
