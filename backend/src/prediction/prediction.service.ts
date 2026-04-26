import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { spawn } from 'child_process';
import { join } from 'path';

@Injectable()
export class PredictionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Iyi method niyo ihamagara Python script (predict.py) ikagarura igisubizo
   * @param inputData Amakuru umu-user yinjije (urugero: weight, height, age...)
   */
  async runPrediction(inputData: any) {
    // 1. Inzira ijya kuri predict.py (iri hanze ya backend folder mu mizi y'umushinga)
    const scriptPath = join(process.cwd(), '..', 'predict.py');
    
    return new Promise((resolve, reject) => {
      // 2. Guhamagara Python3 (Ohereza data nka JSON string muri arguments)
      const pythonProcess = spawn('python3', [scriptPath, JSON.stringify(inputData)]);

      let result = '';
      let error = '';

      // Fata ibisubizo (Output)
      pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
      });

      // Fata amakosa (Errors) niba yabayeho
      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error(`Python Error: ${error}`);
          return reject(new InternalServerErrorException('Python script failed to run'));
        }

        try {
          // Garura igisubizo nka JSON
          const parsedResult = JSON.parse(result);
          resolve(parsedResult);
        } catch (e) {
          reject(new InternalServerErrorException('Failed to parse Python output'));
        }
      });
    });
  }

  async findAll() {
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
  }

  async findOne(id: number) {
    const prediction = await this.prisma.prediction.findUnique({
      where: { id },
      include: {
        assessment: {
          include: {
            child: true,
            chw: true,
          },
        },
      },
    });
    if (!prediction) throw new NotFoundException('Prediction not found');
    return prediction;
  }
}

