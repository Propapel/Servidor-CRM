import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { Conversation } from './entities/conversation.entity';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Customer } from '../customers/entity/customer.entity';

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createConversationDto: CreateConversationDto) {
    const customerFound = await this.customerRepository.findOneBy({
      customer_id: createConversationDto.customerId,
    });

    const participanFound = await this.userRepository.findOne({
      where: {
        id: createConversationDto.participantId,
      },
    });

    const conversation = this.conversationRepository.create({
      customer: customerFound,
      ejecutivo: customerFound.user,
      creator: customerFound.user,
      participant: participanFound,
    });

    return await this.conversationRepository.save(conversation);
  }

  async finAllConversationsByUser(userId: number) {
    const conversationFound = await this.conversationRepository.find({
      where: {
        ejecutivo: {
          id: userId,
        },
      },
      relations: ['customer'],
    });

    return {
      conversations: conversationFound,
    };
  }

  async finAllConversationsByManager(userId: number) {
    const conversationFound = await this.conversationRepository.find({
      where: {
        participant: {
          id: userId
        }
      },
      relations: ['customer'],
    });

    return {
      conversations: conversationFound,
    };
  }

  async findConversationById(id: number) {
    const conversationFound = await this.conversationRepository.find({
      where: {
        customer: {
          customer_id: id,
        },
      },
      relations: ['customer'],
    });

    if (!conversationFound) {
      return {
        success: false,
        data: null,
      };
    }

    return {
      success: true,
      data: conversationFound,
    };
  }
  findAll() {
    return `This action returns all conversation`;
  }

  findOne(id: number) {
    return `This action returns a #${id} conversation`;
  }

  update(id: number, updateConversationDto: UpdateConversationDto) {
    return `This action updates a #${id} conversation`;
  }

  remove(id: number) {
    return `This action removes a #${id} conversation`;
  }
}
