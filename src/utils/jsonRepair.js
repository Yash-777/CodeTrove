function scanTransform(source, handlers = {}) {
  let output = '';
  let quote = '';
  let escaped = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (quote) {
      if (handlers.onQuoted) handlers.onQuoted(char, quote, index);
      output += char;
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      output += char;
      continue;
    }
    const replacement = handlers.onPlain?.(char, next, index, output);
    if (replacement?.skip) {
      output += replacement.value || '';
      index += replacement.advance || 0;
    } else output += replacement?.value ?? char;
  }
  return output;
}

export function stripJsonCommentsForRepair(source) {
  let changed = false;
  const output = scanTransform(source, {
    onPlain: (char, next, index) => {
      if (char !== '/' || (next !== '/' && next !== '*')) return null;
      changed = true;
      const line = next === '/';
      let end = index + 2;
      if (line) while (end < source.length && source[end] !== '\n' && source[end] !== '\r') end += 1;
      else while (end < source.length && !(source[end] === '*' && source[end + 1] === '/')) end += 1;
      if (!line && end < source.length) end += 2;
      return { skip: true, value: source.slice(index, end).replace(/[^\r\n]/g, ' '), advance: end - index - 1 };
    },
  });
  return { source: output, changed };
}

function convertSingleQuotedStrings(source) {
  let output = '';
  let changed = false;
  for (let index = 0; index < source.length; index += 1) {
    if (source[index] !== "'") {
      output += source[index];
      continue;
    }
    changed = true;
    let value = '';
    let escaped = false;
    index += 1;
    for (; index < source.length; index += 1) {
      const char = source[index];
      if (escaped) {
        value += char === "'" ? "'" : `\\${char}`;
        escaped = false;
      } else if (char === '\\') escaped = true;
      else if (char === "'") break;
      else value += char;
    }
    output += JSON.stringify(value);
  }
  return { source: output, changed };
}

function quoteUnquotedKeys(source) {
  let output = '';
  let quote = '';
  let escaped = false;
  let changed = false;
  for (let index = 0; index < source.length;) {
    const char = source[index];
    if (quote) {
      output += char;
      index += 1;
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '"') { quote = char; output += char; index += 1; continue; }
    const previous = output.trimEnd().slice(-1);
    if ((previous === '{' || previous === ',') && /[A-Za-z_$]/.test(char)) {
      const match = source.slice(index).match(/^[A-Za-z_$][\w$-]*/);
      if (match) {
        let cursor = index + match[0].length;
        while (/\s/.test(source[cursor] || '')) cursor += 1;
        if (source[cursor] === ':') {
          output += JSON.stringify(match[0]);
          index += match[0].length;
          changed = true;
          continue;
        }
      }
    }
    output += char;
    index += 1;
  }
  return { source: output, changed };
}

function removeTrailingCommas(source) {
  let output = '';
  let quote = '';
  let escaped = false;
  let changed = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      output += char;
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '"') { quote = char; output += char; continue; }
    if (char === ',') {
      let cursor = index + 1;
      while (/\s/.test(source[cursor] || '')) cursor += 1;
      if (source[cursor] === '}' || source[cursor] === ']') { changed = true; continue; }
    }
    output += char;
  }
  return { source: output, changed };
}

function insertMissingCommas(source) {
  let output = '';
  let quote = '';
  let escaped = false;
  let changed = false;
  const isValueEnd = (char) => char === '"' || char === ']' || char === '}' || /[0-9a-zA-Z]/.test(char);
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      output += char;
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '"') { quote = char; output += char; continue; }
    if (isValueEnd(char)) {
      let cursor = index + 1;
      while (/\s/.test(source[cursor] || '')) cursor += 1;
      const next = source[cursor];
      const nextLooksLikeKey = next === '"' && /"\s*:/.test(source.slice(cursor));
      const nextLooksLikeValue = next === '"' || next === '{' || next === '[' || /[-0-9tfn]/.test(next || '');
      const previousNonSpace = `${output}${char}`.trimEnd().slice(-1);
      const insideObject = /["\]}0-9a-zA-Z]/.test(previousNonSpace);
      if (insideObject && (nextLooksLikeKey || (nextLooksLikeValue && (previousNonSpace === ']' || previousNonSpace === '}')))) {
        output += char + ',';
        changed = true;
        index = cursor - 1;
        continue;
      }
    }
    output += char;
  }
  return { source: output, changed };
}

function closeTruncatedContainers(source) {
  const stack = [];
  let quote = '';
  let escaped = false;
  for (const char of source) {
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '"') quote = char;
    else if (char === '{' || char === '[') stack.push(char === '{' ? '}' : ']');
    else if ((char === '}' || char === ']') && stack[stack.length - 1] === char) stack.pop();
  }
  let result = source;
  let changed = false;
  if (quote) { result += '"'; changed = true; }
  if (stack.length) { result += stack.reverse().join(''); changed = true; }
  return { source: result, changed };
}

function unwrapMarkdown(source) {
  const match = source.trim().match(/^```(?:json|jsonl|javascript)?\s*([\s\S]*?)\s*```$/i);
  return match ? { source: match[1], changed: true } : { source, changed: false };
}

export function repairJsonSource(source) {
  let current = String(source ?? '');
  const changes = [];
  const record = (result, message) => { current = result.source; if (result.changed) changes.push(message); };
  record(unwrapMarkdown(current), 'Removed Markdown code-block wrapping.');
  record(stripJsonCommentsForRepair(current), 'Removed // and /* */ comments.');
  record(convertSingleQuotedStrings(current), 'Converted single-quoted strings to JSON double-quoted strings.');
  record(quoteUnquotedKeys(current), 'Quoted unquoted object keys.');
  record(removeTrailingCommas(current), 'Removed trailing commas.');
  record(insertMissingCommas(current), 'Inserted missing commas between adjacent values.');
  record(closeTruncatedContainers(current), 'Closed truncated objects and arrays.');
  return { source: current, changes };
}

export function repairJsonLines(source) {
  const lines = String(source ?? '').split(/\r?\n/);
  const repaired = [];
  const changes = [];
  for (const [index, line] of lines.entries()) {
    if (!line.trim()) continue;
    const result = repairJsonSource(line);
    repaired.push(result.source.trim());
    result.changes.forEach((change) => changes.push(`Line ${index + 1}: ${change.replace(/\.$/, '')}.`));
  }
  return { source: repaired.join('\n'), changes };
}

export function getRepairChanges(source, mode = 'json') {
  return (mode === 'jsonl' ? repairJsonLines(source) : repairJsonSource(source)).changes;
}
