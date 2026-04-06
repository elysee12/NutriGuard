import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChildDto } from './dto/create-child.dto';

@Injectable()
export class ChildService {
  constructor(private prisma: PrismaService) {}

  async create(createChildDto: CreateChildDto, chwId: number) {
    const chw = await this.prisma.user.findUnique({
      where: { id: chwId },
      include: { healthCenter: true },
    });

    if (!chw || !chw.healthCenterId) {
      throw new ForbiddenException('User is not assigned to a health center');
    }

    return this.prisma.child.create({
      data: {
        ...createChildDto,
        dob: new Date(createChildDto.dob),
        chwId: chw.id,
        healthCenterId: chw.healthCenterId,
      },
    });
  }

  async findAll(user: any) {
    if (user.role === 'ADMIN') {
      return this.prisma.child.findMany({
        include: { healthCenter: true, chw: true },
      });
    } else if (user.role === 'NURSE') {
      const nurse = await this.prisma.user.findUnique({ where: { id: user.userId } });
      if (!nurse || !nurse.healthCenterId) {
        return []; // Or throw an error, depending on desired behavior
      }
      return this.prisma.child.findMany({
        where: { healthCenterId: nurse.healthCenterId },
        include: { chw: true },
      });
    } else {
      return this.prisma.child.findMany({
        where: { chwId: user.userId },
      });
    }
  }

  async findOne(id: number) {
    const child = await this.prisma.child.findUnique({
      where: { id },
      include: { assessments: { include: { prediction: true } }, chw: true, healthCenter: true },
    });
    if (!child) throw new NotFoundException('Child not found');
    return child;
  }
}
