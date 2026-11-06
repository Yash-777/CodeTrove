function normalizeLine(line, options) {
  let value = line;
  if (options.ignoreWhitespace) value = value.replace(/\s+/g, ' ').trim();
  if (options.ignoreCase) value = value.toLowerCase();
  return value;
}

function splitLines(value) {
  return value.replace(/\r\n?/g, '\n').split('\n');
}

/**
 * Produces an aligned, line-level comparison using an LCS dynamic program.
 * The input stays local in the browser; only normalized comparison keys are
 * used for matching, while original lines are preserved for display/copy.
 */
export function compareText(leftText, rightText, options = {}) {
  const settings = { ignoreWhitespace: false, ignoreCase: false, ...options };
  if (leftText === '' && rightText === '') {
    return { rows: [], changedRows: [], additions: 0, removals: 0, unchanged: 0 };
  }
  const left = splitLines(leftText);
  const right = splitLines(rightText);
  const leftKeys = left.map((line) => normalizeLine(line, settings));
  const rightKeys = right.map((line) => normalizeLine(line, settings));
  const matrix = Array.from({ length: left.length + 1 }, () => Array(right.length + 1).fill(0));

  for (let i = left.length - 1; i >= 0; i -= 1) {
    for (let j = right.length - 1; j >= 0; j -= 1) {
      matrix[i][j] = leftKeys[i] === rightKeys[j]
        ? matrix[i + 1][j + 1] + 1
        : Math.max(matrix[i + 1][j], matrix[i][j + 1]);
    }
  }

  const rows = [];
  let i = 0;
  let j = 0;
  while (i < left.length || j < right.length) {
    if (i < left.length && j < right.length && leftKeys[i] === rightKeys[j]) {
      rows.push({ type: 'equal', left: left[i], right: right[j], leftNumber: i + 1, rightNumber: j + 1 });
      i += 1;
      j += 1;
    } else if (j >= right.length || (i < left.length && matrix[i + 1][j] >= matrix[i][j + 1])) {
      rows.push({ type: 'remove', left: left[i], right: '', leftNumber: i + 1, rightNumber: null });
      i += 1;
    } else {
      rows.push({ type: 'add', left: '', right: right[j], leftNumber: null, rightNumber: j + 1 });
      j += 1;
    }
  }

  return {
    rows,
    changedRows: rows.filter((row) => row.type !== 'equal'),
    additions: rows.filter((row) => row.type === 'add').length,
    removals: rows.filter((row) => row.type === 'remove').length,
    unchanged: rows.filter((row) => row.type === 'equal').length,
  };
}

export function copyableLines(rows, side, changedOnly = false) {
  return rows
    .filter((row) => {
      if (changedOnly && row.type === 'equal') return false;
      if (side === 'left' && row.type === 'add') return false;
      if (side === 'right' && row.type === 'remove') return false;
      return true;
    })
    .map((row) => side === 'left' ? row.left : row.right)
    .join('\n');
}
