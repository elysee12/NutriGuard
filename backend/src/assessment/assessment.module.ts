import { Module } from '@nestjs/common';
import { AssessmentService } from './assessment.service';
import { AssessmentController } from './assessment.controller';
import { PredictionModule } from '../prediction/prediction.module';

@Module({
  imports: [PredictionModule],
  controllers: [AssessmentController],
  providers: [AssessmentService],
})
export class AssessmentModule {}
