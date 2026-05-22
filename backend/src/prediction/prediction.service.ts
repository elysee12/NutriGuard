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
    const isWindows = process.platform === 'win32';
    
    // Inzira ya script: default ni '../predict.py' kuko turi muri 'backend' folder
    const scriptPath = process.env.PYTHON_SCRIPT_PATH || join(process.cwd(), '..', 'predict.py');
    
    // Inzira ya Python executable
    let pythonPath = 'python3'; // Default kuri Render/Linux
    
    if (process.env.PYTHON_PATH) {
      pythonPath = process.env.PYTHON_PATH;
    } else if (isWindows) {
      // Local development kuri Windows
      const venvPath = join(process.cwd(), '..', '.venv', 'Scripts', 'python.exe');
      pythonPath = venvPath;
    }

    this.logger.log(`Prediction execution details:`);
    this.logger.log(`- Platform: ${process.platform}`);
    this.logger.log(`- Current Working Dir: ${process.cwd()}`);
    this.logger.log(`- Python Path: ${pythonPath}`);
    this.logger.log(`- Script Path: ${scriptPath}`);

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
