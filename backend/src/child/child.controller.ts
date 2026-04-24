import { Controller, Get, Post, Body, Param, UseGuards, Req, ParseIntPipe } from '@nestjs/common';
import { ChildService } from './child.service';
import { CreateChildDto } from './dto/create-child.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('child')
@UseGuards(JwtAuthGuard)
export class ChildController {
  constructor(private readonly childService: ChildService) {}

  @Post()
  create(@Body() createChildDto: CreateChildDto, @Req() req) {
    return this.childService.create(createChildDto, req.user.userId, req.user.role);
  }

  @Get()
  findAll(@Req() req) {
    return this.childService.findAll(req.user);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.childService.findOne(id);
  }
}
