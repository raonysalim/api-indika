import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { ValidationMessages } from 'src/common/messages/validation.messages';

export class RefreshTokenDto {
  @ApiProperty({ example: 'eyJ...' })
  @IsString()
  @IsNotEmpty({ message: ValidationMessages.token.refreshEmpty })
  refreshToken!: string;
}
