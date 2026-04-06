import { Controller, Get, UseGuards } from '@nestjs/common';
import { SystemLogService } from './system-log.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('system-log')
@UseGuards(JwtAuthGuard)
export class SystemLogController {
  constructor(private readonly systemLogService: SystemLogService) {}

  @Get()
  findAll() {
    return this.systemLogService.findAll();
  }
}
