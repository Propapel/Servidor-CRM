import { Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { Conversation } from '../conversation/entities/conversation.entity';
import { Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Message } from './entities/message.entity';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  async findAllConversationByCustomerId(id: number) {
    const conversationFound = this.conversationRepository.findOne({
      where: {
        id: id,
      },
    });

    return (await conversationFound).messages;
  }

  async findAllMessagesByUserExecutive(id: number) {
    const conversationFounds = await this.conversationRepository.find({
      where: {
        ejecutivo: {
          id: id,
        },
      },
      relations: ['messages'],
    });
    return conversationFounds;
  }

  async findConversationById(id: number) {
    const conversationFound = await this.conversationRepository.findOne({
      where: {
        id: id,
      },
    });

    return conversationFound;
  }

  async create(createMessageDto: CreateMessageDto) {
    const conversationFound = await this.conversationRepository.findOne({
      where: {
        id: createMessageDto.conversationId,
      },
    });

    const userFound = await this.userRepository.findOne({
      where: {
        id: createMessageDto.userSenderId,
      },
    });

    const messageCreate = this.messageRepository.create({
      sender: userFound,
      conversation: conversationFound,
      content: createMessageDto.content,
      isRead: createMessageDto.isRead,
    });

    const createdMessageResponse =
      await this.messageRepository.save(messageCreate);
    return {
      content: createdMessageResponse.content,
      id: createdMessageResponse.id,
      sentAt: createdMessageResponse.sentAt,
      isRead: createdMessageResponse.isRead,
      sender: createdMessageResponse.sender,
    };
  }

  async markMessagesAsRead(
    conversationId: number,
    userId: number,
  ): Promise<Message[]> {
    const unreadMessages = await this.messageRepository.find({
      where: {
        conversation: { id: conversationId },
        sender: { id: Not(userId) }, // no marcar como leído los mensajes propios
        isRead: false,
      },
      relations: ['conversation', 'sender'],
    });

    for (const message of unreadMessages) {
      message.isRead = true;
    }

    return this.messageRepository.save(unreadMessages);
  }

  findAll() {
    return `This action returns all message`;
  }

  findOne(id: number) {
    return `This action returns a #${id} message`;
  }

  update(id: number, updateMessageDto: UpdateMessageDto) {
    return `This action updates a #${id} message`;
  }

  remove(id: number) {
    return `This action removes a #${id} message`;
  }
}
