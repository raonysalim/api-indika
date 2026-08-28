import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { CryptoService } from './crypto.service';

const mockHmac = {
  update: jest.fn().mockReturnThis(),
  digest: jest.fn().mockReturnValue('peppered-password'),
};

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('crypto', () => ({
  createHmac: jest.fn(() => mockHmac),
}));

describe('CryptoService', () => {
  let service: CryptoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CryptoService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'SALT_ROUNDS') return '10';
              if (key === 'PEPPER_SECRET') return 'pepper-secret';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<CryptoService>(CryptoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hashPassword', () => {
    it('should pepper the password and hash it with bcrypt', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const result = await service.hashPassword('StrongPass123!');

      expect(crypto.createHmac).toHaveBeenCalledWith('sha256', 'pepper-secret');
      expect(mockHmac.update).toHaveBeenCalledWith('StrongPass123!');
      expect(bcrypt.hash).toHaveBeenCalledWith('peppered-password', 10);
      expect(result).toBe('hashed-password');
    });
  });

  describe('comparePassword', () => {
    it('should pepper the candidate password and compare with the stored hash', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.comparePassword(
        'StrongPass123!',
        'hashed-password',
      );

      expect(crypto.createHmac).toHaveBeenCalledWith('sha256', 'pepper-secret');
      expect(mockHmac.update).toHaveBeenCalledWith('StrongPass123!');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'peppered-password',
        'hashed-password',
      );
      expect(result).toBe(true);
    });
  });
});
