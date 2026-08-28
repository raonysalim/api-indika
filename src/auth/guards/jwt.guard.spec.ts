import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './jwt.guard';
import { TokenService } from '../token.service';
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';

function mockRequestWithHeader(headerValue: string | undefined) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: { authorization: headerValue },
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let tokenService: TokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: TokenService,
          useValue: {
            verifyToken: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    tokenService = module.get<TokenService>(TokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow the request and attach the payload for a valid Bearer token', async () => {
    const payload: JwtPayload = {
      sub: 'user-1',
      email: 'john@example.com',
      type: 'access',
      method: 'PASSWORD',
    };
    jest.spyOn(tokenService, 'verifyToken').mockResolvedValue(payload);

    const request = { headers: { authorization: 'Bearer valid-token' } };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(context);

    expect(tokenService.verifyToken).toHaveBeenCalledWith('valid-token');
    expect(request).toMatchObject({ user: payload });
    expect(result).toBe(true);
  });

  it('should throw when no Authorization header is present', async () => {
    const context = mockRequestWithHeader(undefined);

    await expect(guard.canActivate(context)).rejects.toThrow(
      'Access token is required',
    );
    expect(tokenService.verifyToken).not.toHaveBeenCalled();
  });

  it('should throw when the header is not a Bearer token', async () => {
    const context = mockRequestWithHeader('Basic abc123');

    await expect(guard.canActivate(context)).rejects.toThrow(
      'Access token is required',
    );
    expect(tokenService.verifyToken).not.toHaveBeenCalled();
  });

  it('should throw when the token is invalid or expired', async () => {
    jest
      .spyOn(tokenService, 'verifyToken')
      .mockRejectedValue(new UnauthorizedException());

    const context = mockRequestWithHeader('Bearer invalid-token');

    await expect(guard.canActivate(context)).rejects.toThrow(
      'Invalid or expired token',
    );
  });
});
