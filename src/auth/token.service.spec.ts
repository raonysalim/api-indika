import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from './token.service';
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';
import { LoginMethod } from '../../generated/prisma/client';

describe('TokenService', () => {
  let service: TokenService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateAccessToken', () => {
    it('should sign the payload with a 1 day expiry', async () => {
      const payload = { sub: 'user-1', email: 'john@example.com', method: LoginMethod.PASSWORD };
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue('access-token');

      const result = await service.generateAccessToken(payload);

      expect(jwtService.signAsync).toHaveBeenCalledWith(payload, {
        expiresIn: '1d',
      });
      expect(result).toBe('access-token');
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', async () => {
      const payload = { sub: 'user-1', email: 'john@example.com', method: LoginMethod.PASSWORD };

      jest
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.generateTokenPair(payload);

      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(1, payload, {
        expiresIn: '1d',
      });
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        2,
        { ...payload, type: 'refresh' },
        { expiresIn: '7d' },
      );
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });
  });

  describe('verifyToken', () => {
    it('should return the decoded payload for a valid token', async () => {
      const payload: JwtPayload = {
        sub: 'user-1',
        email: 'john@example.com',
        type: 'access',
        method: LoginMethod.PASSWORD,
      };
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);

      const result = await service.verifyToken('valid-token');

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token');
      expect(result).toEqual(payload);
    });

    it('should throw UnauthorizedException for an invalid or expired token', async () => {
      jest
        .spyOn(jwtService, 'verifyAsync')
        .mockRejectedValue(new Error('jwt expired'));

      await expect(service.verifyToken('expired-token')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.verifyToken('expired-token')).rejects.toThrow(
        'Invalid or expired token',
      );
    });
  });

  describe('verifyRefreshToken', () => {
    it('should return the payload for a valid refresh token', async () => {
      const payload: JwtPayload = {
        sub: 'user-1',
        email: 'john@example.com',
        type: 'refresh',
        method: LoginMethod.PASSWORD,
      };
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);

      const result = await service.verifyRefreshToken('refresh-token');

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('refresh-token');
      expect(result).toEqual(payload);
    });

    it('should throw UnauthorizedException when the token type is not refresh', async () => {
      const payload: JwtPayload = {
        sub: 'user-1',
        email: 'john@example.com',
        type: 'access',
        method: LoginMethod.PASSWORD,
      };
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);

      await expect(service.verifyRefreshToken('access-token')).rejects.toThrow(
        'Invalid token type',
      );
    });
  });
});
