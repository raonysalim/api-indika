import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsStrongPassword, Length } from 'class-validator';

export class ResetPasswordVerifyDto {
  @ApiProperty({ example: 'NewStrongPass123!' })
  @IsStrongPassword()
  newPassword!: string;

  @ApiProperty({ example: '123456' })
  @Length(6, 6, { message: 'OTP must be exactly 6 characters' })
  otp!: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Invalid email address' })
  email!: string;
}
