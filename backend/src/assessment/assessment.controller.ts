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
  findAll(@Req() req) {
    return this.assessmentService.findAll(req.user);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.assessmentService.findOne(id, req.user);
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
