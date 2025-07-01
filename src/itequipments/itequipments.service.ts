import { Injectable } from '@nestjs/common';
import { CreateItequipmentDto } from './dto/create-itequipment.dto';
import { UpdateItequipmentDto } from './dto/update-itequipment.dto';

@Injectable()
export class ItequipmentsService {
  create(createItequipmentDto: CreateItequipmentDto) {
    return 'This action adds a new itequipment';
  }

  findAll() {
    return `This action returns all itequipments`;
  }

  findOne(id: number) {
    return `This action returns a #${id} itequipment`;
  }

  update(id: number, updateItequipmentDto: UpdateItequipmentDto) {
    return `This action updates a #${id} itequipment`;
  }

  remove(id: number) {
    return `This action removes a #${id} itequipment`;
  }
}
