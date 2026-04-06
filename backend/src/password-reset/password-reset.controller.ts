import { Controller, Post, Body } from '@nestjs/common';
import { PasswordResetService } from './password-reset.service';

@Controller('password-reset')
export class PasswordResetController {
  constructor(private readonly passwordResetService: PasswordResetService) {}

  @Post('request')
  requestReset(@Body('email') email: string) {
    return this.passwordResetService.requestReset(email);
  }

  @Post('verify')
  verifyOtpAndReset(
    @Body('email') email: string,
    @Body('otp') otp: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.passwordResetService.verifyOtpAndReset(email, otp, newPassword);
  }
}
