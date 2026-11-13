import { gzipSync, gunzipSync, zlibSync, unzlibSync, zipSync, unzipSync } from 'fflate';

export const COMPRESSION_ALGORITHMS = {
  gzip: { label: 'GZIP', description: 'A web-friendly wrapper around Deflate with a header and checksum.' },
  deflate: { label: 'Deflate', description: 'Raw zlib/Deflate data with a good speed-to-size balance.' },
  zip: { label: 'ZIP', description: 'A standard single-file archive containing the input bytes.' },
  huffman: { label: 'Huffman (text / bytes)', description: 'A teaching-friendly prefix-code format that assigns shorter codes to frequent bytes.' },
};

export const COMPRESSION_LEVELS = {
  low: { label: 'Low', value: 1, description: 'Faster processing with lighter compression.' },
  medium: { label: 'Medium', value: 6, description: 'Balanced speed and output size.' },
  high: { label: 'High', value: 9, description: 'More work for a smaller Deflate/GZIP/ZIP result.' },
};

export const SAMPLE_TEXT = `Compression works best when data contains patterns.

This sample repeats common words so the compressor can find repeated byte sequences.
Repeated data takes less space when the algorithm stores the pattern once and refers to it again.

CodeTrove compression runs locally in your browser.`;

const HUFFMAN_MAGIC = [0x43, 0x54, 0x48, 0x31]; // CTH1

function asBytes(value) {
  return value instanceof Uint8Array ? value : new Uint8Array(value);
}

function buildHuffmanTree(bytes) {
  const frequencies = new Uint32Array(256);
  bytes.forEach((byte) => { frequencies[byte] += 1; });
  let nodes = [];
  for (let symbol = 0; symbol < frequencies.length; symbol += 1) {
    if (frequencies[symbol]) nodes.push({ symbol, frequency: frequencies[symbol], order: symbol });
  }
  if (nodes.length === 0) return { frequencies, root: null };
  while (nodes.length > 1) {
    nodes.sort((a, b) => a.frequency - b.frequency || a.order - b.order);
    const left = nodes.shift();
    const right = nodes.shift();
    nodes.push({ frequency: left.frequency + right.frequency, left, right, order: Math.min(left.order, right.order) });
  }
  return { frequencies, root: nodes[0] };
}

function createCodes(root) {
  const codes = new Map();
  if (!root) return codes;
  if (root.symbol !== undefined) { codes.set(root.symbol, '0'); return codes; }
  const visit = (node, prefix) => {
    if (node.symbol !== undefined) codes.set(node.symbol, prefix || '0');
    else { visit(node.left, `${prefix}0`); visit(node.right, `${prefix}1`); }
  };
  visit(root, '');
  return codes;
}

function writeUint32(view, offset, value) { view.setUint32(offset, value); }
function readUint32(view, offset) { return view.getUint32(offset); }

function huffmanEncode(input) {
  const bytes = asBytes(input);
  const { frequencies, root } = buildHuffmanTree(bytes);
  const symbols = [];
  for (let symbol = 0; symbol < frequencies.length; symbol += 1) if (frequencies[symbol]) symbols.push(symbol);
  const headerLength = 10 + symbols.length * 5;
  const codes = createCodes(root);
  const encodedLength = symbols.length <= 1 ? 0 : Math.ceil(bytes.reduce((total, byte) => total + codes.get(byte).length, 0) / 8);
  const result = new Uint8Array(headerLength + encodedLength);
  result.set(HUFFMAN_MAGIC, 0);
  const view = new DataView(result.buffer);
  writeUint32(view, 4, bytes.length);
  view.setUint16(8, symbols.length);
  let offset = 10;
  symbols.forEach((symbol) => { result[offset] = symbol; writeUint32(view, offset + 1, frequencies[symbol]); offset += 5; });
  if (symbols.length > 1) {
    let bitIndex = headerLength * 8;
    bytes.forEach((byte) => {
      for (const bit of codes.get(byte)) {
        if (bit === '1') result[Math.floor(bitIndex / 8)] |= 1 << (7 - (bitIndex % 8));
        bitIndex += 1;
      }
    });
  }
  return result;
}

