/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SigninDto } from './dto/signin.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ValidationMessages } from 'src/common/messages/validation.messages';
import { CryptoService } from './crypto.service';
import { TokenService } from './token.service';
import { GoogleAuthService } from './google-auth.service';
import { LoginMethod } from '../../generated/prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly cryptoService: CryptoService,
    private readonly googleAuth: GoogleAuthService,
  ) {}

  async signin(signinDto: SigninDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: signinDto.email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException(
        ValidationMessages.sign.invalidCredencial,
      );
    }

    const isValidPassword = await this.cryptoService.comparePassword(
      signinDto.password,
      user.password,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException(
        ValidationMessages.sign.invalidCredencial,
      );
    }

    const tokens = await this.tokenService.generateTokenPair({
      sub: user.id,
      email: user.email,
      method: LoginMethod.PASSWORD,
    });

    await this.prisma.session.upsert({
      where: {
        userId_method: { userId: user.id, method: LoginMethod.PASSWORD },
      },
      create: {
        userId: user.id,
        method: LoginMethod.PASSWORD,
        tokenHash: await this.cryptoService.hashPassword(tokens.refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      update: {
        tokenHash: await this.cryptoService.hashPassword(tokens.refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return tokens;
  }

  async googleLogin(idToken: string) {
    const googleUser = await this.googleAuth.verifyIdToken(idToken);

    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ googleId: googleUser.sub }, { email: googleUser.email }],
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          firstName: googleUser.firstName,
          lastName: googleUser.lastName,
          googleId: googleUser.sub,
          isVerified: true,
        },
      });
    } else if (!user.googleId) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId: googleUser.sub },
      });
    }

    const tokens = await this.tokenService.generateTokenPair({
      sub: user.id,
      email: user.email,
      method: LoginMethod.GOOGLE,
    });

    await this.prisma.session.upsert({
      where: {
        userId_method: { userId: user.id, method: LoginMethod.GOOGLE },
      },
      create: {
        userId: user.id,
        method: LoginMethod.GOOGLE,
        tokenHash: await this.cryptoService.hashPassword(tokens.refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      update: {
        tokenHash: await this.cryptoService.hashPassword(tokens.refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return tokens;
  }

  async refresh(refreshToken: string) {
    const payload = await this.tokenService.verifyRefreshToken(refreshToken);
    const { sub, email, method } = payload;

    const session = await this.prisma.session.findFirst({
      where: {
        userId: sub,
        method,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    const isValid = await this.cryptoService.comparePassword(
      refreshToken,
      session.tokenHash,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.tokenService.generateTokenPair({
      sub,
      email,
      method,
    });

    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        tokenHash: await this.cryptoService.hashPassword(tokens.refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return tokens;
  }

  async logout(userId: string, method: LoginMethod) {
    await this.prisma.session.deleteMany({
      where: { userId, method },
    });
  }
}
