import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  Delete,
  Param,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from 'src/auth/guards/jwt.guard';
import { CurrentUser } from 'src/common/decoratos/validation/current-user.decorator';
import { ResetPasswordVerifyDto } from './dto/reset-password-verify.dto';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Create a new user' })
  @ApiCreatedResponse({
    description: 'User created successfully',
    schema: {
      example: {
        statusCode: 201,
        data: {
          id: 'example-id',
          googleId: null,
          email: 'example@example.com',
          firstName: 'example',
          lastName: 'example',
          phone: '14999999999',
          birthday: '2000-09-15T00:00:00.000Z',
          isVerified: false,
          createdAt: '2026-08-19T20:26:37.369Z',
          updatedAt: '2026-08-19T20:26:37.369Z',
        },
        message: 'Created successfully',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Failed to create user',
    schema: {
      example: {
        statusCode: 409,
        message: 'The email field is already in use',
        error: 'Conflict',
      },
    },
  })
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  // @UseGuards(AuthGuard)
  // @Get()
  // findAll() {
  //   return this.userService.findAll();
  // }

  @ApiOperation({ summary: 'Get the authenticated user profile' })
  @ApiBearerAuth('access-token')
  @ApiOkResponse({
    description: 'User profile retrieved successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Success',
        data: {
          id: '01a033c6-c34e-73a3-8f16-897865a163fd',
          googleId: null,
          email: 'teste@teste.com',
          firstName: 'teste',
          lastName: 'teste',
          phone: '999999999',
          birthday: '2000-09-15T00:00:00.000Z',
          isVerified: false,
          createdAt: '2026-08-24T12:37:39.278Z',
          updatedAt: '2026-08-24T12:37:39.278Z',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid or expired token',
        error: 'Unauthorized',
      },
    },
  })
  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@CurrentUser('sub') id: string) {
    return this.userService.findOne(id);
  }

  @ApiOperation({ summary: 'Update the authenticated user profile' })
  @ApiBearerAuth('access-token')
  @ApiOkResponse({
    description: 'User updated successfully',
    schema: {
      example: {
        statusCode: 200,
        data: {
          id: '01a033c6-c34e-73a3-8f16-897865a163fd',
          googleId: null,
          email: 'teste2@teste.com',
          firstName: 'teste',
          lastName: 'teste',
          phone: '999999999',
          birthday: '2000-09-15T00:00:00.000Z',
          isVerified: false,
          createdAt: '2026-08-24T12:37:39.278Z',
          updatedAt: '2026-08-24T12:44:20.048Z',
        },
        message: 'Success',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Missing or invalid access token',
    schema: {
      example: {
        message: ['Invalid email address'],
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  @UseGuards(AuthGuard)
  @Patch('profile')
  updateProfile(
    @CurrentUser('sub') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(id, updateUserDto);
  }

  @ApiOperation({ summary: 'Delete the authenticated user' })
  @ApiBearerAuth('access-token')
  @ApiOkResponse({
    description: 'Deleted user successfully',
    schema: {
      example: {
        statusCode: 200,
        data: {
          id: '01a033c6-c34e-73a3-8f16-897865a163fd',
          googleId: null,
          email: 'teste2@teste.com',
          firstName: 'teste',
          lastName: 'teste',
          phone: '999999999',
          birthday: '2000-09-15T00:00:00.000Z',
          isVerified: false,
          createdAt: '2026-08-24T12:37:39.278Z',
          updatedAt: '2026-08-24T12:44:20.048Z',
        },
        message: 'Success',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Record not found',
        error: 'Not Found',
      },
    },
  })
  @UseGuards(AuthGuard)
  @Delete('profile')
  deleteProfile(@CurrentUser('sub') id: string) {
    return this.userService.remove(id);
  }

  @ApiOperation({ summary: 'Send a verification email to the current user' })
  @ApiBearerAuth('access-token')
  @ApiOkResponse({
    description: 'Verification email sent',
    schema: {
      example: {
        statusCode: 200,
        data: {
          message: 'Verification email sent',
        },
        message: 'Success',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid or expired token',
        error: 'Unauthorized',
      },
    },
  })
  @UseGuards(AuthGuard)
  @Get('verification-email')
  verificationEmail(@CurrentUser('sub') id: string) {
    return this.userService.sendVerificationEmail(id);
  }

  @ApiOperation({ summary: 'Verify the email with an OTP' })
  @ApiBearerAuth('access-token')
  @ApiOkResponse({
    description: 'Email verified successfully',
    schema: {
      example: {
        statusCode: 201,
        message: 'Created successfully',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @UseGuards(AuthGuard)
  @HttpCode(200)
  @Post('verify-email/:otp')
  async verifyEmail(@CurrentUser('sub') id: string, @Param('otp') otp: string) {
    return await this.userService.verifyEmail(id, otp);
  }

  @ApiOperation({ summary: 'Send a password reset email' })
  @ApiOkResponse({
    description: 'Email sent successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Sucess',
      },
    },
  })
  @HttpCode(200)
  @Post('password-reset')
  async sendPasswordResetEmail(@Body('email') email: string) {
    return this.userService.sendPasswordResetEmail(email);
  }

  @ApiOperation({ summary: 'Verify the OTP and reset the password' })
  @ApiOkResponse({
    description: 'Password reset successful',
    schema: {
      example: {
        statusCode: 200,
        message: 'Password reset successful',
      },
    },
  })
  @HttpCode(200)
  @Post('password-reset/verify')
  async verifyOtpAndResetPassword(@Body() dto: ResetPasswordVerifyDto) {
    await this.userService.verifyOtpAndResetPassword(
      dto.email,
      dto.otp,
      dto.newPassword,
    );
    return { message: 'Password reset successful' };
  }
}
