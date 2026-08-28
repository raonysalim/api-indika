import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';

jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: jest.fn(),
      },
    })),
  };
});

interface ResendEmailPayload {
  to: string;
  from: string;
  subject: string;
  html: string;
}

interface MockMailService {
  resend: {
    emails: {
      send: jest.Mock;
    };
  };
  sendEmail: (to: string, subject: string, html: string) => Promise<void>;
}

describe('MailService', () => {
  let service: MailService;
  let configService: ConfigService;
  let mailMock: MockMailService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    mockConfigService.get.mockReturnValueOnce('test-api-key');
    mockConfigService.get.mockReturnValueOnce('noreply@indika.com');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    configService = module.get<ConfigService>(ConfigService);
    mailMock = service as unknown as MockMailService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(configService).toBeDefined();
  });

  describe('sendVerificationEmail', () => {
    it('should send a verification email to the recipient', async () => {
      mailMock.resend.emails.send.mockResolvedValue({ error: null });

      await service.sendVerificationEmail('john@example.com', '123456');

      expect(mockConfigService.get).toHaveBeenCalledWith('RESEND_API_KEY');
      expect(mockConfigService.get).toHaveBeenCalledWith('MAIL_FROM_EMAIL');
      expect(mailMock.resend.emails.send).toHaveBeenCalledTimes(1);
      const sendCalls = mailMock.resend.emails.send.mock
        .calls as unknown as ResendEmailPayload[][];
      const payload = sendCalls[0][0];
      expect(payload.to).toBe('john@example.com');
      expect(payload.from).toBe('noreply@indika.com');
      expect(payload.subject).toBe('Código de Verificação - Indika');
      expect(payload.html).toContain('123456');
      expect(payload.html).toContain('Verificação de E-mail');
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send a password reset email to the recipient', async () => {
      mailMock.resend.emails.send.mockResolvedValue({ error: null });

      await service.sendPasswordResetEmail('john@example.com', '654321');

      expect(mailMock.resend.emails.send).toHaveBeenCalledTimes(1);
      const sendCalls = mailMock.resend.emails.send.mock
        .calls as unknown as ResendEmailPayload[][];
      const payload = sendCalls[0][0];
      expect(payload.to).toBe('john@example.com');
      expect(payload.from).toBe('noreply@indika.com');
      expect(payload.subject).toBe('Redefinição de Senha - Indika');
      expect(payload.html).toContain('654321');
      expect(payload.html).toContain('Redefinição de Senha');
    });
  });

  describe('sendEmail', () => {
    it('should throw InternalServerErrorException when the send fails', async () => {
      mailMock.resend.emails.send.mockResolvedValue({
        error: new Error('API error'),
      });

      await expect(
        mailMock.sendEmail('john@example.com', 'Test Subject', '<p>Test</p>'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
