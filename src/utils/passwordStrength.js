/**
 * src/utils/passwordStrength.js
 * ------------------------------------------------------------------
 * Two small, dependency-free utilities:
 *
 *  1. scorePassword() - checks 4 simple rules and returns a 0-4
 *     score, used to drive the 5-color strength meter. This is
 *     intentionally a plain rules-based scorer, not a library like
 *     zxcvbn - zxcvbn scores based on dictionary/pattern guessing
 *     probability, which doesn't map cleanly onto "must have 7+
 *     chars, upper, lower, and a special character" (your exact
 *     requirement) and adds real dependency weight for something
 *     four `if` checks handle correctly. See README's "Libraries
 *     used" section for the full reasoning on every dependency
 *     choice in this project.
 *
 *  2. generateStrongPassword() - uses the browser's built-in Web
 *     Crypto API (`crypto.getRandomValues`), NOT Math.random(). This
 *     matters: Math.random() is not cryptographically secure and
 *     predictable given enough output, which makes it unsuitable for
 *     anything security-related, including generating passwords.
 *     crypto.getRandomValues() is a web standard, built into every
 *     modern browser - no library needed.
 */

const RULES = [
  { test: (pw) => pw.length >= 7, label: 'At least 7 characters' },
  { test: (pw) => /[A-Z]/.test(pw), label: 'One capital letter' },
  { test: (pw) => /[a-z]/.test(pw), label: 'One lowercase letter' },
  { test: (pw) => /[^A-Za-z0-9]/.test(pw), label: 'One special character' },
];

/**
 * scorePassword(password) -> { score: 0-4, checks: [{label, passed}] }
 * score doubles as an index into STRENGTH_LEVELS below.
 */
export function scorePassword(password) {
  const checks = RULES.map((rule) => ({ label: rule.label, passed: rule.test(password) }));
  const score = checks.filter((c) => c.passed).length;
  return { score, checks };
}

/** One entry per possible score (0-4) - color + text label for the UI. */
export const STRENGTH_LEVELS = [
  { label: 'Very weak', color: '#E53E3E' },
  { label: 'Weak', color: '#F59E0B' },
  { label: 'Fair', color: '#EAB308' },
  { label: 'Good', color: '#3B82F6' },
  { label: 'Strong', color: '#22C55E' },
];

const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I/O - easy to misread
const LOWER = 'abcdefghijkmnpqrstuvwxyz';
const DIGITS = '23456789'; // no 0/1 - easy to misread
const SPECIAL = '!@#$%^&*-_=+?';
const ALL = UPPER + LOWER + DIGITS + SPECIAL;

/** Returns the browser's secure Web Crypto API or throws a clear error. */
function getSecureCrypto() {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi || typeof cryptoApi.getRandomValues !== 'function') {
    throw new Error('Secure password generation requires Web Crypto support. Please use a modern browser over HTTPS.');
  }
  return cryptoApi;
}

/** Picks one cryptographically-random character from `chars` without modulo bias. */
function randomChar(chars) {
  const cryptoApi = getSecureCrypto();
  const maxUnbiased = Math.floor(0x100000000 / chars.length) * chars.length;
  const bytes = new Uint32Array(1);
  do {
    cryptoApi.getRandomValues(bytes);
  } while (bytes[0] >= maxUnbiased);
  return chars[bytes[0] % chars.length];
}

/**
 * generateStrongPassword(length = 12)
 * Guarantees at least one char from each required category (so the
 * result always scores "Strong" against scorePassword above), then
 * fills the rest randomly and shuffles.
 */
export function generateStrongPassword(length = 12) {
  const required = [randomChar(UPPER), randomChar(LOWER), randomChar(SPECIAL), randomChar(DIGITS)];
  const rest = Array.from({ length: Math.max(length - required.length, 0) }, () => randomChar(ALL));
  const combined = [...required, ...rest];

  // Fisher-Yates shuffle using the same secure random source, so the
  // guaranteed characters aren't predictably at the start.
  for (let i = combined.length - 1; i > 0; i--) {
    const cryptoApi = getSecureCrypto();
    const maxUnbiased = Math.floor(0x100000000 / (i + 1)) * (i + 1);
    const randArr = new Uint32Array(1);
    do {
      cryptoApi.getRandomValues(randArr);
    } while (randArr[0] >= maxUnbiased);
    const j = randArr[0] % (i + 1);
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }

  return combined.join('');
}
