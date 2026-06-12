import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ZernioService } from './zernio.service';
import { ZernioBotService } from './zernio-bot.service';

@Controller('zernio')
export class ZernioController {
  constructor(
    private readonly zernioService: ZernioService,
    private readonly zernioBotService: ZernioBotService
  ) {}

  @Get('profiles')
  async getProfiles() {
    return await this.zernioService.getProfiles();
  }

  @Get('accounts')
  async getAccounts() {
    return await this.zernioService.getAccounts();
  }

  @Post('posts')
  async createPost(
    @Body('content') content: string,
    @Body('platforms') platforms: any[],
    @Body('scheduledFor') scheduledFor?: string,
    @Body('publishNow') publishNow?: boolean
  ) {
    return await this.zernioService.createPost(content, platforms, scheduledFor, publishNow);
  }

  @Get('inbox/conversations')
  async getConversations(@Query('accountId') accountId: string) {
    return await this.zernioService.getConversations(accountId);
  }

  @Get('inbox/conversations/:id/messages')
  async getMessages(@Param('id') id: string, @Query('accountId') accountId: string) {
    return await this.zernioService.getMessages(id, accountId);
  }

  @Post('inbox/conversations/:id/messages')
  async sendMessage(
    @Param('id') id: string,
    @Query('accountId') accountId: string,
    @Body() payload: any
  ) {
    return await this.zernioService.sendMessage(id, accountId, payload);
  }

  @Post('webhooks')
  async handleWebhook(@Body() payload: any, @Query('accountId') accountId: string) {
    console.log('Received Zernio webhook:', payload);
    
    if (payload.event === 'message.received') {
      const data = payload.data || payload.payload || payload;
      const conversationId = data?.conversationId || data?.conversation?.id;
      const text = data?.message?.text || data?.text;
      const finalAccountId = accountId || data?.accountId || payload.accountId;

      if (conversationId && finalAccountId && text) {
        // No esperamos (await) para responder al webhook inmediatamente
        this.zernioBotService.handleIncomingMessage(conversationId, finalAccountId, text).catch(err => {
          console.error('Error en ZernioBotService:', err);
        });
      }
    }
    
    return { received: true };
  }
}
