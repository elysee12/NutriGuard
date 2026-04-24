import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

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

    return this.prisma.user.update({
      where: { id },
      data: { status },
    });
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
