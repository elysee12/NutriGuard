import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole, UserStatus } from '@prisma/client';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto) {
    try {
      const { email, password, name, role, healthCenterName, healthCenterId: dtoHealthCenterId, district, sector, cell, village } = registerDto;

      const existingUser = await this.prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      let healthCenterId: number | null = dtoHealthCenterId || null;
      
      // Fallback to name lookup if ID not provided
      if (!healthCenterId && healthCenterName) {
        const healthCenter = await this.prisma.healthCenter.findUnique({
          where: { name: healthCenterName },
        });
        if (healthCenter) {
          healthCenterId = healthCenter.id;
        }
      }

      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: role as UserRole,
          healthCenterId,
          district,
          sector,
          cell,
          village,
          status: UserStatus.PENDING,
        },
      });

      // Send confirmation email asynchronously (non-blocking)
      this.mailService.sendRegistrationRequestEmail(email, name).catch(err => {
        this.logger.error('Failed to send registration email:', err);
      });

      return {
        message: 'Registration request submitted. An administrator will review your account.',
        userId: user.id,
      };
    } catch (error) {
      this.logger.error('Registration error:', error.stack);
      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    try {
      const { email, password } = loginDto;
      this.logger.log(`Login attempt for email: ${email}`);
      
      const user = await this.prisma.user.findUnique({
        where: { email },
        include: { healthCenter: true },
      });

      if (!user) {
        this.logger.warn(`User not found: ${email}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        this.logger.warn(`Invalid password for user: ${email}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      if (user.status !== UserStatus.APPROVED) {
        this.logger.warn(`User ${email} has status: ${user.status}`);
        throw new UnauthorizedException(`Account status: ${user.status}. Please wait for approval.`);
      }

      const payload = { sub: user.id, email: user.email, role: user.role };
      const token = this.jwtService.sign(payload);
      
      this.logger.log(`Login successful for user: ${email}`);
      
      return {
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          healthCenter: user.healthCenter?.name,
          healthCenterId: user.healthCenterId,
          district: user.district,
          sector: user.sector,
          cell: user.cell,
          village: user.village,
        },
      };
    } catch (error) {
      this.logger.error('Login error:', error.stack);
      throw error;
    }
  }

  async logout(userId: number) {
    // Invalidate session if needed (for future session tracking)
    this.logger.log(`User ${userId} logged out`);
    return { message: 'Logged out successfully' };
  }

  async validateUser(payload: any) {
    return this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { healthCenter: true },
    });
  }
}
