import { Injectable, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
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
    // 1. Inzira ijya kuri predict.py (Ubu iri mu mizi y'umushinga/Root)
    const scriptPath = join(process.cwd(), 'predict.py');
    
    this.logger.log(`Running prediction with script at: ${scriptPath}`);

    return new Promise((resolve, reject) => {
      // 2. Guhamagara Python3 (Ohereza data nka JSON string muri arguments)
      const pythonProcess = spawn('python3', [scriptPath, JSON.stringify(inputData)]);

      let result = '';
      let errorData = '';

      // Fata igisubizo kiva muri Python
      pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
      });

      // Fata amakosa (Errors) niba yabayeho
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
          // Genzura niba Python hari icyo yasohoye
          if (!result.trim()) {
            return reject(new InternalServerErrorException('Python script returned empty result'));
          }

          // Garura igisubizo nka JSON kiva muri Python
          const parsedResult = JSON.parse(result.trim());
          
          // Niba muri Python harabayemo Exception tuyifate hano
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
