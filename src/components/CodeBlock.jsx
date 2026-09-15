/**
 * src/components/CodeBlock.jsx
 * ------------------------------------------------------------------
 * Renders code with colors, using the open-source `react-syntax-
 * highlighter` library (wraps highlight.js) instead of a plain
 * <pre> tag - this is the "code view in different colors, like a
 * git wiki markdown code fence" feature. Picking a library here
 * instead of writing a tokenizer/colorizer ourselves is exactly the
 * "use an open-source library instead of more code" instruction -
 * syntax highlighting is a solved problem with mature libraries; a
 * hand-rolled version would be a lot of fragile code to maintain for
 * something users can't tell apart from the library version.
 *
 * `language` should be one of highlight.js's language names - the
 * ones this project uses are: 'java', 'javascript', 'json', 'bash'.
 * Falls back to no highlighting (plain monospace text) for anything
 * else, so an unrecognized/missing language never breaks the page.
 *
 * The color THEME (not to be confused with light/dark app theme,
 * though they're linked) swaps automatically based on the app's
 * light/dark mode via useTheme() - light code needs a light syntax
 * theme and vice versa for readable contrast.
 */

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '../context/ThemeContext.jsx';

export default function CodeBlock({ code, language = 'text' }) {
  const { mode } = useTheme();
  const isDark = mode === 'dark' || (mode === 'system' && document.documentElement.dataset.theme === 'dark');

  return (
    <SyntaxHighlighter
      language={language}
      style={isDark ? oneDark : oneLight}
      customStyle={{ borderRadius: '8px', fontSize: '0.85rem', margin: 0 }}
      wrapLongLines
    >
      {code}
    </SyntaxHighlighter>
  );
}
