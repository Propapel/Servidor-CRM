import axios from 'axios';
import type { Transporter } from 'nodemailer';

/** Un correo listo para enviar, independiente del proveedor. */
export interface MailEnvelope {
  fromName: string;
  fromEmail: string;
  replyTo?: string | null;
  to: string;
  bcc: string[];
  subject: string;
  html: string;
}

/** SMTP (nodemailer) o API HTTPS (Brevo): el resto del código no sabe cuál es. */
export interface MailSender {
  readonly kind: 'smtp' | 'brevo';
  send(mail: MailEnvelope): Promise<void>;
}

export class SmtpMailSender implements MailSender {
  readonly kind = 'smtp' as const;
  constructor(private readonly transporter: Transporter) {}

  async send(mail: MailEnvelope) {
    await this.transporter.sendMail({
      from: `"${mail.fromName.replace(/"/g, '')}" <${mail.fromEmail}>`,
      replyTo: mail.replyTo ?? undefined,
      to: mail.to,
      bcc: mail.bcc.length ? mail.bcc : undefined,
      subject: mail.subject,
      html: mail.html,
    });
  }
}

/** Error de la API de Brevo con su estado HTTP y código (unauthorized, invalid_parameter, …). */
export class BrevoApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string | null,
  ) {
    super(message);
    this.name = 'BrevoApiError';
  }
}

export const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

/**
 * Envío por la API transaccional de Brevo (HTTPS, puerto 443).
 * Funciona en hostings que bloquean el SMTP saliente, como Railway en el plan Hobby.
 */
export class BrevoMailSender implements MailSender {
  readonly kind = 'brevo' as const;
  constructor(
    private readonly apiKey: string,
    private readonly timeoutMs = 20_000,
    private readonly url = BREVO_API_URL,
  ) {}

  async send(mail: MailEnvelope) {
    try {
      await axios.post(
        this.url,
        {
          sender: { name: mail.fromName, email: mail.fromEmail },
          to: [{ email: mail.to }],
          ...(mail.bcc.length ? { bcc: mail.bcc.map((email) => ({ email })) } : {}),
          ...(mail.replyTo ? { replyTo: { email: mail.replyTo } } : {}),
          subject: mail.subject,
          htmlContent: mail.html,
        },
        {
          headers: { 'api-key': this.apiKey, 'content-type': 'application/json', accept: 'application/json' },
          timeout: this.timeoutMs,
        },
      );
    } catch (e) {
      if (axios.isAxiosError(e)) {
        if (e.response) {
          const data = e.response.data as { message?: string; code?: string } | undefined;
          throw new BrevoApiError(data?.message ?? e.message, e.response.status, data?.code ?? null);
        }
        throw new BrevoApiError(e.code === 'ECONNABORTED' ? 'Brevo tardó demasiado en responder' : e.message, 0, e.code ?? null);
      }
      throw e;
    }
  }
}

/** Mensaje entendible para los errores de Brevo más comunes. */
export function describeBrevoError(e: BrevoApiError, fromEmail?: string): { step: 'auth' | 'send' | 'connect'; message: string } {
  const text = `${e.code ?? ''} ${e.message}`;
  if (e.status === 401 || e.status === 403) {
    if (/ip/i.test(text)) {
      return {
        step: 'auth',
        message: 'Brevo bloqueó la petición por la IP del servidor. En Brevo > Seguridad > IPs autorizadas, desactiva el bloqueo de IPs desconocidas (el servidor no tiene IP fija)',
      };
    }
    return { step: 'auth', message: 'La API key de Brevo no es válida. Genera una en Brevo > SMTP y API > Claves API' };
  }
  if (e.status === 400 && /sender|remitente/i.test(text)) {
    return {
      step: 'send',
      message: `El remitente ${fromEmail ?? ''} no está verificado en Brevo. Agrégalo en Brevo > Remitentes, dominios e IPs > Remitentes y confirma el correo que te llega`.replace('  ', ' '),
    };
  }
  if (e.status === 0) return { step: 'connect', message: `No se pudo conectar con Brevo: ${e.message}` };
  return { step: 'send', message: `Brevo rechazó el envío: ${e.message}` };
}
