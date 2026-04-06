import { PartialType } from '@nestjs/mapped-types';
import { CreateHealthCenterDto } from './create-health-center.dto';

export class UpdateHealthCenterDto extends PartialType(CreateHealthCenterDto) {}
