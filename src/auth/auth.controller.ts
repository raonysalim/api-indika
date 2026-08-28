import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  Get,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiOkResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';
import { SigninDto } from './dto/signin.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { AuthGuard } from 'src/auth/guards/jwt.guard';

interface AuthRequest extends Request {
  user: JwtPayload;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Login with email and password' })
  @HttpCode(200)
  @ApiOkResponse({
    description: 'Returns a token pair',
    schema: {
      example: {
        statusCode: 200,
        data: {
          accessToken: 'eyJ...',
          refreshToken: 'eyJ...',
        },
        message: 'Success',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Server error',
    schema: {
      example: {
        statusCode: 500,
        message: 'Internal server error',
      },
    },
  })
  @Post('signin')
  signin(@Body() signDto: SigninDto) {
    return this.authService.signin(signDto);
  }

  @ApiOperation({ summary: 'Login with Google ID token' })
  @ApiOkResponse({
    description: 'Returns a token pair',
    schema: {
      example: {
        statusCode: 200,
        data: {
          accessToken: 'eyJ...',
          refreshToken: 'eyJ...',
        },
        message: 'Success',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid Google token' })
  @HttpCode(200)
  @Post('google')
  googleLogin(@Body() googleLoginDto: GoogleLoginDto) {
    return this.authService.googleLogin(googleLoginDto.idToken);
  }

  @ApiOperation({ summary: 'Refresh the access token' })
  @ApiOkResponse({
    description: 'Returns a token pair',
    schema: {
      example: {
        statusCode: 200,
        data: {
          accessToken: 'eyJ...',
          refreshToken: 'eyJ...',
        },
        message: 'Success',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired session' })
  @HttpCode(200)
  @Post('refresh')
  refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refresh(refreshTokenDto.refreshToken);
  }

  @ApiOperation({ summary: 'Logout from all sessions' })
  @ApiBearerAuth('access-token')
  @ApiOkResponse({
    description: 'Logout successful',
    schema: {
      example: {
        statusCode: 200,
        message: 'Success',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  @Get('logout')
  @UseGuards(AuthGuard)
  logout(@Request() req: AuthRequest) {
    const userId = req.user.sub;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const method = req.user.method;
    return this.authService.logout(userId, method);
  }
}
