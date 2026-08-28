import { IsDate, IsEmail, IsNotEmpty, IsStrongPassword } from 'class-validator';
import { IsOfLegalAge } from '../../common/decoratos/validation/age-validation.decorator';
import { IsPhone } from 'src/common/decoratos/validation/phone.decorator';
import { Type } from 'class-transformer';
import { IsCpf } from '../decorator/validation/is-cpf.decorator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'João' })
  @IsNotEmpty({ message: 'First name is required' })
  firstName!: string;

  @ApiProperty({ example: 'Silva' })
  @IsNotEmpty({ message: 'Last name is required' })
  lastName!: string;

  @ApiProperty({ example: 'example@example.com' })
  @IsEmail({}, { message: 'Invalid email address' })
  email!: string;

  @ApiProperty({ example: '14999999999' })
  @IsPhone()
  phone!: string;

  @ApiProperty()
  @IsDate()
  @Type(() => Date)
  @IsOfLegalAge()
  birthday!: Date;

  @ApiProperty()
  @IsCpf({ message: 'Invalid CPF' })
  cpf?: string;

  @ApiProperty({ example: 'Password123!' })
  @IsStrongPassword()
  password!: string;
}
