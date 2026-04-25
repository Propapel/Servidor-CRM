import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);

  onModuleInit() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    if (!admin.apps.length) {
      try {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(
          /\\n/g,
          '\n',
        );

        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey,
          }),
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
