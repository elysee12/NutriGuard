import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { HealthCenterModule } from './health-center/health-center.module';
import { ChildModule } from './child/child.module';
import { AssessmentModule } from './assessment/assessment.module';
import { PredictionModule } from './prediction/prediction.module';
import { ReportModule } from './report/report.module';
import { SystemLogModule } from './system-log/system-log.module';
import { PrismaModule } from './prisma/prisma.module';
import { PasswordResetModule } from './password-reset/password-reset.module';
import { AuthModule } from './auth/auth.module';
import { StatsModule } from './stats/stats.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UserModule,
    HealthCenterModule,
    ChildModule,
    AssessmentModule,
    PredictionModule,
    ReportModule,
    SystemLogModule,
    PasswordResetModule,
    StatsModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
