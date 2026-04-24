import { Controller, Get, Param, Patch, Body, UseGuards, ParseIntPipe, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserStatus } from '@prisma/client';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Patch(':id/status')
  approveUser(@Param('id', ParseIntPipe) id: number, @Body('status') status: UserStatus) {
    return this.userService.approveUser(id, status);
  }

  @Patch(':id/profile')
  updateProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { name?: string; email?: string; currentPassword?: string; newPassword?: string },
  ) {
    return this.userService.updateProfile(id, data);
  }

  @Get('chw/search')
  findChwByLocation(
    @Query('district') district?: string,
    @Query('sector') sector?: string,
    @Query('cell') cell?: string,
    @Query('village') village?: string,
  ) {
    return this.userService.findChwByLocation(district || '', sector || '', cell || '', village || '');
  }
}
