import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChildDto } from './dto/create-child.dto';
import { UpdateChildDto } from './dto/update-child.dto';

@Injectable()
export class ChildService {
  constructor(private prisma: PrismaService) {}

  async create(createChildDto: CreateChildDto, userId: number, userRole: string) {
    let chwId: number | null = null;
    let healthCenterId: number;

    // Validate DOB
    const dobDate = new Date(createChildDto.dob);
    const today = new Date();
    const fiveYearsAgo = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate());
    
    if (dobDate < fiveYearsAgo) {
      throw new ForbiddenException('Child must be under 5 years old');
    }
    if (dobDate > today) {
      throw new ForbiddenException('Date of birth cannot be in the future');
    }

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
    // If user is NURSE or ADMIN
    else if (userRole === 'NURSE' || userRole === 'ADMIN') {
      // Get the user (Nurse/Admin) to get their health center
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { healthCenter: true },
      });
      if (!user || !user.healthCenterId) {
        throw new ForbiddenException('User is not assigned to a health center');
      }
      healthCenterId = user.healthCenterId;

      // If chwId is provided, validate it
      if (createChildDto.chwId) {
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
      }
    } else {
      throw new ForbiddenException('Unauthorized to register child');
    }

    // Check for duplicate child (same name and same mother name)
    const existingChild = await this.prisma.child.findFirst({
      where: {
        name: createChildDto.name,
        motherName: createChildDto.motherName,
      },
    });

    if (existingChild) {
      throw new ForbiddenException('Child with this name and mother name is already registered');
    }

    return this.prisma.child.create({
      data: {
        ...createChildDto,
        dob: new Date(createChildDto.dob),
        chwId,
        healthCenterId,
      },
      include: { chw: true },
    });
  }

  async search(name?: string, motherName?: string) {
    return this.prisma.child.findMany({
      where: {
        AND: [
          name ? { name: { contains: name } } : {},
          motherName ? { motherName: { contains: motherName } } : {},
        ],
      },
      include: { chw: true, healthCenter: true },
      take: 5,
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

  async findOne(id: number, user: any) {
    const child = await this.prisma.child.findUnique({
      where: { id },
      include: { assessments: { include: { prediction: true } }, chw: true, healthCenter: true },
    });
    if (!child) throw new NotFoundException('Child not found');
    
    // Authorization check
    if (user.role === 'CHW') {
      if (child.chwId !== user.userId) {
        throw new ForbiddenException('You can only access your assigned children');
      }
    } else if (user.role === 'NURSE') {
      const nurse = await this.prisma.user.findUnique({ where: { id: user.userId } });
      if (!nurse || nurse.healthCenterId !== child.healthCenterId) {
        throw new ForbiddenException('You can only access children in your health center');
      }
    }
    
    return child;
  }

  async update(id: number, updateChildDto: UpdateChildDto, user: any) {
    const child = await this.prisma.child.findUnique({
      where: { id },
    });

    if (!child) throw new NotFoundException('Child not found');

    // Authorization check
    if (user.role === 'CHW' && child.chwId !== user.userId) {
      throw new ForbiddenException('You can only update children assigned to you');
    }

    if (user.role === 'NURSE') {
      const nurse = await this.prisma.user.findUnique({ where: { id: user.userId } });
      if (!nurse || nurse.healthCenterId !== child.healthCenterId) {
        throw new ForbiddenException('You can only update children in your health center');
      }
    }

    // Validate DOB if it's being updated
    if (updateChildDto.dob) {
      const dobDate = new Date(updateChildDto.dob);
      const today = new Date();
      const fiveYearsAgo = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate());
      
      if (dobDate < fiveYearsAgo) {
        throw new ForbiddenException('Child must be under 5 years old');
      }
      if (dobDate > today) {
        throw new ForbiddenException('Date of birth cannot be in the future');
      }
    }

    const updateData: any = { ...updateChildDto };
    if (updateChildDto.dob) {
      updateData.dob = new Date(updateChildDto.dob);
    }

    return this.prisma.child.update({
      where: { id },
      data: updateData,
      include: { chw: true },
    });
  }

  async remove(id: number, user: any) {
    const child = await this.prisma.child.findUnique({
      where: { id },
    });

    if (!child) throw new NotFoundException('Child not found');

    // Authorization check
    if (user.role === 'CHW' && child.chwId !== user.userId) {
      throw new ForbiddenException('You can only delete children assigned to you');
    }

    if (user.role === 'NURSE') {
      const nurse = await this.prisma.user.findUnique({ where: { id: user.userId } });
      if (!nurse || nurse.healthCenterId !== child.healthCenterId) {
        throw new ForbiddenException('You can only delete children in your health center');
      }
    }

    // Use a transaction to delete related records before deleting the child
    return this.prisma.$transaction(async (tx) => {
      // 1. Delete all predictions related to assessments of this child
      await tx.prediction.deleteMany({
        where: {
          assessment: {
            childId: id
          }
        }
      });

      // 2. Delete all assessments related to this child
      await tx.assessment.deleteMany({
        where: { childId: id },
      });

      // 3. Now delete the child
      return tx.child.delete({
        where: { id },
      });
    });
  }
}
