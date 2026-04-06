import { Controller, Get, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { PredictionService } from './prediction.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('prediction')
@UseGuards(JwtAuthGuard)
export class PredictionController {
  constructor(private readonly predictionService: PredictionService) {}

  @Get()
  findAll() {
    return this.predictionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.predictionService.findOne(id);
  }
}
