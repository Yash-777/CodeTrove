const graphemeSegmenter =
  typeof Intl !== 'undefined' &&
  typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    : null;

const isWhitespace = /^\p{White_Space}+$/u;
const hasLetter = /\p{L}/u;
const hasNumber = /\p{N}/u;
const hasSymbolOrPunctuation = /[\p{P}\p{S}]/u;
const isEmojiSequence =
  /(?:\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F|\p{Regional_Indicator}|\u20E3)/u;

const wordPattern = /[\p{L}\p{N}][\p{L}\p{M}\p{N}'’_-]*/gu;

function splitGraphemes(text) {
  if (graphemeSegmenter) {
    return Array.from(
      graphemeSegmenter.segment(text),
      (part) => part.segment
    );
  }

  return Array.from(text);
}

function normalizeDistinctValue(value) {
  return value.normalize('NFC');
}

function distinctCount(items) {
  return new Set(items.map(normalizeDistinctValue)).size;
}

function countParagraphs(text) {
  let count = 0;
  let insideParagraph = false;

  for (const line of text.split(/\r\n|\r|\n/u)) {
    if (line.trim()) {
      if (!insideParagraph) count += 1;
      insideParagraph = true;
    } else {
      insideParagraph = false;
    }
  }

  return count;
}

function countSentences(text) {
  const trimmed = text.trim();
  if (!trimmed) return 0;

  const hasSentenceEnding = /[.!?]/u.test(trimmed);
  const separator = hasSentenceEnding
    ? /[.!?]+[”’"')\]]*/u
    : /[,;]+/u;

  return trimmed.split(separator).filter((part) => part.trim()).length;
}

/**
 * Analyze grapheme clusters and text structure.
 *
 * Characters = Characters Without Spaces + Spaces
 * Unique Characters = Unique Characters Without Spaces
 *                  + Unique Spaces (whitespace kinds)
 */
export function analyzeCharacters(text) {
  const graphemes = splitGraphemes(text);

  // Treat each grapheme cluster as one character.
  const whitespaceGraphemes = graphemes.filter(
    (character) => isWhitespace.test(character)
  );

  const nonWhitespaceGraphemes = graphemes.filter(
    (character) => !isWhitespace.test(character)
  );

  // Total counts: repeated characters and whitespace are counted each time.
  const charactersWithoutSpaces = nonWhitespaceGraphemes.length;
  const spaces = whitespaceGraphemes.length;
  const totalCharacters = charactersWithoutSpaces + spaces;

  // Unique non-whitespace characters and unique whitespace kinds.
  // Examples: space = 1 kind, tab = 1 kind, newline = 1 kind.
  const uniqueCharactersWithoutSpaces = distinctCount(
    nonWhitespaceGraphemes
  );

  const uniqueSpaces = distinctCount(whitespaceGraphemes);

  const uniqueCharacters =
    uniqueCharactersWithoutSpaces + uniqueSpaces;

  // Other character statistics.
  const letters = nonWhitespaceGraphemes.filter(
    (character) => hasLetter.test(character)
  );

  const numbers = nonWhitespaceGraphemes.filter(
    (character) => hasNumber.test(character)
  );

  const emojis = nonWhitespaceGraphemes.filter(
    (character) => isEmojiSequence.test(character)
  );

  const symbols = nonWhitespaceGraphemes.filter(
    (character) =>
      !hasLetter.test(character) &&
      !hasNumber.test(character) &&
      !isEmojiSequence.test(character) &&
      hasSymbolOrPunctuation.test(character)
  );

  const regularSpaces = graphemes.filter(
    (character) => character === ' '
  ).length;

  const words = text.match(wordPattern) || [];

  const uniqueWords = new Set(
    words.map((word) =>
      normalizeDistinctValue(word).toLowerCase()
    )
  );

  const lineBreaks = text.match(/\r\n|\r|\n/gu) || [];

  return {
    totalCharacters,
    uniqueCharacters,

    charactersWithoutSpaces,
    uniqueCharactersWithoutSpaces,

    spaces,
    uniqueSpaces,
    regularSpaces,

    totalSymbols: symbols.length,
    uniqueSymbols: distinctCount(symbols),

    totalNumbers: numbers.length,
    uniqueNumbers: distinctCount(numbers),

    totalLetters: letters.length,
    uniqueLetters: distinctCount(letters),

    totalEmojis: emojis.length,
    uniqueEmojis: distinctCount(emojis),

    lines: text.length === 0 ? 0 : lineBreaks.length + 1,
    paragraphs: countParagraphs(text),

    totalWords: words.length,
    uniqueWords: uniqueWords.size,

    sentences: countSentences(text),
  };
}

/** Remove emoji grapheme clusters without disturbing surrounding text. */
export function removeEmojis(text) {
  return splitGraphemes(text)
    .filter((character) => !isEmojiSequence.test(character))
    .join('');
}

/** Transliterate accents, then keep readable ASCII text, spaces, and common punctuation. */
export function toPlainText(text) {
  return text
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\x00-\x7F]/gu, '')
    .replace(/[^A-Za-z0-9\s.,!?;:'"()\-]/gu, '')
    .replace(/[^\S\r\n]+/gu, ' ');
}