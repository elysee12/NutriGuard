import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, RiskLevel } from '@prisma/client';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getAdminStats() {
    const [totalUsers, totalHealthCenters, totalChildren] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.healthCenter.count(),
      this.prisma.child.count(),
    ]);

    const pendingUsers = await this.prisma.user.count({ where: { status: 'PENDING' } });

    // Get all children and count high risk cases based on latest assessment per child
    const children = await this.prisma.child.findMany({
      select: { id: true },
    });

    let highRiskCount = 0;
    for (const child of children) {
      const latestAssessment = await this.prisma.assessment.findFirst({
        where: { childId: child.id },
        include: { prediction: true },
        orderBy: { date: 'desc' },
      });
      
      if (latestAssessment?.prediction?.riskLevel === RiskLevel.high) {
        highRiskCount++;
      }
    }

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

    // Get basic counts
    const [totalCHWs, totalChildren, pendingReviews] = await Promise.all([
      this.prisma.user.count({ where: { healthCenterId: user.healthCenterId, role: UserRole.CHW } }),
      this.prisma.child.count({ where: { healthCenterId: user.healthCenterId } }),
      this.prisma.assessment.count({ where: { child: { healthCenterId: user.healthCenterId }, status: 'PENDING' } }),
    ]);

    // Get all children in this health center
    const children = await this.prisma.child.findMany({
      where: { healthCenterId: user.healthCenterId },
      select: { id: true },
    });

    // Get latest assessment per child and count high risk cases
    let highRiskCount = 0;
    for (const child of children) {
      const latestAssessment = await this.prisma.assessment.findFirst({
        where: { childId: child.id },
        include: { prediction: true },
        orderBy: { date: 'desc' },
      });
      
      if (latestAssessment?.prediction?.riskLevel === RiskLevel.high) {
        highRiskCount++;
      }
    }

    return {
      totalCHWs,
      totalChildren,
      pendingReviews,
      highRiskCount,
    };
  }

  async getCHWStats(userId: number) {
    const [totalChildren, totalAssessments] = await Promise.all([
      this.prisma.child.count({ where: { chwId: userId } }),
      this.prisma.assessment.count({ where: { chwId: userId } }),
    ]);

    // Get all children for this CHW and count high risk cases based on latest assessment
    const children = await this.prisma.child.findMany({
      where: { chwId: userId },
      select: { id: true },
    });

    let highRiskCount = 0;
    for (const child of children) {
      const latestAssessment = await this.prisma.assessment.findFirst({
        where: { childId: child.id },
        include: { prediction: true },
        orderBy: { date: 'desc' },
      });
      
      if (latestAssessment?.prediction?.riskLevel === RiskLevel.high) {
        highRiskCount++;
      }
    }

    return {
      totalChildren,
      totalAssessments,
      highRiskCount,
      followUpRate: '92%', // Mocked for now
    };
  }

  async getPublicStats() {
    const [totalChildren, totalHealthWorkers] = await Promise.all([
      this.prisma.child.count(),
      this.prisma.user.count({
        where: {
          role: {
            in: [UserRole.CHW, UserRole.NURSE],
          },
        },
      }),
    ]);

    return {
      totalChildren,
      totalHealthWorkers,
      detectionRate: '95%',
    };
  }

  async getDetailedStats(nurseUserId?: number) {
    // Build filter based on user role
    let whereFilter = {};
    let isNurseView = false;
    
    if (nurseUserId) {
      const nurse = await this.prisma.user.findUnique({ where: { id: nurseUserId } });
      if (nurse?.healthCenterId) {
        whereFilter = { healthCenterId: nurse.healthCenterId };
        isNurseView = true;
      }
    }

    // Get all children with their latest assessment only
    const children = await this.prisma.child.findMany({
      where: whereFilter,
      select: { 
        id: true,
        dob: true,
        province: true,
        healthCenterId: true,
        healthCenter: {
          select: {
            id: true,
            name: true,
            location: true,
          }
        }
      },
    });

    // Get latest assessment per child to avoid duplicates
    const latestAssessments = await Promise.all(
      children.map(async (child) => {
        return this.prisma.assessment.findFirst({
          where: { childId: child.id },
          include: { prediction: true },
          orderBy: { date: 'desc' },
        });
      })
    );

    // Filter out null assessments (children without assessments)
    const assessments = latestAssessments.filter(a => a !== null);

    // Nutritional Status Distribution (based on latest assessments only - Stunting classification)
    const nutritionalStatus = {
      Stunted: assessments.filter(a => a.prediction?.result === 'Stunted').length,
      'Not Stunted': assessments.filter(a => a.prediction?.result === 'Not Stunted').length,
    };

    // Risk Level Distribution (based on latest assessments only)
    const riskDistribution = {
      low: assessments.filter(a => a.prediction?.riskLevel === RiskLevel.low).length,
      moderate: assessments.filter(a => a.prediction?.riskLevel === RiskLevel.moderate).length,
      high: assessments.filter(a => a.prediction?.riskLevel === RiskLevel.high).length,
    };

    // Monthly Assessment Trends (last 6 months) - all assessments for trend analysis
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyAssessments = await this.prisma.assessment.groupBy({
      by: ['date'],
      where: {
        child: whereFilter,
        date: { gte: sixMonthsAgo },
      },
      _count: true,
    });

    const monthlyTrends = this.aggregateByMonth(monthlyAssessments);

    // Age Group Distribution
    const ageGroups = this.calculateAgeGroups(children);

    // Geographic Distribution - by Health Center for Nurses, by Province for Admins
    let geoDistribution: Array<{ location: string; count: number }> = [];
    
    if (isNurseView) {
      // For nurses: Group by health center
      const healthCenterGroups = new Map<string, { name: string; count: number }>();
      children.forEach(child => {
        if (child.healthCenter) {
          const key = child.healthCenter.name;
          const existing = healthCenterGroups.get(key);
          if (existing) {
            existing.count++;
          } else {
            healthCenterGroups.set(key, {
              name: child.healthCenter.name,
              count: 1,
            });
          }
        }
      });
      
      geoDistribution = Array.from(healthCenterGroups.values())
        .map(hc => ({
          location: hc.name,
          count: hc.count,
        }))
        .sort((a, b) => b.count - a.count);
    } else {
      // For admins: Group by province
      const provinceGroups = new Map<string, number>();
      children.forEach(child => {
        if (child.province) {
          provinceGroups.set(child.province, (provinceGroups.get(child.province) || 0) + 1);
        }
      });
      
      geoDistribution = Array.from(provinceGroups.entries())
        .map(([province, count]) => ({
          location: province,
          count,
        }))
        .sort((a, b) => b.count - a.count);
    }

    return {
      nutritionalStatus,
      riskDistribution,
      monthlyTrends,
      ageGroups,
      geoDistribution,
      totalAssessments: assessments.length,
      totalChildren: children.length,
      isNurseView, // Flag to help frontend adjust labels
    };
  }

  private aggregateByMonth(data: any[]) {
    const monthlyData = new Map<string, number>();
    
    data.forEach(item => {
      const date = new Date(item.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + item._count);
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const result: { month: string; assessments: number }[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      result.push({
        month: months[date.getMonth()],
        assessments: monthlyData.get(monthKey) || 0,
      });
    }

    return result;
  }

  private calculateAgeGroups(children: { dob: Date }[]) {
    const groups = {
      '0-6 months': 0,
      '6-12 months': 0,
      '12-24 months': 0,
      '24-36 months': 0,
      '36-60 months': 0,
    };

    children.forEach(child => {
      const ageInMonths = Math.floor(
        (Date.now() - new Date(child.dob).getTime()) / (1000 * 60 * 60 * 24 * 30.44)
      );

      if (ageInMonths < 6) groups['0-6 months']++;
      else if (ageInMonths < 12) groups['6-12 months']++;
      else if (ageInMonths < 24) groups['12-24 months']++;
      else if (ageInMonths < 36) groups['24-36 months']++;
      else if (ageInMonths < 60) groups['36-60 months']++;
    });

    return Object.entries(groups).map(([ageGroup, count]) => ({
      ageGroup,
      count,
    }));
  }
}
