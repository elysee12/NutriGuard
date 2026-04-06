import { Module } from '@nestjs/common';
import { HealthCenterService } from './health-center.service';
import { HealthCenterController } from './health-center.controller';

@Module({
  controllers: [HealthCenterController],
  providers: [HealthCenterService],
})
export class HealthCenterModule {}
