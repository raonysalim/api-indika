import { Test, TestingModule } from '@nestjs/testing';
import { UnprocessableEntityException } from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { OtpService } from './otp.service';
import { PrismaService } from '../prisma/prisma.service';
import { OtpType } from '../../generated/prisma/client';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('crypto', () => ({
  randomInt: jest.fn(),
}));

describe('OtpService', () => {
  let service: OtpService;
  let prisma: PrismaService;

  const type: OtpType = 'EMAIL_VERIFICATION';

  const mockOtpCode = {
    id: 'otp-1',
    code: 'hashed-code',
    type,
    userId: 'user-1',
    attempts: 0,
    isUsed: false,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        {
          provide: PrismaService,
          useValue: {
            otpCode: {
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              upsert: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);
    prisma = module.get<PrismaService>(PrismaService);

    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-code');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (crypto.randomInt as jest.Mock).mockReturnValue(123456);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateOtp', () => {
    it('should throw when a token was requested less than a minute ago', async () => {
      jest.spyOn(prisma.otpCode, 'findFirst').mockResolvedValue(mockOtpCode);

      await expect(service.generateOtp('user-1', type)).rejects.toThrow(
        UnprocessableEntityException,
      );
      expect(prisma.otpCode.upsert).not.toHaveBeenCalled();
    });

    it('should generate, hash and persist a new OTP', async () => {
      jest.spyOn(prisma.otpCode, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.otpCode, 'upsert').mockResolvedValue(mockOtpCode);

      const result = await service.generateOtp('user-1', type);

      expect(bcrypt.hash).toHaveBeenCalledWith('123456', 10);
      expect(prisma.otpCode.upsert).toHaveBeenCalledTimes(1);
      type UpsertArg = {
        where: { userId_type: { userId: string; type: OtpType } };
        create: {
          code: string;
          type: OtpType;
          userId: string;
          expiresAt: Date;
        };
        update: {
          code: string;
          attempts: number;
          isUsed: boolean;
          expiresAt: Date;
        };
      };
      const arg: UpsertArg = (
        (prisma.otpCode.upsert as jest.Mock).mock.calls as [UpsertArg][]
      )[0][0];
      expect(arg.where).toEqual({
        userId_type: { userId: 'user-1', type },
      });
      expect(arg.create).toMatchObject({
        code: 'hashed-code',
        type,
        userId: 'user-1',
      });
      expect(arg.create.expiresAt).toBeInstanceOf(Date);
      expect(arg.update).toMatchObject({
        code: 'hashed-code',
        attempts: 0,
        isUsed: false,
      });
      expect(arg.update.expiresAt).toBeInstanceOf(Date);
      expect(result).toBe('123456');
    });

    it('should respect a custom size', async () => {
      jest.spyOn(prisma.otpCode, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.otpCode, 'upsert').mockResolvedValue(mockOtpCode);
      (crypto.randomInt as jest.Mock).mockReturnValue(42);

      const result = await service.generateOtp('user-1', type, 8);

      expect(crypto.randomInt).toHaveBeenCalledWith(0, Math.pow(10, 8));
      expect(result).toBe('00000042');
    });
  });

  describe('verifyOtp', () => {
    it('should throw when no record exists for the user and type', async () => {
      jest.spyOn(prisma.otpCode, 'findUnique').mockResolvedValue(null);

      await expect(service.verifyOtp('user-1', type, '123456')).rejects.toThrow(
        UnprocessableEntityException,
      );
      expect(prisma.otpCode.update).not.toHaveBeenCalled();
    });

    it('should throw when the attempt limit has been reached', async () => {
      jest
        .spyOn(prisma.otpCode, 'findUnique')
        .mockResolvedValue({ ...mockOtpCode, attempts: 5 });

      await expect(service.verifyOtp('user-1', type, '123456')).rejects.toThrow(
        UnprocessableEntityException,
      );
      expect(prisma.otpCode.update).not.toHaveBeenCalled();
    });

    it('should throw when the token has already been used', async () => {
      jest
        .spyOn(prisma.otpCode, 'findUnique')
        .mockResolvedValue({ ...mockOtpCode, isUsed: true });

      await expect(service.verifyOtp('user-1', type, '123456')).rejects.toThrow(
        UnprocessableEntityException,
      );
      expect(prisma.otpCode.update).not.toHaveBeenCalled();
    });

    it('should throw when the token has expired', async () => {
      jest.spyOn(prisma.otpCode, 'findUnique').mockResolvedValue({
        ...mockOtpCode,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(service.verifyOtp('user-1', type, '123456')).rejects.toThrow(
        UnprocessableEntityException,
      );
      expect(prisma.otpCode.update).not.toHaveBeenCalled();
    });

    it('should increment attempts and throw when the code does not match', async () => {
      jest.spyOn(prisma.otpCode, 'findUnique').mockResolvedValue(mockOtpCode);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.verifyOtp('user-1', type, 'wrong-code'),
      ).rejects.toThrow(UnprocessableEntityException);

      expect(bcrypt.compare).toHaveBeenCalledWith('wrong-code', 'hashed-code');
      expect(prisma.otpCode.update).toHaveBeenCalledWith({
        where: { id: 'otp-1' },
        data: { attempts: 1 },
      });
    });

    it('should mark the token as used when the code matches', async () => {
      jest.spyOn(prisma.otpCode, 'findUnique').mockResolvedValue(mockOtpCode);
      jest.spyOn(prisma.otpCode, 'update').mockResolvedValue(mockOtpCode);

      await service.verifyOtp('user-1', type, '123456');

      expect(bcrypt.compare).toHaveBeenCalledWith('123456', 'hashed-code');
      expect(prisma.otpCode.update).toHaveBeenCalledWith({
        where: { id: 'otp-1' },
        data: { isUsed: true },
      });
    });
  });
});
