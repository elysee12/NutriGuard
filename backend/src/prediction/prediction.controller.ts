import { Controller, Get, Param, UseGuards, ParseIntPipe, Req } from '@nestjs/common';
import { PredictionService } from './prediction.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('prediction')
@UseGuards(JwtAuthGuard)
export class PredictionController {
  constructor(private readonly predictionService: PredictionService) {}

  @Get()
  findAll(@Req() req) {
    return this.predictionService.findAll(req.user);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.predictionService.findOne(id, req.user);
  }
}
