import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PredictionService {
  constructor(private prisma: PrismaService) {}

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
