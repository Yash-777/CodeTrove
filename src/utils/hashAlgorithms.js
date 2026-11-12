const MASK64 = 0xffffffffffffffffn;
const ROTATION = [
  [0, 36, 3, 41, 18],
  [1, 44, 10, 45, 2],
  [62, 6, 43, 15, 61],
  [28, 55, 25, 21, 56],
  [27, 20, 39, 8, 14],
];
const ROUND_CONSTANTS = [
  0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an, 0x8000000080008000n,
  0x000000000000808bn, 0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n,
  0x000000000000008an, 0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
  0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n, 0x8000000000008003n,
 0x8000000000008002n, 0x8000000000000080n, 0x000000000000800an, 0x800000008000000an,
  0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n,
];

const ALGORITHM_DETAILS = {
  'SHA-1': { family: 'SHA-1', bits: 160, block: '512 bits', security: 'Legacy; collision attacks are practical', work: 'Merkle–Damgård compression with 80 rounds. Use only for compatibility.' },
  'SHA-256': { family: 'SHA-2', bits: 256, block: '512 bits', security: '128-bit collision security', work: 'SHA-2 compression over 512-bit blocks with 64 rounds and a 256-bit state.' },
  'SHA-384': { family: 'SHA-2', bits: 384, block: '1024 bits', security: '192-bit collision security', work: 'SHA-512-style compression with SHA-384 initialization vectors and a truncated 384-bit result.' },
  'SHA-512': { family: 'SHA-2', bits: 512, block: '1024 bits', security: '256-bit collision security', work: 'SHA-2 compression over 1024-bit blocks with 80 rounds and a 512-bit state.' },
  'SHA3-224': { family: 'SHA-3', bits: 224, block: '1152 bits (r=1152, c=448)', security: '112-bit collision security', work: 'Keccak sponge using domain padding 0x06 and a 224-bit squeeze.' },
  'SHA3-256': { family: 'SHA-3', bits: 256, block: '1088 bits (r=1088, c=512)', security: '128-bit collision security', work: 'Keccak sponge using FIPS 202 domain padding 0x06.' },
  'SHA3-384': { family: 'SHA-3', bits: 384, block: '832 bits (r=832, c=768)', security: '192-bit collision security', work: 'Keccak sponge using domain padding 0x06 and a 384-bit squeeze.' },
  'SHA3-512': { family: 'SHA-3', bits: 512, block: '576 bits (r=576, c=1024)', security: '256-bit collision security', work: 'Keccak sponge using domain padding 0x06. It is not vulnerable to length-extension attacks.' },
  'Keccak-224': { family: 'Original Keccak', bits: 224, block: '1152 bits (r=1152, c=448)', security: '112-bit collision security', work: 'Original Keccak sponge construction with 0x01 padding.' },
  'Keccak-256': { family: 'Original Keccak', bits: 256, block: '1088 bits (r=1088, c=512)', security: '128-bit collision security', work: 'Original Keccak sponge construction with 0x01 padding; this differs from SHA3-256.' },
  'Keccak-384': { family: 'Original Keccak', bits: 384, block: '832 bits (r=832, c=768)', security: '192-bit collision security', work: 'Original Keccak sponge construction with 0x01 padding; hashes differ from SHA3-384.' },
  'Keccak-512': { family: 'Original Keccak', bits: 512, block: '576 bits (r=576, c=1024)', security: '256-bit collision security', work: 'Original Keccak sponge construction with 0x01 padding.' },
  'RIPEMD-128': { family: 'RIPEMD', bits: 128, block: '512 bits', security: 'Not recommended for new security designs', work: 'Two parallel 64-step MD-style lines use different Boolean functions, constants, and message schedules before the state is combined.' },
};

export const HASH_ALGORITHM_DETAILS = ALGORITHM_DETAILS;
export const HASH_ALGORITHMS = Object.keys(ALGORITHM_DETAILS);
export const WEB_CRYPTO_HASHES = new Set(['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']);
export const PBKDF2_HASHES = new Set(WEB_CRYPTO_HASHES);

function rotl64(value, shift) {
  if (shift === 0) return value;
  return ((value << BigInt(shift)) | (value >> BigInt(64 - shift))) & MASK64;
}

function keccakF(state) {
  for (const roundConstant of ROUND_CONSTANTS) {
    const c = Array.from({ length: 5 }, (_, x) => state[x] ^ state[x + 5] ^ state[x + 10] ^ state[x + 15] ^ state[x + 20]);
    const d = Array.from({ length: 5 }, (_, x) => c[(x + 4) % 5] ^ rotl64(c[(x + 1) % 5], 1));
    for (let x = 0; x < 5; x += 1) for (let y = 0; y < 5; y += 1) state[x + 5 * y] = (state[x + 5 * y] ^ d[x]) & MASK64;
    const b = Array(25).fill(0n);
    for (let x = 0; x < 5; x += 1) for (let y = 0; y < 5; y += 1) b[y + 5 * ((2 * x + 3 * y) % 5)] = rotl64(state[x + 5 * y], ROTATION[x][y]);
    for (let x = 0; x < 5; x += 1) for (let y = 0; y < 5; y += 1) state[x + 5 * y] = (b[x + 5 * y] ^ ((~b[(x + 1) % 5 + 5 * y]) & b[(x + 2) % 5 + 5 * y])) & MASK64;
    state[0] = (state[0] ^ roundConstant) & MASK64;
  }
}

