import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async findAll() {
    return this.prisma.user.findMany({
      include: { healthCenter: true },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { healthCenter: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async approveUser(id: number, status: UserStatus) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { status },
    });

    // Send notification email
    if (status === UserStatus.APPROVED || status === UserStatus.REJECTED) {
      await this.mailService.sendAccountStatusEmail(user.email, user.name, status as 'APPROVED' | 'REJECTED');
    }

    return updatedUser;
  }

  async updateProfile(
    id: number,
    data: { name?: string; email?: string; currentPassword?: string; newPassword?: string },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const updateData: any = {};

    // Update name if provided
    if (data.name && data.name.trim()) {
      updateData.name = data.name.trim();
    }

    // Update email if provided
    if (data.email && data.email.trim()) {
      const existingUser = await this.prisma.user.findUnique({ where: { email: data.email } });
      if (existingUser && existingUser.id !== id) {
        throw new BadRequestException('Email already in use');
      }
      updateData.email = data.email.trim();
    }

    // Update password if provided
    if (data.newPassword) {
      if (!data.currentPassword) {
        throw new BadRequestException('Current password is required to set a new password');
      }

      const isPasswordValid = await bcrypt.compare(data.currentPassword, user.password);
      if (!isPasswordValid) {
        throw new BadRequestException('Current password is incorrect');
      }

      updateData.password = await bcrypt.hash(data.newPassword, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      include: { healthCenter: true },
    });
  }

  async updateUser(id: number, data: any) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const updateData: any = { ...data };

    if (data.email) {
      const existingUser = await this.prisma.user.findUnique({ where: { email: data.email } });
      if (existingUser && existingUser.id !== id) {
        throw new BadRequestException('Email already in use');
      }
    }

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      include: { healthCenter: true },
    });
  }

  async deleteUser(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.$transaction(async (tx) => {
      // Handle relations before deleting user
      
      // 1. Delete system logs
      await tx.systemLog.deleteMany({ where: { userId: id } });

      // 2. Handle assessments and their predictions
      // Delete predictions related to assessments of this CHW
      await tx.prediction.deleteMany({
        where: {
          assessment: {
            chwId: id
          }
        }
      });

      // Delete assessments conducted by this CHW
      await tx.assessment.deleteMany({ where: { chwId: id } });

      // 3. Handle children - if the user is a CHW, we delete children assigned to them
      // First delete predictions for those children's assessments
      await tx.prediction.deleteMany({
        where: {
          assessment: {
            child: {
              chwId: id
            }
          }
        }
      });
      // Delete assessments for those children
      await tx.assessment.deleteMany({
        where: {
          child: {
            chwId: id
          }
        }
      });
      // Finally delete the children
      await tx.child.deleteMany({ where: { chwId: id } });

      // Finally delete the user
      return tx.user.delete({
        where: { id },
      });
    });
  }

  async findChwByLocation(district: string, sector: string, cell: string, village: string) {
    const chws = await this.prisma.user.findMany({
      where: {
        role: 'CHW',
        district: district || undefined,
        sector: sector || undefined,
        cell: cell || undefined,
        village: village || undefined,
        status: 'APPROVED', // Only approved CHWs
      },
      select: {
        id: true,
        name: true,
        email: true,
        district: true,
        sector: true,
        cell: true,
        village: true,
        healthCenter: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    return chws;
  }
}
