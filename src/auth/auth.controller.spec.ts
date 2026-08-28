import { Test, TestingModule } from '@nestjs/testing';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SigninDto } from './dto/signin.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthGuard } from './guards/jwt.guard';
import { GoogleLoginDto } from './dto/google-login.dto';

const mockAuthGuard: CanActivate = {
  canActivate: jest.fn((_context: ExecutionContext) => of(true)),
};

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockTokenPair = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            signin: jest.fn(),
            googleLogin: jest.fn(),
            refresh: jest.fn(),
            logout: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signin', () => {
    it('should delegate to the auth service', async () => {
      const dto: SigninDto = {
        email: 'john@example.com',
        password: 'StrongPass123!',
      };
      jest.spyOn(authService, 'signin').mockResolvedValue(mockTokenPair);

      const result = await controller.signin(dto);

      expect(authService.signin).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockTokenPair);
    });
  });

  describe('googleSignin', () => {
    it('should delegate to the auth service', async () => {
      const dto: GoogleLoginDto = {
        idToken: 'google-id-token',
      };

      jest.spyOn(authService, 'googleLogin').mockResolvedValue(mockTokenPair);

      const result = await controller.googleLogin(dto);

      expect(authService.googleLogin).toHaveBeenCalledWith(dto.idToken);
      expect(result).toEqual(mockTokenPair);
    });
  });
  describe('refresh', () => {
    it('should delegate to the auth service', async () => {
      const dto: RefreshTokenDto = { refreshToken: 'refresh-token' };
      jest.spyOn(authService, 'refresh').mockResolvedValue(mockTokenPair);

      const result = await controller.refresh(dto);

      expect(authService.refresh).toHaveBeenCalledWith(dto.refreshToken);
      expect(result).toEqual(mockTokenPair);
    });
  });

  describe('logout', () => {
    it('should delegate logout with the authenticated user id', async () => {
      const req = {
        user: { sub: 'user-1', email: 'john@example.com', type: 'access' },
      };
      jest.spyOn(authService, 'logout').mockResolvedValue();

      const result = await controller.logout(req as never);

      expect(authService.logout).toHaveBeenCalledWith('user-1');
      expect(result).toBeUndefined();
    });
  });
});
