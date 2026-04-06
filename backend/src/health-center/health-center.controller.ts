import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { HealthCenterService } from './health-center.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateHealthCenterDto } from './dto/create-health-center.dto';
import { UpdateHealthCenterDto } from './dto/update-health-center.dto';

@Controller('health-center')
export class HealthCenterController {
  constructor(private readonly healthCenterService: HealthCenterService) {}

  @Get()
  findAll() {
    return this.healthCenterService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.healthCenterService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createHealthCenterDto: CreateHealthCenterDto) {
    return this.healthCenterService.create(createHealthCenterDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateHealthCenterDto: UpdateHealthCenterDto,
  ) {
    return this.healthCenterService.update(id, updateHealthCenterDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.healthCenterService.remove(id);
  }
}
