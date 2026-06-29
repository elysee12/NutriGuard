import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { PredictionService } from '../prediction/prediction.service';
import { RiskLevel, AssessmentStatus } from '@prisma/client';

@Injectable()
export class AssessmentService {
  constructor(
    private prisma: PrismaService,
    private predictionService: PredictionService,
  ) {}

  async create(createAssessmentDto: CreateAssessmentDto, user: any) {
    const { childId, ...data } = createAssessmentDto;
    const chwId = user.userId;

    const child = await this.prisma.child.findUnique({ where: { id: childId } });
    if (!child) {
      throw new NotFoundException('Child not found');
    }

    const mlFeatures = {
      umwana_afite_ababyeyi: data.hasBothParents ? 'Yego' : 'Oya',
      amashuri_mama_w_umwana_yiz: data.motherEducation,
      height: data.height,
      weight: data.weight,
      muac: data.muac,
      sick: data.hasRecentIllness ? 'Yego' : 'Oya',
      mmf: data.hasMinimumMealFrequency ? 'Yego' : 'Oya',
      fbf: data.hasExclusiveBF ? 'Yego' : 'Oya',
      vup: data.hasVUP ? 'Yego' : 'Oya',
      ese_haba_hari_amakimbirane: data.hasHouseholdConflict ? 'Yego' : 'Oya',
      icyo_umurera_akora: data.caregiverOccupation,
      water: data.hasSafeWater ? 'Yego' : 'Oya',
      handwash: data.hasHandwashingFacility ? 'Yego' : 'Oya',
      toilet: data.hasToilet ? 'Yego' : 'Oya',
      sex_new: data.sex,
      age_days: data.ageDays,
    };

    // Call ML model via PredictionService
    const predictionResult = await this.predictionService.runPrediction(mlFeatures);

    // Save assessment and prediction
    return this.prisma.$transaction(async (tx) => {
      const isNurse = user.role === 'NURSE';
      const assessment = await tx.assessment.create({
        data: {
          childId,
          chwId,
          height: data.height,
          weight: data.weight,
          muac: data.muac,
          motherEducation: data.motherEducation,
          caregiverOccupation: data.caregiverOccupation,
          hasBothParents: data.hasBothParents,
          hasRecentIllness: data.hasRecentIllness,
          hasMinimumMealFrequency: data.hasMinimumMealFrequency,
          hasExclusiveBF: data.hasExclusiveBF,
          hasVUP: data.hasVUP,
          hasHouseholdConflict: data.hasHouseholdConflict,
          hasSafeWater: data.hasSafeWater,
          hasHandwashingFacility: data.hasHandwashingFacility,
          hasToilet: data.hasToilet,
          status: isNurse ? AssessmentStatus.REVIEWED : AssessmentStatus.PENDING,
          reviewedBy: isNurse ? `${user.name} (Direct Submission)` : null,
          reviewedAt: isNurse ? new Date() : null,
        },
      });

      let riskLevel: RiskLevel = RiskLevel.low;
      if (predictionResult.risk_score > 60) {
        riskLevel = RiskLevel.high;
      } else if (predictionResult.risk_score > 30) {
        riskLevel = RiskLevel.moderate;
      }

      await tx.prediction.create({
        data: {
          assessmentId: assessment.id,
          result: predictionResult.prediction,
          riskScore: predictionResult.risk_score,
          riskLevel: riskLevel,
          recommendation: predictionResult.recommendation,
        },
      });

      return {
        assessmentId: assessment.id,
        prediction: predictionResult.prediction,
        riskScore: predictionResult.risk_score,
        riskLevel,
        recommendation: predictionResult.recommendation,
        status: assessment.status,
      };
    });
  }

  async findAll(user: any) {
    const includeOptions = {
      child: true,
      chw: {
        include: { healthCenter: true }
      },
      prediction: true,
    };
    if (user.role === 'ADMIN') {
      return this.prisma.assessment.findMany({
        include: includeOptions,
      });
    } else if (user.role === 'NURSE') {
      const nurse = await this.prisma.user.findUnique({ where: { id: user.userId } });
      if (!nurse || !nurse.healthCenterId) {
        return [];
      }
      return this.prisma.assessment.findMany({
        where: {
          chw: {
            healthCenterId: nurse.healthCenterId,
          },
        },
        include: includeOptions,
      });
    } else {
      // CHW role
      return this.prisma.assessment.findMany({
        where: { chwId: user.userId },
        include: includeOptions,
      });
    }
  }

  async findOne(id: number, user: any) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id },
      include: {
        child: true,
        chw: {
          include: { healthCenter: true }
        },
        prediction: true,
      },
    });
    if (!assessment) throw new NotFoundException('Assessment not found');

    // Authorization check
    if (user.role === 'CHW' && assessment.chwId !== user.userId) {
      throw new ForbiddenException('You can only access your own assessments');
    }

    if (user.role === 'NURSE') {
      const nurse = await this.prisma.user.findUnique({ where: { id: user.userId } });
      if (!nurse || nurse.healthCenterId !== assessment.chw.healthCenterId) {
        throw new ForbiddenException('You can only access assessments from your health center');
      }
    }

    return assessment;
  }

  async reviewAssessment(id: number, status: string, reviewerId: number) {
    const assessment = await this.prisma.assessment.findUnique({ 
      where: { id },
      include: { chw: true }
    });
    if (!assessment) throw new NotFoundException('Assessment not found');

    const reviewer = await this.prisma.user.findUnique({ where: { id: reviewerId } });
    if (!reviewer) {
      throw new NotFoundException('Reviewer not found');
    }

    if (reviewer.role !== 'NURSE') {
      throw new ForbiddenException('Only nurses can review assessments.');
    }

    if (reviewer.healthCenterId !== assessment.chw.healthCenterId) {
      throw new ForbiddenException('You can only review assessments from your health center');
    }

    return this.prisma.assessment.update({
      where: { id },
      data: {
        status: AssessmentStatus.REVIEWED,
        reviewedBy: `${reviewer.name} (${status})`,
        reviewedAt: new Date(),
      },
    });
  }
}
