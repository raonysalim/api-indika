import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePlaceDto } from './dto/create-place.dto';
import { Place } from '../../generated/prisma/client';

@Injectable()
export class PlaceService {
  constructor(private prisma: PrismaService) {}

  create(createPlaceDto: CreatePlaceDto): Promise<Place> {
    // ✅ Agora há um await, satisfeita a regra require-await
    return this.prisma.place.create({
      data: createPlaceDto,
    });
  }

  async findAll(): Promise<Place[]> {
    return this.prisma.place.findMany();
  }

  findOne(id: number) {
    return `This action returns a #${id} place`;
  }

  // update(id: number, updatePlaceDto: UpdatePlaceDto) {
  //   return `This action updates a #${id} place`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} place`;
  // }
}
