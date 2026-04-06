import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthCenterService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.healthCenter.findMany({
      include: {
        _count: {
          select: { users: true, children: true },
        },
      },
    });
  }

  async findOne(id: number) {
    const center = await this.prisma.healthCenter.findUnique({
      where: { id },
      include: {
        users: { select: { id: true, name: true, role: true, status: true } },
        children: true,
      },
    });
    if (!center) throw new NotFoundException('Health Center not found');
    return center;
  }

  async create(createHealthCenterDto: { name: string; location: string }) {
    return this.prisma.healthCenter.create({
      data: createHealthCenterDto,
    });
  }

  async update(id: number, updateHealthCenterDto: { name?: string; location?: string }) {
    const center = await this.prisma.healthCenter.findUnique({ where: { id } });
    if (!center) throw new NotFoundException('Health Center not found');

    return this.prisma.healthCenter.update({
      where: { id },
      data: updateHealthCenterDto,
      include: {
        _count: {
          select: { users: true, children: true },
        },
      },
    });
  }

  async remove(id: number) {
    const center = await this.prisma.healthCenter.findUnique({ where: { id } });
    if (!center) throw new NotFoundException('Health Center not found');

    return this.prisma.healthCenter.delete({ where: { id } });
  }
}
