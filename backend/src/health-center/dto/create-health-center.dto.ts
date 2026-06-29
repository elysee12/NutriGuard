import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateHealthCenterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsOptional()
  province?: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsOptional()
  sector?: string;

  @IsString()
  @IsOptional()
  cell?: string;

  @IsString()
  @IsOptional()
  village?: string;
}
