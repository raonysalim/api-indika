import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordVerifyDto } from './dto/reset-password-verify.dto';
import { AuthGuard } from 'src/auth/guards/jwt.guard';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';

const mockAuthGuard: CanActivate = {
  canActivate: jest.fn((_context: ExecutionContext) => of(true)),
};

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;

  const mockUser = {
    id: 'user-1',
    googleId: null,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '11999999999',
    birthday: new Date('1990-01-01'),
    password: 'hashed-password',
    isVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            sendVerificationEmail: jest.fn(),
            verifyEmail: jest.fn(),
            sendPasswordResetEmail: jest.fn(),
            verifyOtpAndResetPassword: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a user', async () => {
      const dto: CreateUserDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '11999999999',
        birthday: new Date('1990-01-01'),
        password: 'StrongPass123!',
      };
      jest.spyOn(userService, 'create').mockResolvedValue(mockUser);

      const result = await controller.create(dto);

      expect(userService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('getProfile', () => {
    it('should return the current user profile', async () => {
      jest.spyOn(userService, 'findOne').mockResolvedValue(mockUser);

      const result = await controller.getProfile('user-1');

      expect(userService.findOne).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateProfile', () => {
    it('should update the current user profile', async () => {
      const dto: UpdateUserDto = { firstName: 'Jane' };
      jest.spyOn(userService, 'update').mockResolvedValue(mockUser);

      const result = await controller.updateProfile('user-1', dto);

      expect(userService.update).toHaveBeenCalledWith('user-1', dto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('deleteProfile', () => {
    it('should delete the current user profile', async () => {
      jest.spyOn(userService, 'remove').mockResolvedValue(mockUser);

      const result = await controller.deleteProfile('user-1');

      expect(userService.remove).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockUser);
    });
  });

  describe('verificationEmail', () => {
    it('should send a verification email to the current user', async () => {
      jest
        .spyOn(userService, 'sendVerificationEmail')
        .mockResolvedValue({ message: 'Verification email sent' });

      const result = await controller.verificationEmail('user-1');

      expect(userService.sendVerificationEmail).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({ message: 'Verification email sent' });
    });
  });

  describe('verifyEmail', () => {
    it('should verify the email with the OTP', async () => {
      jest.spyOn(userService, 'verifyEmail').mockResolvedValue(mockUser);

      await controller.verifyEmail('user-1', '123456');

      expect(userService.verifyEmail).toHaveBeenCalledWith('user-1', '123456');
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send a password reset email', async () => {
      jest.spyOn(userService, 'sendPasswordResetEmail').mockResolvedValue();

      const result =
        await controller.sendPasswordResetEmail('john@example.com');

      expect(userService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'john@example.com',
      );
      expect(result).toBeUndefined();
    });
  });

  describe('verifyOtpAndResetPassword', () => {
    it('should reset the password after OTP verification', async () => {
      const dto: ResetPasswordVerifyDto = {
        email: 'john@example.com',
        otp: '123456',
        newPassword: 'NewPass123!',
      };
      jest
        .spyOn(userService, 'verifyOtpAndResetPassword')
        .mockResolvedValue(mockUser);

      const result = await controller.verifyOtpAndResetPassword(dto);

      expect(userService.verifyOtpAndResetPassword).toHaveBeenCalledWith(
        dto.email,
        dto.otp,
        dto.newPassword,
      );
      expect(result).toEqual({ message: 'Password reset successful' });
    });
  });
});
