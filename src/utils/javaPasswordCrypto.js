const utf8 = new TextEncoder();
const MAGIC = 0x43545256; // CTRV
const VERSION = 1;
const NONCE_BYTES = 12;
const TAG_BITS = 128;
const NO_DATE = -(1n << 63n);
export const KDF_ALGORITHMS = ['PBKDF2_HMAC_SHA1', 'PBKDF2_HMAC_SHA256', 'PBKDF2_HMAC_SHA512'];
const WEB_CRYPTO_HASH = {
  PBKDF2_HMAC_SHA1: 'SHA-1',
  PBKDF2_HMAC_SHA256: 'SHA-256',
  PBKDF2_HMAC_SHA512: 'SHA-512',
};

function webCrypto() {
  const api = globalThis.crypto;
  if (!api?.subtle || !api?.getRandomValues) {
    throw new Error('Web Crypto is unavailable. Open CodeTrove over HTTPS or localhost in a modern browser.');
  }
  return api;
}

export function bytesToBase64(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function base64ToBytes(value) {
  const input = String(value).trim();
  if (!input || !/^[A-Za-z0-9+/]*={0,2}$/.test(input) || input.includes('=') && input.length % 4 !== 0) {
    throw new Error('Enter a valid standard Base64 value.');
  }
  const unpadded = input.replace(/=+$/, '');
  if (unpadded.length % 4 === 1) throw new Error('Enter a valid standard Base64 value.');
  const normalized = unpadded + '='.repeat((4 - (unpadded.length % 4)) % 4);
  const binary = atob(normalized);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  if (bytesToBase64(bytes).replace(/=+$/, '') !== unpadded) throw new Error('Enter a valid standard Base64 value.');
  return bytes;
}

function decodeJavaSalt(saltText) {
  const value = String(saltText ?? '');
  if (!value) throw new Error('Enter a salt.');
  try {
    return base64ToBytes(value);
  } catch {
    try {
      const urlSafe = value.replace(/-/g, '+').replace(/_/g, '/');
      return base64ToBytes(urlSafe);
    } catch {
      // The supplied Java implementation falls back to String.getBytes(). On
      // modern JVMs this is UTF-8; browsers use the same encoding here.
      return utf8.encode(value);
    }
  }
}

function randomBytes(length) {
  return webCrypto().getRandomValues(new Uint8Array(length));
}

function validateKeyLength(bits) {
  const length = Number(bits);
  if (![128, 192, 256].includes(length)) throw new Error('AES key length must be 128, 192, or 256 bits.');
  return length;
}

function validateIterations(iterations) {
  const value = Number(iterations);
  if (!Number.isInteger(value) || value < 1 || value > 10_000_000) {
    throw new Error('PBKDF2 iterations must be an integer from 1 to 10,000,000.');
  }
  return value;
}

function getHash(algorithm) {
  const hash = WEB_CRYPTO_HASH[algorithm];
  if (!hash) throw new Error('Choose a supported PBKDF2 algorithm.');
  return hash;
}

async function deriveAesKey(secret, salt, algorithm, iterations, keyLengthBits, usages) {
  if (!String(secret)) throw new Error('Enter an encryption secret or generate one.');
  const keyLength = validateKeyLength(keyLengthBits);
  const count = validateIterations(iterations);
  const hash = getHash(algorithm);
  const material = await webCrypto().subtle.importKey('raw', utf8.encode(String(secret)), 'PBKDF2', false, ['deriveKey']);
  return webCrypto().subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: count, hash },
    material,
    { name: 'AES-CBC', length: keyLength },
    false,
    usages,
  );
}

export function formatJavaDate(dateValue) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(String(dateValue))) {
    throw new Error("Choose a date and time in Java's yyyy-MM-dd'T'HH:mm:ss format.");
  }
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime()) || currentJavaDateValue(date) !== dateValue) throw new Error('The selected date and time is invalid.');
  return date;
}

function makeLegacyIv(dateValue) {
  const source = utf8.encode(dateValue);
  const iv = new Uint8Array(16);
  iv.set(source.subarray(0, iv.length));
  return iv;
}

function concatBytes(...parts) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

export async function encryptLegacy({ plaintext, secret, saltText, dateValue, algorithm, iterations, keyLengthBits }) {
  const salt = decodeJavaSalt(saltText);
  const iv = makeLegacyIv(dateValue);
  const key = await deriveAesKey(secret, salt, algorithm, iterations, keyLengthBits, ['encrypt']);
  const ciphertext = new Uint8Array(await webCrypto().subtle.encrypt(
    { name: 'AES-CBC', iv },
    key,
    utf8.encode(String(plaintext)),
  ));
  return bytesToBase64(concatBytes(salt, iv, ciphertext));
}

export async function decryptLegacy({ envelope, secret, saltText, algorithm, iterations, keyLengthBits }) {
  const packed = base64ToBytes(envelope);
  const salt = decodeJavaSalt(saltText);
  if (packed.length < salt.length + 16 + 16 || (packed.length - salt.length - 16) % 16 !== 0) {
    throw new Error('Invalid or truncated legacy encrypted value. Check the salt and Base64 input.');
  }
  // Match PasswordCrypto.decryptLegacy: the caller-provided salt derives the
  // key; the embedded salt bytes remain part of the legacy envelope layout.
  const iv = packed.subarray(salt.length, salt.length + 16);
  const ciphertext = packed.subarray(salt.length + 16);
  const key = await deriveAesKey(secret, salt, algorithm, iterations, keyLengthBits, ['decrypt']);
  try {
    const clear = await webCrypto().subtle.decrypt({ name: 'AES-CBC', iv }, key, ciphertext);
    return new TextDecoder('utf-8', { fatal: true }).decode(clear);
  } catch {
    throw new Error('Legacy decryption failed. Confirm the original secret, salt, KDF, iterations, and AES key length.');
  }
}

