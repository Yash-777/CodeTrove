const encoder = new TextEncoder();

export const RESERVED_CHARACTERS = "!#$&'()*+,/:;=?@[]";
export const UNRESERVED_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
export const COMMON_ENCODED_CHARACTERS = ['\n', ' ', '"', '%', '<', '>', '\\', '^', '`', '{', '|', '}'];

export const URL_CHARACTER_TABLE = [
  ...Array.from(RESERVED_CHARACTERS, (character) => ({ character, group: 'Reserved' })),
  ...Array.from(UNRESERVED_CHARACTERS, (character) => ({ character, group: 'Unreserved' })),
  ...COMMON_ENCODED_CHARACTERS.map((character) => ({ character, group: 'Common encoded' })),
];

export function isUnreserved(character) {
  return UNRESERVED_CHARACTERS.includes(character);
}

export function percentEncodeCharacter(character) {
  return Array.from(encoder.encode(character), (byte) => `%${byte.toString(16).toUpperCase().padStart(2, '0')}`).join('');
}

export function replacementFor(character) {
  return isUnreserved(character) ? character : percentEncodeCharacter(character);
}

function decodePercentRun(value) {
  return decodeURIComponent(value);
}

export function deriveAutoSelectedCharacters(value, mode = 'encode') {
  const selected = new Set();
  const source = String(value);
  if (mode === 'encode') {
    for (const character of source) selected.add(character);
    return selected;
  }
  const percentRuns = source.match(/(?:%[0-9a-fA-F]{2})+/g) || [];
  percentRuns.forEach((run) => {
    try { for (const character of decodePercentRun(run)) selected.add(character); } catch { /* Invalid runs remain visible for correction. */ }
  });
  return selected;
}

export function encodeUrlText(value, selectedCharacters) {
  return Array.from(String(value), (character) => {
    if (isUnreserved(character) || !selectedCharacters.has(character)) return character;
    return percentEncodeCharacter(character);
  }).join('');
}

export function decodeUrlText(value, selectedCharacters) {
  return String(value).replace(/(?:%[0-9a-fA-F]{2})+/g, (run) => {
    let decoded;
    try { decoded = decodePercentRun(run); } catch { throw new Error(`Invalid percent-encoding near ${run}. Use two hexadecimal digits after every %.`); }
    return Array.from(decoded).every((character) => selectedCharacters.has(character)) ? decoded : run;
  });
}

export function getDetectedCharacters(value, mode, catalog = URL_CHARACTER_TABLE) {
  const known = new Set(catalog.map(({ character }) => character));
  const detected = deriveAutoSelectedCharacters(value, mode);
  return [...detected].filter((character) => !known.has(character));
}
