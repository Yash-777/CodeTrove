/**
 * src/pages/build/CompilerPage.jsx
 * ------------------------------------------------------------------
 * Route: /build/compiler   (deep link: /build/compiler?lang=kotlin)
 * Online compiler / playground for JavaScript, TypeScript and Kotlin,
 * built on the same RunnableCode component used by `runnable` blocks in
 * the Markdown pages (side-by-side editor and output).
 *
 * - JavaScript / TypeScript run in the browser (sandboxed iframe + Web
 *   Worker, TypeScript is type-checked first).
 * - Kotlin is compiled by JetBrains' public service (api.kotlinlang.org).
 * All three editors stay mounted so switching tabs keeps your code.
 */

import { Link, useSearchParams } from 'react-router-dom';
import RunnableCode from '../../components/CodeRunner/RunnableCode.jsx';
import './CompilerPage.css';

const LANGUAGES = [
  {
    key: 'javascript',
    param: 'js',
    label: 'JavaScript',
    learnTo: '/content/tree/languages/javascript',
    docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
    input: 'Alice\n30',
    code: `// Read input with readLine() - one value per line (see STDIN above)
const name = readLine() ?? 'World';
const age = Number(readLine() ?? 0);

console.log(\`Hello, \${name}!\`);
console.log(\`In 5 years you will be \${age + 5}.\`);
`,
  },
  {
    key: 'typescript',
    param: 'ts',
    label: 'TypeScript',
    learnTo: '/content/tree/languages/typescript',
    docsUrl: 'https://www.typescriptlang.org/docs/',
    input: 'Alice\n30',
    code: `interface Person {
  name: string;
  age: number;
}

const person: Person = {
  name: readLine() ?? 'World',
  age: Number(readLine() ?? 0),
};

console.log(\`Hello, \${person.name}!\`);
console.log(\`In 5 years you will be \${person.age + 5}.\`);
`,
  },
  {
    key: 'kotlin',
    param: 'kt',
    label: 'Kotlin',
    learnTo: '/content/tree/languages/kotlin',
    docsUrl: 'https://kotlinlang.org/docs/home.html',
    input: 'Kotlin 2026',
    code: `// Program arguments (above) arrive in args
fun main(args: Array<String>) {
    val name = args.firstOrNull() ?: "World"
    println("Hello, $name!")
    println("Received \${args.size} argument(s)")
}
`,
  },
];

function pickLanguage(value) {
  const v = (value || '').toLowerCase();
  return LANGUAGES.find((item) => item.param === v || item.key === v || (v === 'kotlin' && item.key === 'kotlin')) || LANGUAGES[0];
}

export default function CompilerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const active = pickLanguage(searchParams.get('lang'));

  return (
    <div className="content-page cp-page">
      <div className="cp-head">
        <div>
          <h1>{active.label} Playground</h1>
          <p className="cp-subtitle">Write, run, and share code snippets - no setup required.</p>
        </div>
        <div className="cp-links">
          <Link className="cp-link cp-link--primary" to={active.learnTo}>Learn {active.label}</Link>
          <a className="cp-link" href={active.docsUrl} target="_blank" rel="noreferrer">Read Docs</a>
        </div>
      </div>

      <div className="cp-tabs" role="tablist" aria-label="Language">
        {LANGUAGES.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={item.key === active.key}
            className={`cp-tab${item.key === active.key ? ' is-active' : ''}`}
            onClick={() => setSearchParams({ lang: item.param }, { replace: true })}
          >
            {item.label}
          </button>
        ))}
      </div>

      {LANGUAGES.map((item) => (
        <div key={item.key} hidden={item.key !== active.key} role="tabpanel" aria-label={`${item.label} editor`}>
          <RunnableCode
            variant="playground"
            language={item.key}
            initial={item.code}
            initialInput={item.input}
          />
        </div>
      ))}

      <p className="cp-note">
        JavaScript and TypeScript run in your browser (isolated, 10&nbsp;s limit, no DOM). Kotlin is compiled by
        JetBrains&apos; public service (api.kotlinlang.org), so the Kotlin code you run is sent to that service.
      </p>
    </div>
  );
}
