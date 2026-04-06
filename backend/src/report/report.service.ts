import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: any) {
    if (user.role === 'ADMIN') {
      return this.prisma.report.findMany({
        include: { healthCenter: true },
      });
    } else {
      const dbUser = await this.prisma.user.findUnique({ where: { id: user.userId } });
      if (!dbUser || !dbUser.healthCenterId) {
        return [];
      }
      return this.prisma.report.findMany({
        where: { healthCenterId: dbUser.healthCenterId },
      });
    }
  }

  async findOne(id: number) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: { healthCenter: true },
    });
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }
}
