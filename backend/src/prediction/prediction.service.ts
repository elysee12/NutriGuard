import { Injectable, NotFoundException, InternalServerErrorException, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { spawn } from 'child_process';
import { join } from 'path';

@Injectable()
export class PredictionService {
  private readonly logger = new Logger(PredictionService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Iyi method ihamagara predict.py ikoresheje Python3.
   * Kubera ko twakuye "backend" mu Root Directory ya Render, 
   * 'process.cwd()' ubu iri kureba mu mizi (root) y'umushinga.
   */
  async runPrediction(inputData: any) {
    // Mu buryo bwa production (Render), izi nzira zizaturuka muri Environment Variables
    // Local (Windows), tuzakoresha inzira isanzwe niba nta kintu cyashyizweho
    const isWindows = process.platform === 'win32';
    
    const scriptPath = process.env.PYTHON_SCRIPT_PATH || join(process.cwd(), '..', 'predict.py');
    
    // Hitamo python executable bitewe na environment
    let defaultPython = isWindows ? 'python' : 'python3';
    
    // Niba turi muri Windows kandi hari .venv, koresha iyo
    if (isWindows && !process.env.PYTHON_PATH) {
      const venvPath = join(process.cwd(), '..', '.venv', 'Scripts', 'python.exe');
      // Turebe niba iyi file ihari (Optional but safer)
      defaultPython = venvPath;
    }

    const pythonPath = process.env.PYTHON_PATH || defaultPython;
    
    this.logger.log(`Running prediction using: ${pythonPath} with script at: ${scriptPath}`);

    return new Promise((resolve, reject) => {
      const pythonProcess = spawn(pythonPath, [scriptPath]);

      let result = '';
      let errorData = '';

      pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
      });

      pythonProcess.on('error', (err) => {
        this.logger.error(`Failed to start Python process: ${err.message}`);
        reject(new InternalServerErrorException(`Python process error: ${err.message}`));
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          this.logger.error(`Python exited with code ${code}. Error: ${errorData}`);
          return reject(new InternalServerErrorException(`Python Script Error: ${errorData}`));
        }
        try {
          if (!result.trim()) {
            return reject(new InternalServerErrorException('Python script returned empty result'));
          }

          const parsedResult = JSON.parse(result.trim());
          
          if (parsedResult.error) {
            this.logger.error(`Prediction Error from Python: ${parsedResult.error}`);
            return reject(new InternalServerErrorException(parsedResult.error));
          }

          resolve(parsedResult);
        } catch (e) {
          this.logger.error(`Failed to parse Python JSON. Raw output: ${result}`);
          reject(new InternalServerErrorException('Invalid JSON output from Python script'));
        }
      });

      pythonProcess.stdin.write(JSON.stringify(inputData));
      pythonProcess.stdin.end();
    });
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
            chw: {
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
      // CHW role
      return this.prisma.prediction.findMany({
        where: {
          assessment: {
            chwId: user.userId,
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
            child: true,
            chw: {
              include: { healthCenter: true }
            },
          },
        },
      },
    });
    if (!prediction) throw new NotFoundException('Prediction not found');

    // Authorization check
    if (user.role === 'CHW' && prediction.assessment.chwId !== user.userId) {
      throw new ForbiddenException('You can only access predictions for your assessments');
    }

    if (user.role === 'NURSE') {
      const nurse = await this.prisma.user.findUnique({ where: { id: user.userId } });
      if (!nurse || nurse.healthCenterId !== prediction.assessment.chw.healthCenterId) {
        throw new ForbiddenException('You can only access predictions from your health center');
      }
    }

    return prediction;
  }
}
