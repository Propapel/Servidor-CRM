import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import Zernio from '@zernio/node';

@Injectable()
export class ZernioService implements OnModuleInit {
  private zernioClient: any;
  private readonly logger = new Logger(ZernioService.name);

  onModuleInit() {
    const apiKey = process.env.ZERNIO_API_KEY;
    if (!apiKey || apiKey === 'sk_your_api_key_here') {
      this.logger.warn('ZERNIO_API_KEY is not set or is using the default placeholder. Zernio API will not work until a valid key is provided.');
      // Initialize without key to avoid crashing immediately, but API calls will fail later.
      this.zernioClient = new (Zernio as any)({ apiKey: 'invalid_key' });
      return;
    }

    try {
      this.zernioClient = new (Zernio as any)(); // Automatically picks up ZERNIO_API_KEY from env
      this.logger.log('Zernio client initialized successfully.');
    } catch (error) {
      this.logger.error('Failed to initialize Zernio client', error);
    }
  }

  async getProfiles() {
    try {
      return await this.zernioClient.profiles.listProfiles();
    } catch (error) {
      this.logger.error('Error fetching profiles', error);
      throw error;
    }
  }

  async getAccounts() {
    try {
      return await this.zernioClient.accounts.listAccounts();
    } catch (error) {
      this.logger.error('Error fetching accounts', error);
      throw error;
    }
  }

  async createPost(content: string, platforms: any[], scheduledFor?: string, publishNow: boolean = false) {
    try {
      const payload: any = { content, platforms };
      if (scheduledFor) {
        payload.scheduledFor = scheduledFor;
      }
      if (publishNow) {
        payload.publishNow = publishNow;
      }
      return await this.zernioClient.posts.createPost(payload);
    } catch (error) {
      this.logger.error('Error creating post', error);
      throw error;
    }
  }

  async getConversations(accountId: string) {
    try {
      return await this.zernioClient.messages.listInboxConversations({ query: { accountId } });
    } catch (error) {
      this.logger.error('Error fetching conversations', error);
      throw error;
    }
  }

  async getMessages(conversationId: string, accountId: string) {
    try {
      return await this.zernioClient.messages.getInboxConversationMessages({ path: { conversationId }, query: { accountId } });
    } catch (error) {
      this.logger.error(`Error fetching messages for conversation ${conversationId}`, error);
      throw error;
    }
  }

  async sendMessage(conversationId: string, accountId: string, payload: any) {
    try {
      return await this.zernioClient.messages.sendInboxMessage({ 
        path: { conversationId }, 
        body: { accountId, ...payload } 
      });
    } catch (error) {
      this.logger.error(`Error sending message to conversation ${conversationId}`, error);
      throw error;
    }
  }
}
