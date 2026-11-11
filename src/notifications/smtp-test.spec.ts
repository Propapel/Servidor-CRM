import 'reflect-metadata';
import * as net from 'net';
import { encryptSecret } from './crypto.util';
import { NotificationsService } from './notifications.service';

process.env.NOTIFICATIONS_SECRET = 'test-secret';

/** Servidor SMTP mínimo: acepta o rechaza según la opción, para probar la librería real (nodemailer). */
function fakeSmtp(opts: { authCode?: string; mailFromCode?: string }) {
  const received: string[] = [];
  const server = net.createServer((socket) => {
    let inData = false;
    socket.on('error', () => undefined); // la prueba de conexión cierra el socket sin despedirse
    socket.write('220 fake.smtp ESMTP\r\n');
    socket.on('data', (buf) => {
      for (const line of buf.toString().split('\r\n').filter(Boolean)) {
        if (inData) {
          if (line === '.') { inData = false; socket.write('250 2.0.0 OK queued\r\n'); }
          else received.push(line);
          continue;
        }
        const cmd = line.toUpperCase();
        if (cmd.startsWith('EHLO')) socket.write('250-fake.smtp\r\n250 AUTH PLAIN LOGIN\r\n');
        else if (cmd.startsWith('AUTH')) socket.write(`${opts.authCode ?? '235 2.7.0 Authentication successful'}\r\n`);
        else if (cmd.startsWith('MAIL FROM')) socket.write(`${opts.mailFromCode ?? '250 OK'}\r\n`);
        else if (cmd.startsWith('RCPT TO')) socket.write('250 OK\r\n');
        else if (cmd === 'DATA') { inData = true; socket.write('354 go ahead\r\n'); }
        else if (cmd === 'QUIT') { socket.write('221 bye\r\n'); socket.end(); }
        else socket.write('250 OK\r\n');
      }
    });
  });
  return new Promise<{ port: number; received: string[]; close: () => void }>((resolve) =>
    server.listen(0, '127.0.0.1', () => resolve({
      port: (server.address() as net.AddressInfo).port, received, close: () => server.close(),
    })),
  );
}

function serviceFor(host: string, port: number) {
  const config = {
    id: 1, branchId: 1, enabled: true, host, port, secure: false, username: 'avisos@propapel.mx',
    passwordEncrypted: encryptSecret('clave'), fromEmail: 'avisos@propapel.mx', fromName: 'Mesa', replyTo: null,
    updatedAt: new Date(),
  };
  const logs: any[] = [];
  const updates: any[] = [];
  const qb: any = { addSelect: () => qb, where: () => qb, getOne: async () => config };
  const svc = new NotificationsService(
    { createQueryBuilder: () => qb, update: async (_: any, v: any) => updates.push(v) } as any,
    {} as any,
    { insert: async (row: any) => logs.push(row) } as any,
    {} as any,
  );
  return { svc, logs, updates };
}

describe('Prueba SMTP (servidor SMTP real de pruebas + nodemailer real)', () => {
  it('envía correctamente: ok, guarda el resultado y el historial', async () => {
    const smtp = await fakeSmtp({});
    const { svc, logs, updates } = serviceFor('127.0.0.1', smtp.port);
    const r = await svc.testSmtp(1, 'jefe@propapel.mx');
    smtp.close();
    expect(r).toMatchObject({ ok: true, step: 'sent', message: 'Correo de prueba enviado a jefe@propapel.mx' });
    expect(smtp.received.join('\n')).toContain('funciona correctamente');
    expect(updates[0]).toMatchObject({ lastTestOk: true, lastTestError: null });
    expect(logs[0].status).toBe('SENT');
  });

  it('contraseña rechazada: step auth y mensaje claro, sin lanzar', async () => {
    const smtp = await fakeSmtp({ authCode: '535 5.7.3 Authentication unsuccessful' });
    const { svc, logs } = serviceFor('127.0.0.1', smtp.port);
    const r = await svc.testSmtp(1, 'jefe@propapel.mx');
    smtp.close();
    expect(r).toMatchObject({ ok: false, step: 'auth', message: 'Usuario o contraseña del correo incorrectos' });
    expect(r.detail).toContain('535');
    expect(logs[0].status).toBe('FAILED');
  });

  it('remitente no permitido (Office 365 SendAsDenied): explica que use el mismo correo del usuario', async () => {
    const smtp = await fakeSmtp({ mailFromCode: '554 5.2.252 SendAsDenied; avisos@propapel.mx not allowed to send as x' });
    const { svc } = serviceFor('127.0.0.1', smtp.port);
    const r = await svc.testSmtp(1, 'jefe@propapel.mx');
    smtp.close();
    expect(r.ok).toBe(false);
    expect(r.message).toContain('no permite enviar como');
  });

  it('puerto cerrado: falla en el paso de conexión', async () => {
    const { svc } = serviceFor('127.0.0.1', 1);
    const r = await svc.testSmtp(1, 'jefe@propapel.mx');
    expect(r).toMatchObject({ ok: false, step: 'connect' });
    expect(r.message).toContain('127.0.0.1:1');
  });

  it('servidor inexistente: dice que revise el nombre', async () => {
    const { svc } = serviceFor('no-existe.invalid', 587);
    const r = await svc.testSmtp(1, 'jefe@propapel.mx');
    expect(r).toMatchObject({ ok: false, step: 'dns' });
  });
});
