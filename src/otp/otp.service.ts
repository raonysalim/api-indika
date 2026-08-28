import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { OtpType } from '../../generated/prisma/client';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OtpService {
  private readonly minRequestIntervalMinutes = 1;
  private readonly tokenExpirationMinutes = 10;
  private readonly saltRounds = 10;
  private readonly attemptsLimit = 5;

  constructor(private prisma: PrismaService) {}

  async generateOtp(userId: string, type: OtpType, size = 6): Promise<string> {
    const now = new Date();

    const lastOtp = await this.prisma.otpCode.findFirst({
      where: {
        userId,
        type,
      },
    });

    if (
      lastOtp?.updatedAt &&
      now.getTime() - lastOtp.updatedAt.getTime() <
        this.minRequestIntervalMinutes * 60 * 1000
    ) {
      throw new UnprocessableEntityException(
        'Please wait a minute before requesting a new token.',
      );
    }

    const max = Math.pow(10, size);
    const randomNumber = crypto.randomInt(0, max);
    const otp = randomNumber.toString().padStart(size, '0');

    const hashedCode = await bcrypt.hash(otp, this.saltRounds);
    const expiresAt = new Date(
      now.getTime() + this.tokenExpirationMinutes * 60 * 1000,
    );

    await this.prisma.otpCode.upsert({
      where: {
        userId_type: { userId, type },
      },
      create: {
        code: hashedCode,
        type,
        userId,
        expiresAt,
      },
      update: {
        code: hashedCode,
        expiresAt,
        attempts: 0,
        isUsed: false,
      },
    });

    return otp;
  }

  async verifyOtp(userId: string, type: OtpType, code: string): Promise<void> {
    const otpRecord = await this.prisma.otpCode.findUnique({
      where: {
        userId_type: { userId, type },
      },
    });

    if (!otpRecord || otpRecord.attempts >= this.attemptsLimit) {
      throw new UnprocessableEntityException('Invalid or expired token.');
    }

    if (otpRecord.isUsed) {
      throw new UnprocessableEntityException(
        'This token has already been used.',
      );
    }

    if (otpRecord.expiresAt < new Date()) {
      throw new UnprocessableEntityException('Token has expired.');
    }

    const isMatch = await bcrypt.compare(code, otpRecord.code);
    if (!isMatch) {
      await this.prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { attempts: otpRecord.attempts + 1 },
      });
      throw new UnprocessableEntityException('Invalid token.');
    }

    await this.prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });
  }
}
