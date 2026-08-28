import {
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { IsOfLegalAge } from '../../common/decoratos/validation/age-validation.decorator';
import { IsPhone } from '../../common/decoratos/validation/phone.decorator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'User first name', example: 'John' })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName?: string;

  @ApiPropertyOptional({ description: 'User last name' })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  lastName?: string;

  @ApiPropertyOptional({ description: 'User email' })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address' })
  email?: string;

  @ApiPropertyOptional({ description: 'User phone number' })
  @IsOptional()
  @IsPhone()
  phone?: string;

  @ApiPropertyOptional({ description: 'User birthday' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @IsOfLegalAge()
  birthday?: Date;

  // @ApiPropertyOptional({ description: 'User CPF' })
  // @IsOptional()
  // @IsCpf({ message: 'Invalid CPF' })
  // cpf?: string;
}
