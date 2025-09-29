import { Injectable } from '@nestjs/common';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Banner } from './entities/banner.entity';
import { Repository } from 'typeorm';
import storage = require('../utils/cloud_storage.js');

@Injectable()
export class BannersService {

  constructor(
    @InjectRepository(Banner)
    private bannerRepository: Repository<Banner>
  ){}

  async create(createBannerDto: CreateBannerDto) {
      const banner = await this.bannerRepository.create(createBannerDto)
      if (createBannerDto.imageUrl != '') {
        const buffer = Buffer.from(createBannerDto.imageUrl, 'base64'); // Asegúrate de que image sea una cadena Base64 válida
        const pathImage = `banner_${Date.now()}`;
        const imageUrl = await storage.uploadFromBuffer(buffer, pathImage);
  
        if (imageUrl) {
          banner.imageUrl = imageUrl; // Actualiza la URL de la imagen en el objeto user
        }
      }
      await this.bannerRepository.save(banner)
  }

  async findAll() {
    const banners = await this.bannerRepository.find()

    return {
      banners: banners
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} banner`;
  }

  update(id: number, updateBannerDto: UpdateBannerDto) {
    return `This action updates a #${id} banner`;
  }

  remove(id: number) {
    return `This action removes a #${id} banner`;
  }
}
