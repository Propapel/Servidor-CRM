import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { AccessTokenGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) { }

  @UseGuards(AccessTokenGuard)
  @Post('create')
  create(@Body() createMessageDto: CreateMessageDto) {
    return this.messageService.create(createMessageDto);
  }
  @UseGuards(AccessTokenGuard)
  @Get('findAllConversationBySaleExecutive/:id')
  findAllConversationBySaleExecutive(@Param('id', ParseIntPipe) id: number) {
    return this.messageService.findAllMessagesByUserExecutive(id);
  }

  @UseGuards(AccessTokenGuard)
  @Get('findConversationByCustomerId/:id')
  findConversationByCustomerId(@Param('id', ParseIntPipe) id: number) {
    return this.messageService.findAllConversationByCustomerId(id);
  }

  @UseGuards(AccessTokenGuard)
  @Get()
  findAll() {
    return this.messageService.findAll();
  }

  @UseGuards(AccessTokenGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.messageService.findOne(+id);
  }

  @UseGuards(AccessTokenGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMessageDto: UpdateMessageDto) {
    return this.messageService.update(+id, updateMessageDto);
  }

  @UseGuards(AccessTokenGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.messageService.remove(+id);
  }
}
