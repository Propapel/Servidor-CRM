import { Inject, Injectable } from '@nestjs/common';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from 'src/customers/entity/customer.entity';
import { Repository } from 'typeorm';
import { Activity } from './entities/activity.entity';
import storage = require('../utils/cloud_storage.js');

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Activity)
    private activityRepository: Repository<Activity>,
  ) {}

  async create(createActivityDto: CreateActivityDto): Promise<Activity> {
    const customer = await this.customerRepository.findOne({
      where: { customer_id: createActivityDto.customerId },
    });
  
    if (!customer) {
      throw new Error('Customer not found');
    }

    const newListFiles = [];

    //Upload files
     if (
      createActivityDto.attachments &&
      createActivityDto.attachments.length > 0
    ) {
      for (let i = 0; i < createActivityDto.attachments.length; i++) {
        const attachment = createActivityDto.attachments[i];
        const buffer = Buffer.from(attachment, 'base64');
        const pathFile = `fileActivity${createActivityDto.title}_${Date.now()}`;
        const fileUrl = await storage(buffer, pathFile, 'application/pdf')
        if(fileUrl){
           newListFiles.push(fileUrl)
        }
      }
    }
    
  
    const activity = this.activityRepository.create({
      customer: customer,
      type: createActivityDto.type,
      title: createActivityDto.title,
      description: createActivityDto.description,
      startDate: createActivityDto.startDate ? new Date(createActivityDto.startDate) : null,
      endDate: createActivityDto.endDate ? new Date(createActivityDto.endDate) : null,
      reminder: createActivityDto.reminder,
      reminderDate: createActivityDto.reminderDate ? new Date(createActivityDto.reminderDate) : null,
      status: createActivityDto.status,
      priority: createActivityDto.priority,
      notes: createActivityDto.notes,
      isPrivate: createActivityDto.isPrivate ?? false,
      createdBy: customer.user,
      updatedBy: customer.user,
      category: createActivityDto.category,
      attachments: newListFiles
    });
  
    return await this.activityRepository.save(activity);
  }
  

  findAll() {
    return `This action returns all activity`;
  }

  findOne(id: number) {
    return `This action returns a #${id} activity`;
  }

  update(id: number, updateActivityDto: UpdateActivityDto) {
    return `This action updates a #${id} activity`;
  }
  

  remove(id: number) {
    return `This action removes a #${id} activity`;
  }
}
