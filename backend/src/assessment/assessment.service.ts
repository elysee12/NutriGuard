import { Injectable, InternalServerErrorException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { spawn } from 'child_process';
import * as path from 'path';
import { RiskLevel, AssessmentStatus } from '@prisma/client';

@Injectable()
export class AssessmentService {
  constructor(private prisma: PrismaService) {}

  async create(createAssessmentDto: CreateAssessmentDto, chwId: number) {
    const { childId, ...data } = createAssessmentDto;

    const child = await this.prisma.child.findUnique({ where: { id: childId } });
    if (!child) {
      throw new NotFoundException('Child not found');
    }

    // Prepare features for ML model
    // Mapping frontend/DB boolean to 'Yego'/'Oya' expected by ML model if necessary
    // Based on train_model.ipynb, categorical features are strings like 'Yego', 'Oya', 'M', 'F', etc.
    
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

    // Call ML model
    const predictionResult = await this.getMLPrediction(mlFeatures);

    // Save assessment and prediction
    return this.prisma.$transaction(async (tx) => {
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
        },
      });

      let riskLevel: RiskLevel = RiskLevel.low;
      if (predictionResult.risk_score > 60) {
        riskLevel = RiskLevel.high;
      } else if (predictionResult.risk_score > 30) {
        riskLevel = RiskLevel.moderate;
      }

      const recommendation = predictionResult.prediction === 'Stunted' 
        ? "Immediate nutritional intervention recommended. Refer to health center for detailed assessment."
        : "Continue regular monitoring. Ensure balanced diet with adequate protein and micronutrients.";

      await tx.prediction.create({
        data: {
          assessmentId: assessment.id,
          result: predictionResult.prediction,
          riskScore: predictionResult.risk_score,
          riskLevel: riskLevel,
          recommendation: recommendation,
        },
      });

      return {
        assessmentId: assessment.id,
        prediction: predictionResult.prediction,
        riskScore: predictionResult.risk_score,
        riskLevel,
        recommendation,
      };
    });
  }

  private async getMLPrediction(features: any): Promise<{ prediction: string; risk_score: number }> {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(process.cwd(), '..', 'predict.py');
      const pythonPath = path.join(process.cwd(), '..', '.venv', 'Scripts', 'python.exe');
      const pythonProcess = spawn(pythonPath, [scriptPath]);

      let output = '';
      let error = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          return reject(new InternalServerErrorException(`ML process failed with code ${code}: ${error}`));
        }
        try {
          const result = JSON.parse(output);
          if (result.error) {
            return reject(new InternalServerErrorException(`ML error: ${result.error}`));
          }
          resolve(result);
        } catch (e) {
          reject(new InternalServerErrorException(`Failed to parse ML output: ${output}`));
        }
      });

      pythonProcess.stdin.write(JSON.stringify(features));
      pythonProcess.stdin.end();
    });
  }

  async findAll() {
    return this.prisma.assessment.findMany({
      include: {
        child: true,
        chw: true,
        prediction: true,
      },
    });
  }

  async findOne(id: number) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id },
      include: {
        child: true,
        chw: true,
        prediction: true,
      },
    });
    if (!assessment) throw new NotFoundException('Assessment not found');
    return assessment;
  }

  async reviewAssessment(id: number, status: string, reviewerId: number) {
    const assessment = await this.prisma.assessment.findUnique({ where: { id } });
    if (!assessment) throw new NotFoundException('Assessment not found');

    const reviewer = await this.prisma.user.findUnique({ where: { id: reviewerId } });
    if (!reviewer) {
      throw new NotFoundException('Reviewer not found');
    }

    if (reviewer.role !== 'NURSE') {
      throw new ForbiddenException('Only nurses can review assessments.');
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
