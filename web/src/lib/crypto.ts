/**
 * Claves de IA cifradas con WebCrypto. La clave de cifrado es AES-GCM NO
 * exportable y vive en IndexedDB: el navegador la usa, pero nadie puede
 * leerla, ni siquiera el código de la página.
 */
import { db } from './db';

const KEY_ID = 'crypto:aes';

async function aesKey(): Promise<CryptoKey> {
  const existing = await db.get<CryptoKey>(KEY_ID);
  if (existing) {
    return existing;
  }
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  await db.set(KEY_ID, key);
  return key;
}

export async function encrypt(text: string): Promise<{ iv: Uint8Array<ArrayBuffer>; data: ArrayBuffer }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aesKey(), new TextEncoder().encode(text));
  return { iv, data };
}

export async function decrypt(box: { iv: Uint8Array<ArrayBuffer>; data: ArrayBuffer }): Promise<string> {
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: box.iv }, await aesKey(), box.data);
  return new TextDecoder().decode(plain);
}
