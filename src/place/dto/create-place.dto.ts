import { ApiProperty } from '@nestjs/swagger';

export class CreatePlaceDto {
  @ApiProperty({ example: 'Copacabana Beach' })
  name!: string;
}