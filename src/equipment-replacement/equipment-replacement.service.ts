import { Injectable } from '@nestjs/common';
import { CreateEquipmentReplacementDto } from './dto/create-equipment-replacement.dto';
import { UpdateEquipmentReplacementDto } from './dto/update-equipment-replacement.dto';

@Injectable()
export class EquipmentReplacementService {
  create(createEquipmentReplacementDto: CreateEquipmentReplacementDto) {
    return 'This action adds a new equipmentReplacement';
  }

  findAll() {
    return `This action returns all equipmentReplacement`;
  }

  findOne(id: number) {
    return `This action returns a #${id} equipmentReplacement`;
  }

  update(id: number, updateEquipmentReplacementDto: UpdateEquipmentReplacementDto) {
    return `This action updates a #${id} equipmentReplacement`;
  }

  remove(id: number) {
    return `This action removes a #${id} equipmentReplacement`;
  }
}
