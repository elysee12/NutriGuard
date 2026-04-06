import { IsNotEmpty, IsString, IsNumber, IsBoolean, IsEnum } from 'class-validator';

export class CreateAssessmentDto {
  @IsNumber()
  @IsNotEmpty()
  childId: number;

  @IsNumber()
  @IsNotEmpty()
  height: number;

  @IsNumber()
  @IsNotEmpty()
  weight: number;

  @IsNumber()
  @IsNotEmpty()
  muac: number;

  @IsString()
  @IsNotEmpty()
  motherEducation: string;

  @IsString()
  @IsNotEmpty()
  caregiverOccupation: string;

  @IsBoolean()
  @IsNotEmpty()
  hasBothParents: boolean;

  @IsBoolean()
  @IsNotEmpty()
  hasRecentIllness: boolean;

  @IsBoolean()
  @IsNotEmpty()
  hasMinimumMealFrequency: boolean;

  @IsBoolean()
  @IsNotEmpty()
  hasExclusiveBF: boolean;

  @IsBoolean()
  @IsNotEmpty()
  hasVUP: boolean;

  @IsBoolean()
  @IsNotEmpty()
  hasHouseholdConflict: boolean;

  @IsBoolean()
  @IsNotEmpty()
  hasSafeWater: boolean;

  @IsBoolean()
  @IsNotEmpty()
  hasHandwashingFacility: boolean;

  @IsBoolean()
  @IsNotEmpty()
  hasToilet: boolean;

  @IsString()
  @IsNotEmpty()
  sex: string; // 'M' or 'F'

  @IsNumber()
  @IsNotEmpty()
  ageDays: number;
}
