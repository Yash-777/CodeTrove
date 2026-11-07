const SUPPORTED_FLAGS = 'dgimsuvy';

export const REGEX_FLAGS = SUPPORTED_FLAGS.split('');

export function normalizeRegexFlags(flags = '') {
  const value = String(flags).replace(/\s+/g, '');
  const invalid = [...new Set([...value].filter((flag) => !SUPPORTED_FLAGS.includes(flag)))];
  if (invalid.length > 0) throw new Error(`Unsupported flag${invalid.length > 1 ? 's' : ''}: ${invalid.join(', ')}. Use JavaScript flags only.`);
  const duplicate = [...new Set([...value].filter((flag, index) => value.indexOf(flag) !== index))];
  if (duplicate.length > 0) throw new Error(`Duplicate flag${duplicate.length > 1 ? 's' : ''}: ${duplicate.join(', ')}.`);
  if (value.includes('u') && value.includes('v')) throw new Error('Flags u and v cannot be used together.');
  return value;
}

export function createRegex(pattern, flags = '') {
  // JavaScript has no native \h token. Support the common regex-tool spelling
  // as horizontal whitespace while keeping the rest of the pattern native.
  const source = String(pattern).replace(/\\h/g, '[\\t ]');
  if (!source) throw new Error('Enter a regular expression pattern.');
  return new RegExp(source, normalizeRegexFlags(flags));
}

function advanceAfterEmptyMatch(regex, input) {
  const next = regex.lastIndex + 1;
  regex.lastIndex = next > input.length ? input.length + 1 : next;
}

export function findRegexMatches(input, regex) {
  const source = String(input);
  const matcher = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : `${regex.flags}g`);
  const matches = [];
  let match;
  while ((match = matcher.exec(source)) !== null) {
    matches.push({
      index: match.index,
      end: match.index + match[0].length,
      text: match[0],
      groups: match.slice(1),
      namedGroups: match.groups ? { ...match.groups } : {},
    });
    if (match[0] === '') advanceAfterEmptyMatch(matcher, source);
  }
  return regex.flags.includes('g') ? matches : matches.slice(0, 1);
}

export function toJavaScriptReplacement(replacement = '') {
  // Regex101-style $0 means the complete match. JavaScript's equivalent is $&.
  return String(replacement).replace(/\$0(?!\d)/g, () => '$&');
}

export function applyRegexReplacement(input, regex, replacement = '') {
  return String(input).replace(regex, toJavaScriptReplacement(replacement));
}

export function renderHighlightedSegments(input, matches) {
  const source = String(input);
  const segments = [];
  let cursor = 0;
  matches.forEach((match, index) => {
    if (match.index > cursor) segments.push({ type: 'text', value: source.slice(cursor, match.index) });
    if (match.end > match.index) segments.push({ type: 'match', value: source.slice(match.index, match.end), index });
    cursor = Math.max(cursor, match.end);
  });
  if (cursor < source.length) segments.push({ type: 'text', value: source.slice(cursor) });
  if (segments.length === 0 && source) segments.push({ type: 'text', value: source });
  return segments;
}
