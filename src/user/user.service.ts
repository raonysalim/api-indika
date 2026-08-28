import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../auth/crypto.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { OtpService } from 'src/otp/otp.service';
import { MailService } from 'src/mail/mail.service';
import { EmailAlreadyVerifiedException } from 'src/common/exceptions/user.exceptions';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private cryptoService: CryptoService,
    private otpService: OtpService,
    private mailService: MailService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await this.cryptoService.hashPassword(
      createUserDto.password,
    );

    return await this.prisma.user.create({
      data: { ...createUserDto, password: hashedPassword },
      omit: { password: true },
    });
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  findOne(id: string) {
    const user = this.prisma.user.findUnique({
      where: { id },
      omit: { password: true },
    });

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const data: Partial<UpdateUserDto> = { ...updateUserDto };

    return this.prisma.user.update({
      where: { id },
      data,
      omit: { password: true },
    });
  }

  remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
      omit: { password: true },
    });
  }

  async sendVerificationEmail(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) return;

    if (user.isVerified) {
      throw new EmailAlreadyVerifiedException();
    }

    const verificationCode = await this.otpService.generateOtp(
      id,
      'EMAIL_VERIFICATION',
    );

    await this.mailService.sendVerificationEmail(user.email, verificationCode);
    return { message: 'Verification email sent' };
  }

  async verifyEmail(id: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (user?.isVerified) {
      throw new EmailAlreadyVerifiedException();
    }
    await this.otpService.verifyOtp(id, 'EMAIL_VERIFICATION', code);
    return this.prisma.user.update({
      where: { id },
      data: { isVerified: true },
      omit: { password: true },
    });
  }
  async sendPasswordResetEmail(email: string) {
    if (!email) throw new BadRequestException('Email is required');
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) return;

    const resetToken = await this.otpService.generateOtp(
      user.id,
      'PASSWORD_RESET',
    );
    await this.mailService.sendPasswordResetEmail(user.email, resetToken);
  }

  async verifyOtpAndResetPassword(
    email: string,
    code: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) return;

    await this.otpService.verifyOtp(user.id, 'PASSWORD_RESET', code);

    const hashedPassword = await this.cryptoService.hashPassword(newPassword);

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
      omit: { password: true },
    });

    await this.prisma.session.deleteMany({
      where: { userId: user.id },
    });
    return updatedUser;
  }
}
