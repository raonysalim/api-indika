import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';
import { LoginMethod } from '../../generated/prisma/client';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Gera um access token (válido por 1 dia)
   */
  async generateAccessToken(
    payload: Omit<JwtPayload, 'type'>,
  ): Promise<string> {
    return this.jwtService.signAsync(payload, {
      expiresIn: '1d',
    });
  }

  /**
   * Gera um refresh token (válido por 7 dias)
   */
  private async generateRefreshToken(
    payload: Omit<JwtPayload, 'type'>,
  ): Promise<string> {
    return this.jwtService.signAsync(
      { ...payload, type: 'refresh' },
      {
        expiresIn: '7d',
      },
    );
  }

  /**
   * Gera um par de tokens (access + refresh)
   */
  async generateTokenPair(
    payload: Omit<JwtPayload, 'type'>,
  ): Promise<TokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken({ ...payload }),
      this.generateRefreshToken(payload),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * Verifica e decodifica um token
   * @throws UnauthorizedException se o token for inválido ou expirado
   */
  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Verifica apenas o refresh token
   */
  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    const payload = await this.verifyToken(token);

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    return payload;
  }
}
