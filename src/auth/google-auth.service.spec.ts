import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { GoogleAuthService } from './google-auth.service';

describe('GoogleAuthService', () => {
  let service: GoogleAuthService;
  let configService: ConfigService;
  let verifyIdTokenSpy: jest.SpyInstance;
  let getPayloadSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleAuthService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'GOOGLE_CLIENT_ID':
                  return 'client-id-123';
                case 'GOOGLE_CLIENT_SECRET':
                  return 'client-secret-abc';
                default:
                  return undefined;
              }
            }),
          },
        },
      ],
    }).compile();

    service = module.get<GoogleAuthService>(GoogleAuthService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should read the client id and secret from the config service', () => {
    expect(configService.get).toHaveBeenCalledWith('GOOGLE_CLIENT_ID');
    expect(configService.get).toHaveBeenCalledWith('GOOGLE_CLIENT_SECRET');
  });

  describe('verifyIdToken', () => {
    const makePayload = (overrides: Record<string, unknown> = {}) => ({
      sub: 'google-sub-1',
      email: 'gina@example.com',
      given_name: 'Gina',
      family_name: 'Google',
      ...overrides,
    });

    let ticket: { getPayload: jest.Mock };

    beforeEach(() => {
      ticket = {
        getPayload: jest.fn(),
      };
      getPayloadSpy = ticket.getPayload;
      // Spy on the OAuth2Client prototype so the instance created in the
      // constructor resolves the mocked ticket.
      verifyIdTokenSpy = jest
        .spyOn(OAuth2Client.prototype, 'verifyIdToken')
        .mockResolvedValue(ticket as never) as unknown as jest.SpyInstance;
    });

    it('should return the Google user when the payload has all claims', async () => {
      getPayloadSpy.mockReturnValue(makePayload());

      const result = await service.verifyIdToken('valid-id-token');

      expect(verifyIdTokenSpy).toHaveBeenCalledWith({
        idToken: 'valid-id-token',
        audience: 'client-id-123',
      });
      expect(getPayloadSpy).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        sub: 'google-sub-1',
        email: 'gina@example.com',
        firstName: 'Gina',
        lastName: 'Google',
      });
    });

    it('should fall back to the email prefix when given_name is missing', async () => {
      getPayloadSpy.mockReturnValue(
        makePayload({ given_name: undefined, family_name: undefined }),
      );

      const result = await service.verifyIdToken('valid-id-token');

      expect(result.firstName).toBe('gina');
      expect(result.lastName).toBe('');
    });

    it('should throw when sub is missing', async () => {
      getPayloadSpy.mockReturnValue(makePayload({ sub: undefined }));

      await expect(service.verifyIdToken('valid-id-token')).rejects.toThrow(
        'Missing claims',
      );
    });

    it('should throw when email is missing', async () => {
      getPayloadSpy.mockReturnValue(makePayload({ email: undefined }));

      await expect(service.verifyIdToken('valid-id-token')).rejects.toThrow(
        'Missing claims',
      );
    });

    it('should throw when getPayload returns null', async () => {
      getPayloadSpy.mockReturnValue(null);

      await expect(service.verifyIdToken('valid-id-token')).rejects.toThrow(
        'Missing claims',
      );
    });

    it('should propagate errors from the OAuth2Client when the token is invalid', async () => {
      verifyIdTokenSpy.mockRejectedValue(
        new Error('Invalid token or audience mismatch'),
      );

      await expect(service.verifyIdToken('expired-id-token')).rejects.toThrow(
        'Invalid token or audience mismatch',
      );
    });
  });
});
