import { UserService } from './user.service';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../auth/crypto.service';
import { OtpService } from 'src/otp/otp.service';
import { MailService } from 'src/mail/mail.service';

const mockUser = {
  id: 'user-1',
  googleId: null,
  email: 'teste@teste.com',
  firstName: 'teste',
  lastName: 'teste',
  phone: '999999999',
  birthday: new Date('2000-09-15T00:00:00.000Z'),
  isVerified: false,
};

describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;
  let cryptoService: CryptoService;
  let otpService: OtpService;
  let mailService: MailService;

  const mockCrypto = {
    hashPassword: jest.fn(),
    comparePassword: jest.fn(),
  };

  const mockOtp = {
    generateOtp: jest.fn(),
    verifyOtp: jest.fn(),
  };

  const mockMail = {
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            session: {
              deleteMany: jest.fn(),
            },
          },
        },
        {
          provide: CryptoService,
          useValue: mockCrypto,
        },
        {
          provide: OtpService,
          useValue: mockOtp,
        },
        {
          provide: MailService,
          useValue: mockMail,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
    cryptoService = module.get<CryptoService>(CryptoService);
    otpService = module.get<OtpService>(OtpService);
    mailService = module.get<MailService>(MailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyEmail', () => {
    it('should verify OTP and mark user as verified', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        isVerified: false,
      });
      (prisma.user.update as jest.Mock).mockResolvedValue({
        ...mockUser,
        isVerified: true,
      });

      const result = await service.verifyEmail('user-1', '123456');

      expect(result).toEqual(
        expect.objectContaining({
          id: 'user-1',
          isVerified: true,
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should find all users', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([mockUser]);

      const result = await service.findAll();

      expect(result).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: 'user-1' })]),
      );
    });
  });
});
