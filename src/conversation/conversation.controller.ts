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
import { ConversationService } from './conversation.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { AccessTokenGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('conversation')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) { }

  @UseGuards(AccessTokenGuard)
  @Post('create')
  create(@Body() createConversationDto: CreateConversationDto) {
    return this.conversationService.create(createConversationDto);
  }

  @UseGuards(AccessTokenGuard)
  @Get('findAllConversationsByUserExecutive/:id')
  findAllConversationsByUserExecutive(@Param('id', ParseIntPipe) id: number) {
    return this.conversationService.finAllConversationsByUser(id)
  }

  @UseGuards(AccessTokenGuard)
  @Get('findAllConversationByUserAdminId/:id')
  findAllConversationByUserAdminId(@Param('id', ParseIntPipe) id: number) {
    return this.conversationService.finAllConversationsByManager(id)
  }

  @UseGuards(AccessTokenGuard)
  @Get('findConversationById/:id')
  findConversationById(@Param('id', ParseIntPipe) id: number) {
    return this.conversationService.findConversationById(id)
  }

  @UseGuards(AccessTokenGuard)
  @Get()
  findAll() {
    return this.conversationService.findAll();
  }

  @UseGuards(AccessTokenGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.conversationService.findOne(+id);
  }

  @UseGuards(AccessTokenGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateConversationDto: UpdateConversationDto,
  ) {
    return this.conversationService.update(+id, updateConversationDto);
  }

  @UseGuards(AccessTokenGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.conversationService.remove(+id);
  }
}