function huffmanDecode(input) {
  const bytes = asBytes(input);
  if (bytes.length < 10 || !HUFFMAN_MAGIC.every((value, index) => bytes[index] === value)) throw new Error('This is not a CodeTrove Huffman payload.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const originalLength = readUint32(view, 4);
  const symbolCount = view.getUint16(8);
  const frequencies = [];
  let offset = 10;
  for (let index = 0; index < symbolCount; index += 1) {
    if (offset + 5 > bytes.length) throw new Error('The Huffman header is incomplete.');
    frequencies.push({ symbol: bytes[offset], frequency: readUint32(view, offset + 1) });
    offset += 5;
  }
  if (!symbolCount) return new Uint8Array(0);
  if (symbolCount === 1) return new Uint8Array(originalLength).fill(frequencies[0].symbol);
  const nodes = frequencies.map(({ symbol, frequency }) => ({ symbol, frequency, order: symbol }));
  while (nodes.length > 1) {
    nodes.sort((a, b) => a.frequency - b.frequency || a.order - b.order);
    const left = nodes.shift(); const right = nodes.shift();
    nodes.push({ frequency: left.frequency + right.frequency, left, right, order: Math.min(left.order, right.order) });
  }
  const root = nodes[0];
  const output = new Uint8Array(originalLength);
  let outputIndex = 0;
  let node = root;
  for (let byteIndex = offset; byteIndex < bytes.length && outputIndex < originalLength; byteIndex += 1) {
    for (let bit = 7; bit >= 0 && outputIndex < originalLength; bit -= 1) {
      node = ((bytes[byteIndex] >> bit) & 1) ? node.right : node.left;
      if (node.symbol !== undefined) { output[outputIndex] = node.symbol; outputIndex += 1; node = root; }
    }
  }
  if (outputIndex !== originalLength) throw new Error('The Huffman payload is truncated or corrupt.');
  return output;
}

export function compressBytes(bytes, algorithm, level = 'medium') {
  const input = asBytes(bytes);
  const options = { level: COMPRESSION_LEVELS[level]?.value ?? COMPRESSION_LEVELS.medium.value };
  if (algorithm === 'gzip') return gzipSync(input, options);
  if (algorithm === 'deflate') return zlibSync(input, options);
  if (algorithm === 'zip') return zipSync({ 'codetrove-input.bin': input }, options);
  if (algorithm === 'huffman') return huffmanEncode(input);
  throw new Error(`Unsupported compression algorithm: ${algorithm}`);
}

export function decompressBytes(bytes, algorithm) {
  const input = asBytes(bytes);
  if (algorithm === 'gzip') return gunzipSync(input);
  if (algorithm === 'deflate') return unzlibSync(input);
  if (algorithm === 'zip') {
    const entries = unzipSync(input);
    const first = Object.values(entries)[0];
    if (!first) throw new Error('The ZIP archive does not contain a file.');
    return first;
  }
  if (algorithm === 'huffman') return huffmanDecode(input);
  throw new Error(`Unsupported compression algorithm: ${algorithm}`);
}

export function bytesToBase64(bytes) {
  let binary = '';
  const input = asBytes(bytes);
  const chunkSize = 0x8000;
  for (let offset = 0; offset < input.length; offset += chunkSize) binary += String.fromCharCode(...input.subarray(offset, offset + chunkSize));
  return btoa(binary);
}

export function base64ToBytes(value) {
  const normalized = String(value || '').replace(/^data:[^,]+,/, '').replace(/\s/g, '');
  if (!normalized) return new Uint8Array(0);
  let binary;
  try { binary = atob(normalized); } catch { throw new Error('Enter valid Base64 compressed data.'); }
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function textToBytes(text) { return new TextEncoder().encode(text); }
export function bytesToText(bytes) {
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { throw new Error('The decompressed bytes are not valid UTF-8 text. Switch to File mode for binary data.'); }
}
export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 1024) return `${bytes || 0} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes; let unit = -1;
  do { value /= 1024; unit += 1; } while (value >= 1024 && unit < units.length - 1);
  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${units[unit]}`;
}
export function compressionRatio(original, compressed) {
  if (!original) return '—';
  return `${((compressed / original) * 100).toFixed(1)}% of original`;
}
