import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '@prisma/client';

@Controller('stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('dashboard')
  async getDashboardStats(@Req() req) {
    const user = req.user;
    if (user.role === UserRole.ADMIN) {
      return this.statsService.getAdminStats();
    } else if (user.role === UserRole.NURSE) {
      return this.statsService.getNurseStats(user.userId);
    } else if (user.role === UserRole.CHW) {
      return this.statsService.getCHWStats(user.userId);
    }
    return null;
  }
}
