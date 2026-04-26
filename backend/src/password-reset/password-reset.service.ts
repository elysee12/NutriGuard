import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async requestReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('No user with this email');

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.prisma.passwordReset.create({
      data: { email, otp, expiresAt },
    });

    // Send OTP via email
    await this.mailService.sendOTPEmail(email, otp);

    return { message: 'OTP sent to email' };
  }

  async verifyOtpAndReset(email: string, otp: string, newPassword: string) {
    const record = await this.prisma.passwordReset.findFirst({
      where: { email, otp },
      orderBy: { expiresAt: 'desc' },
    });

    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    // Delete all OTPs for this email
    await this.prisma.passwordReset.deleteMany({ where: { email } });

    return { message: 'Password reset successful' };
  }
}
