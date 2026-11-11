import 'reflect-metadata';
import * as http from 'http';
import { encryptSecret } from './crypto.util';
import { BrevoApiError, BrevoMailSender, describeBrevoError } from './mail-senders';
import { NotificationsService } from './notifications.service';

process.env.NOTIFICATIONS_SECRET = 'test-secret';

/** Servidor local que imita POST /v3/smtp/email de Brevo. */
function fakeBrevo(respond: (body: any, headers: http.IncomingHttpHeaders) => [number, object]) {
  const calls: { body: any; headers: http.IncomingHttpHeaders }[] = [];
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      const body = JSON.parse(raw || '{}');
      calls.push({ body, headers: req.headers });
      const [status, json] = respond(body, req.headers);
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(json));
    });
  });
  return new Promise<{ url: string; calls: typeof calls; close: () => void }>((resolve) =>
    server.listen(0, '127.0.0.1', () => resolve({
      url: `http://127.0.0.1:${(server.address() as any).port}/v3/smtp/email`, calls, close: () => server.close(),
    })),
  );
}

const mail = { fromName: 'Mesa Mérida', fromEmail: 'avisos@gmail.com', replyTo: 'soporte@propapel.mx', to: 'a@x.mx', bcc: ['b@x.mx'], subject: 'S', html: '<p>h</p>' };

describe('BrevoMailSender (HTTP real contra un Brevo local)', () => {
  it('manda api-key, remitente, destinatario, copia oculta y respuesta-a', async () => {
    const brevo = await fakeBrevo(() => [201, { messageId: '<1@brevo>' }]);
    await new BrevoMailSender('xkeysib-123', 5000, brevo.url).send(mail);
    brevo.close();
    const { body, headers } = brevo.calls[0];
    expect(headers['api-key']).toBe('xkeysib-123');
    expect(body).toEqual({
      sender: { name: 'Mesa Mérida', email: 'avisos@gmail.com' },
      to: [{ email: 'a@x.mx' }],
      bcc: [{ email: 'b@x.mx' }],
      replyTo: { email: 'soporte@propapel.mx' },
      subject: 'S',
      htmlContent: '<p>h</p>',
    });
  });

  it('API key inválida -> BrevoApiError 401 con mensaje claro', async () => {
    const brevo = await fakeBrevo(() => [401, { code: 'unauthorized', message: 'Key not found' }]);
    const err = await new BrevoMailSender('mala', 5000, brevo.url).send(mail).catch((e) => e);
    brevo.close();
    expect(err).toBeInstanceOf(BrevoApiError);
    expect(describeBrevoError(err)).toMatchObject({ step: 'auth' });
    expect(describeBrevoError(err).message).toContain('API key de Brevo no es válida');
  });

  it('IP no autorizada -> explica cómo desactivar el bloqueo de IPs', () => {
    const r = describeBrevoError(new BrevoApiError('We have detected you are using an unrecognised IP address 1.2.3.4', 401, 'unauthorized'));
    expect(r.message).toContain('IPs autorizadas');
  });

  it('remitente sin verificar -> dice dónde verificarlo', () => {
    const r = describeBrevoError(new BrevoApiError('Sending has been rejected because the sender you used avisos@gmail.com is not valid. Validate your sender', 400, 'invalid_parameter'), 'avisos@gmail.com');
    expect(r).toMatchObject({ step: 'send' });
    expect(r.message).toContain('no está verificado en Brevo');
  });
});

describe('NotificationsService con proveedor Brevo', () => {
  const brevoConfig = {
    id: 1, branchId: 7, enabled: true, provider: 'brevo', host: '', port: 587, secure: false, username: '',
    passwordEncrypted: null, apiKeyEncrypted: encryptSecret('xkeysib-abc'), fromEmail: 'avisos@gmail.com',
    fromName: 'Mesa Mérida', replyTo: null, updatedAt: new Date(),
  };
  const make = (config: any) => {
    const logs: any[] = [];
    const qb: any = { addSelect: () => qb, where: () => qb, getOne: async () => config };
    const svc = new NotificationsService(
      { createQueryBuilder: () => qb, update: async () => undefined } as any,
      {} as any,
      { insert: async (r: any) => logs.push(r) } as any,
      {} as any,
    );
    return { svc, logs };
  };

  it('la prueba no intenta conexión SMTP y reporta el error de Brevo con paso y detalle', async () => {
    const axios = require('axios');
    const post = jest.spyOn(axios, 'post').mockRejectedValue(Object.assign(new Error('Request failed with status code 401'), {
      isAxiosError: true, response: { status: 401, data: { code: 'unauthorized', message: 'Key not found' } },
    }));
    const { svc, logs } = make(brevoConfig);
    const r = await svc.testSmtp(7, 'jefe@propapel.mx');
    expect(post).toHaveBeenCalledWith('https://api.brevo.com/v3/smtp/email', expect.anything(), expect.objectContaining({
      headers: expect.objectContaining({ 'api-key': 'xkeysib-abc' }),
    }));
    expect(r).toMatchObject({ ok: false, step: 'auth', provider: 'brevo', host: 'api.brevo.com', port: 443 });
    expect(logs[0].status).toBe('FAILED');
    post.mockRestore();
  });

  it('envío de ticket por Brevo: un destinatario visible y el resto en copia oculta', async () => {
    const axios = require('axios');
    const post = jest.spyOn(axios, 'post').mockResolvedValue({ status: 201, data: {} });
    const { svc, logs } = make(brevoConfig);
    const ok = await svc.send({ branchId: 7, event: 'TICKET_CREATED', to: ['a@x.mx', 'b@x.mx'], subject: 'Nuevo ticket', html: '<p/>' });
    expect(ok).toBe(true);
    expect(post.mock.calls[0][1]).toMatchObject({ to: [{ email: 'a@x.mx' }], bcc: [{ email: 'b@x.mx' }], sender: { email: 'avisos@gmail.com' } });
    expect(logs[0]).toMatchObject({ status: 'SENT' });
    post.mockRestore();
  });
});
