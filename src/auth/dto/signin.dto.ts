import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';
import { ValidationMessages } from 'src/common/messages/validation.messages';

export class SigninDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: ValidationMessages.email.invalid })
  email!: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  password!: string;
}