async function deriveGcmKey(secret, salt, algorithm, iterations, keyLengthBits, usage) {
  if (!String(secret)) throw new Error('Enter an encryption secret or generate one.');
  const keyLength = validateKeyLength(keyLengthBits);
  const count = validateIterations(iterations);
  const hash = getHash(algorithm);
  const material = await webCrypto().subtle.importKey('raw', utf8.encode(String(secret)), 'PBKDF2', false, ['deriveKey']);
  return webCrypto().subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: count, hash },
    material,
    { name: 'AES-GCM', length: keyLength },
    false,
    [usage],
  );
}

function makeHeader({ algorithm, keyLengthBits, iterations, salt, nonce, dateMillis }) {
  const header = new Uint8Array(24 + salt.length + nonce.length);
  const view = new DataView(header.buffer);
  view.setUint32(0, MAGIC, false);
  view.setUint8(4, VERSION);
  view.setUint8(5, KDF_ALGORITHMS.indexOf(algorithm));
  view.setInt32(6, validateKeyLength(keyLengthBits), false);
  view.setInt32(10, validateIterations(iterations), false);
  view.setUint8(14, salt.length);
  view.setUint8(15, nonce.length);
  view.setBigInt64(16, dateMillis, false);
  header.set(salt, 24);
  header.set(nonce, 24 + salt.length);
  return header;
}

function parseHeader(envelope) {
  const packed = base64ToBytes(envelope);
  if (packed.length < 24) throw new Error('Encrypted header is truncated.');
  const view = new DataView(packed.buffer, packed.byteOffset, packed.byteLength);
  const magic = view.getUint32(0, false);
  const version = view.getUint8(4);
  const algorithmId = view.getUint8(5);
  const keyLengthBits = view.getInt32(6, false);
  const iterations = view.getInt32(10, false);
  const saltLength = view.getUint8(14);
  const nonceLength = view.getUint8(15);
  const dateMillis = view.getBigInt64(16, false);
  if (magic !== MAGIC || version !== VERSION) throw new Error('Unknown encrypted-envelope format.');
  if (!KDF_ALGORITHMS[algorithmId]) throw new Error('Unsupported KDF algorithm identifier.');
  if (saltLength < 8 || saltLength > 64 || nonceLength !== NONCE_BYTES) throw new Error('Invalid salt or nonce length in encrypted header.');
  validateKeyLength(keyLengthBits);
  validateIterations(iterations);
  const headerLength = 24 + saltLength + nonceLength;
  if (packed.length < headerLength + TAG_BITS / 8) throw new Error('Encrypted envelope is truncated.');
  return {
    algorithm: KDF_ALGORITHMS[algorithmId],
    keyLengthBits,
    iterations,
    salt: packed.slice(24, 24 + saltLength),
    nonce: packed.slice(24 + saltLength, headerLength),
    dateMillis,
    header: packed.slice(0, headerLength),
    ciphertext: packed.slice(headerLength),
  };
}

export function describeHeaderDate(dateMillis) {
  return dateMillis === NO_DATE ? null : new Date(Number(dateMillis));
}

export async function encryptHeader({ plaintext, secret, algorithm, iterations, keyLengthBits, saltBytes = 24, saltText = '', dateValue = '', includeDate = true }) {
  const salt = String(saltText).trim() ? decodeJavaSalt(saltText) : randomBytes(Number(saltBytes));
  if (salt.length < 8 || salt.length > 64) throw new Error('Salt must contain between 8 and 64 bytes.');
  const nonce = randomBytes(NONCE_BYTES);
  const date = includeDate ? formatJavaDate(dateValue) : null;
  const dateMillis = date ? BigInt(date.getTime()) : NO_DATE;
  const header = makeHeader({ algorithm, keyLengthBits, iterations, salt, nonce, dateMillis });
  const key = await deriveGcmKey(secret, salt, algorithm, iterations, keyLengthBits, 'encrypt');
  const ciphertext = new Uint8Array(await webCrypto().subtle.encrypt(
    { name: 'AES-GCM', iv: nonce, additionalData: header, tagLength: TAG_BITS },
    key,
    utf8.encode(String(plaintext)),
  ));
  return bytesToBase64(concatBytes(header, ciphertext));
}

export async function decryptHeader({ envelope, secret }) {
  const parsed = parseHeader(envelope);
  const key = await deriveGcmKey(secret, parsed.salt, parsed.algorithm, parsed.iterations, parsed.keyLengthBits, 'decrypt');
  try {
    const plaintext = await webCrypto().subtle.decrypt(
      { name: 'AES-GCM', iv: parsed.nonce, additionalData: parsed.header, tagLength: TAG_BITS },
      key,
      parsed.ciphertext,
    );
    return { plaintext: new TextDecoder('utf-8', { fatal: true }).decode(plaintext), metadata: parsed };
  } catch {
    throw new Error('Header decryption failed. The secret is incorrect or the envelope was modified.');
  }
}

export function generateEncryptionSecret(keyLengthBits) {
  const bits = validateKeyLength(keyLengthBits);
  return bytesToBase64(randomBytes(bits / 8)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function generateSalt(saltLengthBytes = 24) {
  const length = Number(saltLengthBytes);
  if (!Number.isInteger(length) || length < 8 || length > 64) throw new Error('Salt size must be between 8 and 64 bytes.');
  return bytesToBase64(randomBytes(length));
}

export function currentJavaDateValue(date = new Date()) {
  const part = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${part(date.getMonth() + 1)}-${part(date.getDate())}T${part(date.getHours())}:${part(date.getMinutes())}:${part(date.getSeconds())}`;
}