function readLane(bytes, offset) {
  let lane = 0n;
  for (let index = 0; index < 8; index += 1) lane |= BigInt(bytes[offset + index] || 0) << BigInt(index * 8);
  return lane;
}

function writeLane(lane, bytes, offset) {
  for (let index = 0; index < 8; index += 1) bytes[offset + index] = Number((lane >> BigInt(index * 8)) & 0xffn);
}

export function keccakDigest(data, bits, domain = 0x01) {
  const rate = (1600 - bits * 2) / 8;
  const paddedLength = Math.ceil((data.length + 1) / rate) * rate;
  const padded = new Uint8Array(paddedLength || rate);
  padded.set(data);
  padded[data.length] ^= domain;
  padded[padded.length - 1] ^= 0x80;
  const state = Array(25).fill(0n);
  for (let offset = 0; offset < padded.length; offset += rate) {
    for (let laneOffset = 0; laneOffset < rate; laneOffset += 8) state[laneOffset / 8] ^= readLane(padded, offset + laneOffset);
    keccakF(state);
  }
  const output = new Uint8Array(bits / 8);
  let written = 0;
  while (written < output.length) {
    const block = new Uint8Array(rate);
    for (let laneOffset = 0; laneOffset < rate; laneOffset += 8) writeLane(state[laneOffset / 8], block, laneOffset);
    const count = Math.min(rate, output.length - written);
    output.set(block.slice(0, count), written);
    written += count;
    if (written < output.length) keccakF(state);
  }
  return output;
}

const RL = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8, 3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12, 1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2];
const R2 = [5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12, 6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2, 15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13, 8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14];
const KL = [0, 0x5a827999, 0x6ed9eba1, 0x8f1bbcdc];
const KR = [0x50a28be6, 0x5c4dd124, 0x6d703ef3, 0];
const S1 = [[11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8], [7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12], [11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5], [11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12]];
const S2 = [[8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6], [9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11], [9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5], [15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8]];
const F = [(x, y, z) => x ^ y ^ z, (x, y, z) => (x & y) | (~x & z), (x, y, z) => (x | ~y) ^ z, (x, y, z) => (x & z) | (y & ~z)];
const rol32 = (value, bits) => ((value << bits) | (value >>> (32 - bits))) >>> 0;
function add32(...values) { return values.reduce((sum, value) => (sum + value) >>> 0, 0); }
function readWord(bytes, offset) { return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0; }
function writeWord(value, bytes, offset) { for (let i = 0; i < 4; i += 1) bytes[offset + i] = (value >>> (8 * i)) & 0xff; }

export function ripemd128(data) {
  const length = data.length;
  const total = Math.ceil((length + 9) / 64) * 64;
  const padded = new Uint8Array(total);
  padded.set(data); padded[length] = 0x80;
  const bitLength = BigInt(length) * 8n;
  for (let i = 0; i < 8; i += 1) padded[total - 8 + i] = Number((bitLength >> BigInt(8 * i)) & 0xffn);
  let [a, b, c, d] = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];
  for (let offset = 0; offset < total; offset += 64) {
    const words = Array.from({ length: 16 }, (_, i) => readWord(padded, offset + i * 4));
    let [al, bl, cl, dl] = [a, b, c, d]; let [ar, br, cr, dr] = [a, b, c, d];
    for (let j = 0; j < 64; j += 1) {
      const round = Math.floor(j / 16); const left = add32(rol32(add32(al, F[round](bl, cl, dl), words[RL[j]], KL[round]), S1[round][j % 16]), 0);
      al = dl; dl = cl; cl = bl; bl = left;
      const rightRound = 3 - round; const right = add32(rol32(add32(ar, F[rightRound](br, cr, dr), words[R2[j]], KR[round]), S2[round][j % 16]), 0);
      ar = dr; dr = cr; cr = br; br = right;
    }
    const t = add32(b, cl, dr); b = add32(c, dl, ar); c = add32(d, al, br); d = add32(a, bl, cr); a = t;
  }
  const output = new Uint8Array(16); [a, b, c, d].forEach((word, index) => writeWord(word, output, index * 4)); return output;
}

export function digestCustom(algorithm, data) {
  if (algorithm.startsWith('SHA3-')) return keccakDigest(data, Number(algorithm.slice(5)), 0x06);
  if (algorithm.startsWith('Keccak-')) return keccakDigest(data, Number(algorithm.slice(7)), 0x01);
  if (algorithm === 'RIPEMD-128') return ripemd128(data);
  throw new Error(`${algorithm} is not a custom browser digest.`);
}
