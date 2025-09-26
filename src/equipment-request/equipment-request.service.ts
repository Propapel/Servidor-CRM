import { Injectable } from '@nestjs/common';
import { CreateEquipmentRequestDto } from './dto/create-equipment-request.dto';
import { UpdateEquipmentRequestDto } from './dto/update-equipment-request.dto';

@Injectable()
export class EquipmentRequestService {
  create(createEquipmentRequestDto: CreateEquipmentRequestDto) {
    return 'This action adds a new equipmentRequest';
  }

  findAll() {
    return `This action returns all equipmentRequest`;
  }

  findOne(id: number) {
    return `This action returns a #${id} equipmentRequest`;
  }

  update(id: number, updateEquipmentRequestDto: UpdateEquipmentRequestDto) {
    return `This action updates a #${id} equipmentRequest`;
  }

  remove(id: number) {
    return `This action removes a #${id} equipmentRequest`;
  }
}
