import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, RiskLevel } from '@prisma/client';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getAdminStats() {
    const [totalUsers, totalHealthCenters, totalChildren, highRiskCount] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.healthCenter.count(),
      this.prisma.child.count(),
      this.prisma.prediction.count({ where: { riskLevel: RiskLevel.high } }),
    ]);

    const pendingUsers = await this.prisma.user.count({ where: { status: 'PENDING' } });

    return {
      totalUsers,
      totalHealthCenters,
      totalChildren,
      highRiskCount,
      pendingUsers,
    };
  }

  async getNurseStats(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.healthCenterId) return null;

    const [totalCHWs, totalChildren, pendingReviews, highRiskCount] = await Promise.all([
      this.prisma.user.count({ where: { healthCenterId: user.healthCenterId, role: UserRole.CHW } }),
      this.prisma.child.count({ where: { healthCenterId: user.healthCenterId } }),
      this.prisma.assessment.count({ where: { child: { healthCenterId: user.healthCenterId }, status: 'PENDING' } }),
      this.prisma.prediction.count({ where: { assessment: { child: { healthCenterId: user.healthCenterId } }, riskLevel: RiskLevel.high } }),
    ]);

    return {
      totalCHWs,
      totalChildren,
      pendingReviews,
      highRiskCount,
    };
  }

  async getCHWStats(userId: number) {
    const [totalChildren, totalAssessments, highRiskCount] = await Promise.all([
      this.prisma.child.count({ where: { chwId: userId } }),
      this.prisma.assessment.count({ where: { chwId: userId } }),
      this.prisma.prediction.count({ where: { assessment: { chwId: userId }, riskLevel: RiskLevel.high } }),
    ]);

    return {
      totalChildren,
      totalAssessments,
      highRiskCount,
      followUpRate: '92%', // Mocked for now
    };
  }
}
