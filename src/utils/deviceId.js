/**
 * src/utils/deviceId.js
 * ------------------------------------------------------------------
 * Generates a random ID once per browser and stores it in
 * localStorage, so this specific browser/device can be recognized
 * again on the next visit. Used by AuthContext to enforce "signed in
 * on at most 2 devices at a time" per account.
 *
 * NOTE ON HONESTY: this is a best-effort client identifier, not a
 * secure device fingerprint - clearing localStorage or using a
 * different browser creates a "new" device as far as this code is
 * concerned. Real device-binding (the kind banks use) needs
 * server-issued, hard-to-forge tokens. This is intentionally simple
 * and documented as a demo-level session cap, not a security
 * boundary - see README's "Session limit" section.
 */

const KEY = 'codetrove:device-id';

export function getDeviceId() {
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
