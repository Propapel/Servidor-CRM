import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

/**
 * Cifra secretos (contraseñas SMTP) con AES-256-GCM.
 * Llave: NOTIFICATIONS_SECRET (recomendado) o, si no existe, JWT_ACCESS_SECRET.
 * Si se cambia la llave, hay que volver a capturar las contraseñas.
 */
function key(): Buffer {
  const secret = process.env.NOTIFICATIONS_SECRET || process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error('Falta NOTIFICATIONS_SECRET para cifrar las contraseñas SMTP');
  return createHash('sha256').update(secret).digest();
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ['v1', iv.toString('base64'), tag.toString('base64'), data.toString('base64')].join(':');
}

export function decryptSecret(payload: string): string {
  const [version, iv, tag, data] = payload.split(':');
  if (version !== 'v1' || !iv || !tag || !data) throw new Error('Formato de secreto no válido');
  const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8');
}
