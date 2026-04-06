import { Controller, Get, Post, Body, Param, UseGuards, Req, ParseIntPipe, Patch } from '@nestjs/common';
import { AssessmentService } from './assessment.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AssessmentStatus } from '@prisma/client';

@Controller('assessment')
@UseGuards(JwtAuthGuard)
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @Post()
  create(@Body() createAssessmentDto: CreateAssessmentDto, @Req() req) {
    return this.assessmentService.create(createAssessmentDto, req.user.userId);
  }

  @Get()
  findAll() {
    return this.assessmentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.assessmentService.findOne(id);
  }

  @Patch(':id/review')
  review(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
    @Req() req,
  ) {
    return this.assessmentService.reviewAssessment(id, status, req.user.userId);
  }
}
