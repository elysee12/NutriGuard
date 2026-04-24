import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChildDto } from './dto/create-child.dto';

@Injectable()
export class ChildService {
  constructor(private prisma: PrismaService) {}

  async create(createChildDto: CreateChildDto, userId: number, userRole: string) {
    let chwId: number;
    let healthCenterId: number;

    // If user is CHW, use their own ID
    if (userRole === 'CHW') {
      chwId = userId;
      const chw = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { healthCenter: true },
      });
      if (!chw || !chw.healthCenterId) {
        throw new ForbiddenException('User is not assigned to a health center');
      }
      healthCenterId = chw.healthCenterId;
    } 
    // If user is NURSE or ADMIN, use the provided chwId from form
    else if (userRole === 'NURSE' || userRole === 'ADMIN') {
      if (!createChildDto.chwId) {
        throw new ForbiddenException('CHW assignment is required when registered by Nurse or Admin');
      }

      const chw = await this.prisma.user.findUnique({
        where: { id: createChildDto.chwId },
        include: { healthCenter: true },
      });

      if (!chw || chw.role !== 'CHW') {
        throw new ForbiddenException('Invalid CHW selected');
      }

      if (!chw.healthCenterId) {
        throw new ForbiddenException('CHW is not assigned to a health center');
      }

      chwId = createChildDto.chwId;
      healthCenterId = chw.healthCenterId;
    } else {
      throw new ForbiddenException('Unauthorized to register child');
    }

    return this.prisma.child.create({
      data: {
        ...createChildDto,
        dob: new Date(createChildDto.dob),
        chwId,
        healthCenterId,
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
