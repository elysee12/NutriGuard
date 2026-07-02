import { Injectable, NotFoundException, InternalServerErrorException, Logger, ForbiddenException, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';

@Injectable()
export class PredictionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PredictionService.name);
  private pythonProcess: ChildProcess | null = null;
  private predictionQueue: Array<{ input: any; resolve: Function; reject: Function }> = [];
  private isProcessing = false;

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    this.startPythonProcess();
  }

  onModuleDestroy() {
    this.stopPythonProcess();
  }

  private startPythonProcess() {
    const isWindows = process.platform === 'win32';
    const scriptPath = process.env.PYTHON_SCRIPT_PATH || join(process.cwd(), '..', 'predict.py');
    let pythonPath = 'python3';
    
    if (process.env.PYTHON_PATH) {
      pythonPath = process.env.PYTHON_PATH;
    } else if (isWindows) {
      pythonPath = join(process.cwd(), '..', '.venv', 'Scripts', 'python.exe');
    }

    this.logger.log(`Starting persistent Python process with model...`);
    this.pythonProcess = spawn(pythonPath, [scriptPath, '--persistent']);

    this.pythonProcess.stdout?.on('data', (data) => {
      const output = data.toString().trim();
      if (this.predictionQueue.length > 0) {
        const { resolve, reject } = this.predictionQueue.shift()!;
        try {
          const result = JSON.parse(output);
          if (result.error) reject(new InternalServerErrorException(result.error));
          else resolve(result);
        } catch (e) {
          reject(new InternalServerErrorException(`Failed to parse Python output: ${output}`));
        }
        this.processNextInQueue();
      }
    });

    this.pythonProcess.stderr?.on('data', (data) => {
      this.logger.error(`Python process error: ${data.toString()}`);
    });

    this.pythonProcess.on('close', (code) => {
      this.logger.warn(`Python process exited with code ${code}. Restarting...`);
      this.pythonProcess = null;
      setTimeout(() => this.startPythonProcess(), 1000);
    });
  }

  private stopPythonProcess() {
    if (this.pythonProcess) {
      this.pythonProcess.kill();
      this.pythonProcess = null;
    }
  }

  private processNextInQueue() {
    if (this.predictionQueue.length > 0 && this.pythonProcess && this.pythonProcess.stdin) {
      const { input } = this.predictionQueue[0];
      this.pythonProcess.stdin.write(JSON.stringify(input) + '\n');
    } else {
      this.isProcessing = false;
    }
  }

  async runPrediction(inputData: any): Promise<{ prediction: string; risk_score: number; recommendation: string }> {
    const predictionResult: any = await new Promise((resolve, reject) => {
      this.predictionQueue.push({ input: inputData, resolve, reject });
      if (!this.isProcessing) {
        this.isProcessing = true;
        this.processNextInQueue();
      }
    });

    const recommendation = this.generateRecommendations(inputData, predictionResult.prediction);

    return {
      ...predictionResult,
      recommendation,
    };
  }

  private generateRecommendations(features: any, prediction: string): string {
    const recs: string[] = [];

    // Base prediction message
    if (prediction === 'Stunted') {
      recs.push("Immediate nutritional intervention is required.");
    } else {
      recs.push("Child growth is currently on track, but continuous care is needed.");
    }

    // 1. MUAC - The most critical indicator for acute malnutrition
    if (features.muac < 11.5) {
      recs.push("URGENT: MUAC is dangerously low (<11.5cm), indicating Severe Acute Malnutrition (SAM). Immediate referral to a health center for therapeutic food (RUTF) is mandatory.");
    } else if (features.muac < 12.5) {
      recs.push("MUAC is low (11.5-12.5cm), indicating Moderate Acute Malnutrition (MAM). Increase protein-rich foods and monitor weekly.");
    }

    // 2. Health & Illness
    if (features.sick === 'Yego') {
      recs.push("Address the recent illness immediately; infection is a major driver of stunting. Ensure the child completes any prescribed medication.");
    }

    // 3. Nutrition Practices
    if (features.fbf === 'Oya' && features.age_days < 180) {
      recs.push("For children under 6 months, ensure exclusive breastfeeding. Avoid giving other liquids or solids.");
    }
    if (features.mmf === 'Oya') {
      recs.push("Increase meal frequency. The child needs at least 3-4 diverse meals daily to meet energy requirements.");
    }

    // 4. WASH (Water, Sanitation, Hygiene) - Prevents diarrhea and nutrient loss
    if (features.water === 'Oya') {
      recs.push("Treat all drinking water (boil or use Sur'Eau). Waterborne diseases directly contribute to nutrient malabsorption.");
    }
    if (features.handwash === 'Oya' || features.toilet === 'Oya') {
      recs.push("Strictly enforce handwashing with soap and ensure use of a clean toilet to prevent fecal-oral transmission of parasites.");
    }

    // 5. Socio-economic & Psychosocial
    if (features.ese_haba_hari_amakimbirane === 'Yego') {
      recs.push("Psychosocial support for caregivers is needed. Household conflict increases child stress levels, which can inhibit growth hormones.");
    }
    if (features.vup === 'Oya') {
      recs.push("Verify if the family is eligible for VUP or other social protection programs to improve food security.");
    }

    // 6. Caregiver Context
    if (features.amashuri_mama_w_umwana_yiz === 'Ntago yize') {
      recs.push("Provide targeted nutrition education to the mother, focusing on balanced diet preparation using locally available foods.");
    }

    return recs.join(' ');
  }

  async findAll(user: any) {
    if (user.role === 'ADMIN') {
      return this.prisma.prediction.findMany({
        include: {
          assessment: {
            include: {
              child: true,
              chw: true,
            },
          },
        },
      });
    } else if (user.role === 'NURSE') {
      const nurse = await this.prisma.user.findUnique({ where: { id: user.userId } });
      if (!nurse || !nurse.healthCenterId) {
        return [];
      }
      return this.prisma.prediction.findMany({
        where: {
          assessment: {
            child: {
              healthCenterId: nurse.healthCenterId,
            },
          },
        },
        include: {
          assessment: {
            include: {
              child: true,
              chw: true,
            },
          },
        },
      });
    } else {
      // CHW role: all predictions for children assigned to this CHW
      return this.prisma.prediction.findMany({
        where: {
          assessment: {
            child: {
              chwId: user.userId,
            },
          },
        },
        include: {
          assessment: {
            include: {
              child: true,
              chw: true,
            },
          },
        },
      });
    }
  }

  async findOne(id: number, user: any) {
    const prediction = await this.prisma.prediction.findUnique({
      where: { id },
      include: {
        assessment: {
          include: {
            child: {
              include: { healthCenter: true }
            },
            chw: {
              include: { healthCenter: true }
            },
          },
        },
      },
    });
    if (!prediction) throw new NotFoundException('Prediction not found');

    // Authorization check
    if (user.role === 'CHW') {
      if (prediction.assessment.child.chwId !== user.userId && prediction.assessment.chwId !== user.userId) {
        throw new ForbiddenException('You can only access predictions for your assigned children');
      }
    }

    if (user.role === 'NURSE') {
      const nurse = await this.prisma.user.findUnique({ where: { id: user.userId } });
      if (!nurse || nurse.healthCenterId !== prediction.assessment.child.healthCenterId) {
        throw new ForbiddenException('You can only access predictions from your health center');
      }
    }

    return prediction;
  }
}
