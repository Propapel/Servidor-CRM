import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as path from 'path';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);

  onModuleInit() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    if (!admin.apps.length) {
      try {
        const serviceAccountPath = path.resolve(
          process.cwd(),
          'serviceAccountKey.json',
        );
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountPath),
        });
        this.logger.log('Firebase Admin SDK initialized successfully');
      } catch (error) {
        this.logger.error('Error initializing Firebase Admin SDK', error);
      }
    }
  }

  getAuth() {
    return admin.auth();
  }

  getMessaging() {
    return admin.messaging();
  }
  
  async sendPushNotification(token: string, title: string, body: string, data?: { [key: string]: string }) {
    try {
      const message = {
        notification: {
          title,
          body,
        },
        data: data || {},
        token: token,
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`Successfully sent message: ${response}`);
      return response;
    } catch (error) {
      this.logger.error(`Error sending message: ${error}`);
      throw error;
    }
  }

  async sendMulticastNotification(tokens: string[], title: string, body: string, data?: { [key: string]: string }) {
    try {
      const message = {
        notification: {
          title,
          body,
        },
        data: data || {},
        tokens: tokens,
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      this.logger.log(`Successfully sent multicast message. Success count: ${response.successCount}`);
      return response;
    } catch (error) {
      this.logger.error(`Error sending multicast message: ${error}`);
      throw error;
    }
  }
}
