import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { alertReminderDto } from '../dto/alert_reminder.dto';
import HTML_TEMPLATE from './mail_body';
import HTML_TEMPLATE_TOMORROW from './mail_body_tomorrow';
import HTML_TEMPLATE_IN_ONE_HOUR from './mail_body_in_one_hour';
import { NotifityAlertAssignedCustomer } from './notifityAlertAssignedCustomer.dto';
import HTML_ASSING_USER_ALERT from './mail_body_assigned_user';
import HTML_TEMPLATE_PROGRESS from './mail_progress_executive';
import { MailProgressExecutiveDto } from '../dto/mailProgressExecutiveDto';
import HTML_CREATED_REPORT from './mail_body_created_report';
import HTML_TECHNICAL_ASSING_REPORT from './mail_body_assigned_technical';
import HTML_TECHNICAL_CLOSE_TICKET from './mail_body_close_ticket';

@Injectable()
export class MailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT),
      secure: process.env.MAIL_SECURE === 'true',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async sendTestEmail() {
    const info = await this.transporter.sendMail({
      from: `"Test App" <${process.env.MAIL_USER}>`,
      to: 'soportesai2@propapel.com.mx',
      subject: 'Correo de prueba',
      text: '¡Hola! Este es un correo de prueba enviado desde Nodemailer.',
    });

    console.log('Correo enviado: %s', info.messageId);
  }

  async notifityNewAssigmentLead(
    notifityAlertAssignedCustomer: NotifityAlertAssignedCustomer,
  ) {
    const mailOptions = {
      from:  `"CRM Propapel" <${process.env.MAIL_USER}>`,
      to: notifityAlertAssignedCustomer.emailUserAssignment,
      subject: 'Asignación de cliente🧍‍♂️',
      html: HTML_ASSING_USER_ALERT(
        notifityAlertAssignedCustomer.customer,
        notifityAlertAssignedCustomer.user,
      ),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(
        `Correo de alerta enviado a ${notifityAlertAssignedCustomer.emailUserAssignment}}`,
      );
    } catch (error) {
      console.error('Error al enviar el correo de alerta:', error);
    }
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const resetUrl = `http://3.144.8.170:3002`;
    const mailOptions = {
      from: 'tu-correo@gmail.com',
      to: to,
      subject: 'Restablecimiento de contraseña',
      text: `Haz clic en el siguiente enlace para restablecer tu contraseña: ${resetUrl}`,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async closeTicketEmail(
    userCreatedReport: string,
    id: number,
    email: string,
    fecha: string,
    ubicacion: string,
    falla: string,
    technicalName: string,
    fechaResolve: string,
    dias: string,
    ratingToken: string
  ) {
    const mailOptions = {
      from: `"HELP DESK Propapel" <${process.env.MAIL_USER}>`,
      to: email,
      subject: `Ticket #${id}: ${falla}`,
      html: HTML_TECHNICAL_CLOSE_TICKET(
        userCreatedReport,
        id,
        fecha,
        ubicacion,
        falla,
        technicalName,
        fechaResolve,
        dias,
        ratingToken
      ),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Correo de alerta enviado a ${email}`);
    } catch (error) {
      console.error('Error al enviar el correo de alerta:', error);
    }
  }

   async sendEmailTechnicalAssignReport(
    userCreatedReport: string,
    id: number,
    email: string,
    fecha: string,
    ubicacion: string,
    falla: string,
    technicalName: string
  ) {
    const mailOptions = {
      from: `"HELP DESK Propapel" <${process.env.MAIL_USER}>`,
      to: email,
      subject: `Ticket #${id}: ${falla}`,
      html: HTML_TECHNICAL_ASSING_REPORT(
        userCreatedReport,
        id,
        fecha,
        ubicacion,
        falla,
        technicalName,
      ),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Correo de alerta enviado a ${email}`);
    } catch (error) {
      console.error('Error al enviar el correo de alerta:', error);
    }
  }

  async sendEmailCreatedReport(
    userCreatedReport: string,
    id: number,
    email: string,
    fecha: string,
    ubicacion: string,
    falla: string
  ) {
    const mailOptions = {
      from: `"HELP DESK Propapel" <${process.env.MAIL_USER}>`,
      to: email,
      subject: `Ticket #${id}: ${falla}`,
      html: HTML_CREATED_REPORT(
        userCreatedReport,
        id,
        fecha,
        ubicacion,
        falla,
      ),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Correo de alerta enviado a ${email}`);
    } catch (error) {
      console.error('Error al enviar el correo de alerta:', error);
    }
  }


  async sendProgressExecutive(progressExecutive: MailProgressExecutiveDto) {
    const mailOptions = {
      from: `"CRM Propapel" <${process.env.MAIL_USER}>`,
      to: progressExecutive.email,
      subject: 'Progreso',
      html: HTML_TEMPLATE_PROGRESS(
        progressExecutive.leadTotal,
        progressExecutive.desarrolloLeads,
        progressExecutive.recuperacionLeads,
        progressExecutive.userName,
        progressExecutive.newLeads,
        progressExecutive.reminderTotal,
        progressExecutive.logoUrl,
      ),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Correo de alerta enviado a ${progressExecutive.email}`);
    } catch (error) {
      console.error('Error al enviar el correo de alerta:', error);
    }
  }

  async sendAlertEmail(alertReminder: alertReminderDto) {
    const mailOptions = {
      from: `"CRM Propapel" <${process.env.MAIL_USER}>`,
      to: alertReminder.email,
      subject: 'Recordatorio de cita 🧍‍♂️🔔',
      html: HTML_TEMPLATE(
        alertReminder.client,
        alertReminder.date,
        alertReminder.time,
        alertReminder.direcction,
        alertReminder.user,
        alertReminder.description,
      ),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Correo de alerta enviado a ${alertReminder.email}`);
    } catch (error) {
      console.error('Error al enviar el correo de alerta:', error);
    }
  }
}

/*
async sendAlertEmailTommorrow(alertReminder: alertReminderDto) {
      const mailOptions = {
        from: 'crm-propapel@propapel.com.mx',
        to: alertReminder.email,
        subject: 'Recordatorio de cita 🧍‍♂️🔔',
        html: HTML_TEMPLATE_TOMORROW(alertReminder.client, alertReminder.date,alertReminder.time, alertReminder.direcction, alertReminder.user),
      };

      try {
          await this.transporter.sendMail(mailOptions);
          console.log(`Correo de alerta enviado a ${alertReminder.email}`);
      } catch (error) {
          console.error("Error al enviar el correo de alerta:", error);
      }
  }
  async sendAlertEmailInOneHour(alertReminder: alertReminderDto) {
    const mailOptions = {
      from: 'crm-propapel@propapel.com.mx',
      to: alertReminder.email,
      subject: 'Recordatorio de cita 🧍‍♂️🔔',
      html: HTML_TEMPLATE_IN_ONE_HOUR(alertReminder.client, alertReminder.date,alertReminder.time, alertReminder.direcction, alertReminder.user),
    };

    try {
        await this.transporter.sendMail(mailOptions);
        console.log(`Correo de alerta enviado a ${alertReminder.email}`);
    } catch (error) {
        console.error("Error al enviar el correo de alerta:", error);
    }
}
async sendAlertEmail(alertReminder: alertReminderDto) {
    const mailOptions = {
        from: 'crm-propapel@propapel.com.mx',
        to: alertReminder.email,
        subject: '⚠️ Recordatorio de cita',
        text: `Haz programado una cita con el cliente: ${alertReminder.client} a las ${alertReminder.time}\n\n` +
              `--------------------------------------------\n` +
              `ServiceDesk | Departamento de T.I. | Área de Soporte Técnico.\n` +
              `© Royal Resorts 2021. All rights reserved.`
    };

    try {
        await this.transporter.sendMail(mailOptions);
        console.log(`Correo de alerta enviado a ${alertReminder.email}`);
    } catch (error) {
        console.error("Error al enviar el correo de alerta:", error);
    }
}

*/
