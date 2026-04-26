import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole, UserStatus } from '@prisma/client';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto) {
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

    // Send confirmation email
    await this.mailService.sendRegistrationRequestEmail(email, name);

    return {
      message: 'Registration request submitted. An administrator will review your account.',
      userId: user.id,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { healthCenter: true },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.APPROVED) {
      throw new UnauthorizedException(`Account status: ${user.status}. Please wait for approval.`);
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        healthCenter: user.healthCenter?.name,
        district: user.district,
        sector: user.sector,
        cell: user.cell,
        village: user.village,
      },
    };
  }

  async validateUser(payload: any) {
    return this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { healthCenter: true },
    });
  }
}
