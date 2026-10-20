/**
 * src/pages/build/CompilerPage.jsx
 * ------------------------------------------------------------------
 * Route: /build/compiler   (deep link: /build/compiler?lang=kotlin)
 * Online compiler / playground for JavaScript, TypeScript, Kotlin, Java, C,
 * C++ and Python,
 * built on the same RunnableCode component used by `runnable` blocks in
 * the Markdown pages (side-by-side editor and output).
 *
 * - JavaScript / TypeScript run in the browser (sandboxed iframe + Web
 *   Worker, TypeScript is type-checked first).
 * - Kotlin is compiled by JetBrains' public service (api.kotlinlang.org).
 * - Java is compiled and run by Wandbox by default, or Judge0, with a
 *   provider-specific selectable Java runtime (utils/javaApi.js).
 * - C, C++ and Python are compiled and run by Judge0 with a selectable
 *   language runtime (utils/judge0Api.js).
 * All editors stay mounted so switching tabs keeps your code.
 */

import { Link, useSearchParams } from 'react-router-dom';
import RunnableCode from '../../components/CodeRunner/RunnableCode.jsx';
import SqlPlayground from '../../components/CodeRunner/SqlPlayground.jsx';
import { KOTLIN_TARGETS } from '../../utils/kotlinApi.js';
import './CompilerPage.css';

const KOTLIN_MAIN_SAMPLE = `// Program arguments (above) arrive in args
fun main(args: Array<String>) {
    val name = args.firstOrNull() ?: "World"
    println("Hello, $name!")
    println("Received \${args.size} argument(s)")
}
`;

const KOTLIN_JUNIT_SAMPLE = `import org.junit.Test
import kotlin.test.assertEquals

class SampleTest {
    @Test
    fun additionWorks() {
        assertEquals(4, 2 + 2)
    }
}
`;

// Dropdown entries come from KOTLIN_TARGETS (utils/kotlinApi.js); each gets its sample code here.
const KOTLIN_SAMPLES = { java: KOTLIN_MAIN_SAMPLE, junit: KOTLIN_JUNIT_SAMPLE };
const KOTLIN_TARGET_OPTIONS = KOTLIN_TARGETS.map((target) => ({ ...target, code: KOTLIN_SAMPLES[target.confType] || KOTLIN_MAIN_SAMPLE }));

const JAVASCRIPT_SAMPLES = {
  es5: `// ES5 style: constructor function and prototype
function Person(name, age) {
    this.name = name;
    this.age = age;
}

Person.prototype.greet = function () {
    console.log('Hello, ' + this.name + '!');
    console.log('In 5 years you will be ' + (this.age + 5) + '.');
};

var person = new Person(readLine() || 'World', Number(readLine() || 0));
person.greet();
`,
  es6: `// ES6 style: class syntax
class Person {
    constructor(name, age) {
        this.name = name;
        this.age = age;
    }

    greet() {
        console.log('Hello, ' + this.name + '!');
        console.log('In 5 years you will be ' + (this.age + 5) + '.');
    }
}

const person = new Person(readLine() || 'World', Number(readLine() || 0));
person.greet();
`,
};

const LANGUAGES = [
  {
    key: 'javascript',
    param: 'js',
    label: 'JavaScript',
    learnTo: '/content/tree/languages/javascript',
    docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
    input: 'Alice\n30',
    code: JAVASCRIPT_SAMPLES.es6,
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
    code: KOTLIN_MAIN_SAMPLE,
    targets: KOTLIN_TARGET_OPTIONS,
  },
  {
    key: 'c',
    param: 'c',
    label: 'C',
    learnTo: '/build/compiler?lang=c',
    docsUrl: 'https://en.cppreference.com/w/c',
    input: 'Alice\n30',
    code: `#include <stdio.h>

int main(void) {
    char name[50];
    int age;
    scanf("%49s %d", name, &age);
    printf("Hello, %s!\\n", name);
    printf("In 5 years you will be %d.\\n", age + 5);
    return 0;
}
`,
  },
  {
    key: 'cpp',
    param: 'cpp',
    label: 'C++',
    learnTo: '/build/compiler?lang=cpp',
    docsUrl: 'https://en.cppreference.com/w/cpp',
    input: 'Alice\n30',
    code: `#include <iostream>
#include <string>

int main() {
    std::string name;
    int age;
    std::cin >> name >> age;
    std::cout << "Hello, " << name << "!\\n";
    std::cout << "In 5 years you will be " << age + 5 << ".\\n";
}
`,
  },
  {
    key: 'python',
    param: 'python',
    label: 'Python',
    learnTo: '/build/compiler?lang=python',
    docsUrl: 'https://docs.python.org/3/tutorial/',
    input: 'Alice\n30',
    code: `name = input().strip() or "World"
age = int(input() or 0)

print(f"Hello, {name}!")
print(f"In 5 years you will be {age + 5}.")
`,
  },
  {
    key: 'java',
    param: 'java',
    label: 'Java',
    learnTo: '/content/tree/languages/java',
    docsUrl: 'https://docs.oracle.com/en/java/javase/',
    input: 'Alice\n30',
    code: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        // Display the Java version used by the selected runtime.
        printJavaVersion();

        Scanner in = new Scanner(System.in);
        String name = in.hasNextLine() ? in.nextLine() : "World";
        int age = in.hasNextInt() ? in.nextInt() : 0;

        System.out.println("Hello, " + name + "!");
        System.out.println("In 5 years you will be " + (age + 5) + ".");
    }

    /**
     * Detects Java 9+ with reflection, while remaining compilable on Java 8.
     */
    public static void printJavaVersion() {
        String version;
        try {
            version = java.lang.Runtime.class.getMethod("version").invoke(null).toString();
        } catch (Exception e) {
            // Runtime.version() does not exist on Java 8 and earlier.
            version = System.getProperty("java.version");
        }
        System.out.println("Running Java Version: " + version);
    }
}
`,
  },
  {
    key: 'sql',
    param: 'sql',
    label: 'SQL',
    learnTo: '/content/tree/databases/sql',
    docsUrl: 'https://www.sqlite.org/lang.html',
    code: '',
  },
];

function pickLanguage(value) {
  const v = (value || '').toLowerCase();
  return LANGUAGES.find((item) => item.param === v || item.key === v || (v === 'kotlin' && item.key === 'kotlin')) || LANGUAGES[0];
}


function KotlinAbout() {
  return (
    <section className="cp-about" aria-labelledby="cp-about-kotlin">
      <h2 id="cp-about-kotlin">About the Kotlin playground</h2>
      <p>
        <a href="https://kotlinlang.org/" target="_blank" rel="noreferrer">Kotlin</a> is a modern, concise,
        statically typed language from JetBrains - the official language for Android and widely used for
        server-side (JVM) development. Try more in the official{' '}
        <a href="https://play.kotlinlang.org/" target="_blank" rel="noreferrer">Kotlin Playground</a> or work
        through the interactive{' '}
        <a href="https://play.kotlinlang.org/koans/overview" target="_blank" rel="noreferrer">Kotlin Koans</a>.
      </p>

      <h3>How Run works</h3>
      <p>
        Kotlin cannot be compiled in the browser, so this page calls the public compiler service behind
        play.kotlinlang.org (<code>api.kotlinlang.org</code>). These are plain CORS requests, so it works on
        GitHub Pages with no backend of our own. Press <strong>Run</strong> (or <kbd>Ctrl/Cmd</kbd> + <kbd>Enter</kbd>):
      </p>
      <pre className="cp-about__code">{`POST https://api.kotlinlang.org/api/<version>/compiler/run
{"args":"","files":[{"name":"File.kt","text":"fun main() { println(\"Hello, Kotlin!\") }","publicId":""}],"confType":"java"}

{"errors":{"File.kt":[]},"exception":null,"jvmByteCode":null,"text":"<outStream>Hello, Kotlin!\n</outStream>"}`}</pre>

      <h3>Target (confType)</h3>
      <p>
        The <strong>Target</strong> dropdown above the editor chooses the <code>confType</code> sent in the
        payload. <code>java</code> compiles and runs <code>main()</code> on the JVM; <code>junit</code> runs
        <code> @Test</code> functions and lists passed/failed tests. Switching target swaps in that target&apos;s
        sample unless you have already edited the code.
      </p>

      <h3>Errors, output and privacy</h3>
      <ul>
        <li>Compiler errors are underlined while you type and after Run; the output shows
          {' '}<code>Main.kt:3:13: error: ...</code>, or the program&apos;s output, or a Java stack trace for exceptions.</li>
        <li>Each Kotlin box says <em>Compiled by JetBrains · api.kotlinlang.org</em> because your snippet text is
          sent to that service.</li>
        <li>An internet connection is required; when offline the output shows a clear message.</li>
      </ul>
    </section>
  );
}

function JavaAbout() {
  return (
    <section className="cp-about" aria-labelledby="cp-about-java">
      <h2 id="cp-about-java">About the Java playground</h2>
      <p>
        <a href="https://openjdk.org/" target="_blank" rel="noreferrer">Java</a> is a statically typed,
        object-oriented language that compiles to bytecode and runs on the JVM. Learn the language in the{' '}
        <a href="https://docs.oracle.com/javase/tutorial/" target="_blank" rel="noreferrer">Oracle Java Tutorials</a>.
      </p>

      <h3>How Run works</h3>
      <p>
        A browser cannot run <code>javac</code> or a JVM, so this page sends your code to the selected execution API.
        Wandbox is the default; Judge0 is available when you need its REST submission model or a self-hosted Judge0
        service. The calls are plain CORS requests, so it works on GitHub Pages with no backend of our own. Press{' '}
        <strong>Run</strong> (or <kbd>Ctrl/Cmd</kbd> + <kbd>Enter</kbd>):
      </p>
      <ol>
        <li>Select <strong>API</strong> first. The page then loads the Java runtimes offered by that provider.</li>
        <li>Select the Java runtime. Run sends your source and STDIN using the provider&apos;s request format.</li>
        <li>The response is normalized into compiler output, program output, errors, status, and editor diagnostics.</li>
      </ol>
      <pre className="cp-about__code">{`POST https://wandbox.org/api/compile.json
{"code":"public class Main { ... }","compiler":"openjdk-jdk-21+35","stdin":"Alice\n30","options":"","compiler-option-raw":"","runtime-option-raw":"","save":false}

{"status":"0","compiler_error":"","program_output":"Hello, Alice!\n","program_error":""}`}</pre>

      <h3>Judge0 API flow</h3>
      <p>
        <a href="https://github.com/judge0/judge0" target="_blank" rel="noreferrer">Judge0</a> is an open-source,
        sandboxed REST execution system. CodeTrove first reads its available language IDs, filters the Java entries,
        and uses the selected ID for the submission. The public Judge0 CE endpoint is shown below; a self-hosted
        deployment can use the same contract with its own URL and installed JDK versions.
      </p>
      <pre className="cp-about__code">{`GET https://ce.judge0.com/languages

POST https://ce.judge0.com/submissions?base64_encoded=false&wait=true
{"source_code":"public class Main { ... }","language_id":91,"stdin":"Alice\\n30","cpu_time_limit":5,"wall_time_limit":10,"memory_limit":256000}

{"stdout":"Hello, Alice!\\n","stderr":"","compile_output":null,"status":{"id":3,"description":"Accepted"},"time":"0.08","memory":12340}`}</pre>
      <p>
        Judge0 returns <code>compile_output</code> for compiler diagnostics, <code>stdout</code> for normal program
        output, <code>stderr</code> for runtime errors, and a <code>status</code> object describing the execution.
        CodeTrove displays those fields in the same output panel and applies Java compiler diagnostics to the editor.
        <code>wait=true</code> requests the completed result in one response; Judge0 also supports token-based polling,
        which is preferable for production-scale or self-hosted deployments where synchronous waiting is disabled.
      </p>

      <h3>Runtime version</h3>
      <p>
        The <strong>API</strong> dropdown comes before the <strong>Java</strong> dropdown. The Java list is refreshed
        from the selected provider: Wandbox exposes compiler names such as <code>openjdk-jdk-21+35</code>, while
        Judge0 exposes numeric language IDs such as <code>91</code>. Versions are shown newest first where possible;
        unavailable versions are not simulated or added manually. The selected provider and runtime are sent with each
        request. The editor file is <code>Main.java</code> with{' '}
        <code>public class Main</code>; because the service saves the source under its own file name, the{' '}
        <code>public</code> modifier of top-level classes is removed from the copy that is sent (line and column
        numbers are unchanged), so the same code also compiles on your machine.
      </p>

      <h3>Errors, input and privacy</h3>
      <ul>
        <li>Compile errors from <code>javac</code> are shown as <code>Main.java:5: error: ...</code> and underlined in the
          editor after Run; runtime exceptions show the Java stack trace.</li>
        <li>The <strong>STDIN</strong> box feeds <code>System.in</code> (for example <code>new Scanner(System.in)</code>).</li>
        <li>Code is not compiled while you type: Run executes the program, so it only goes to the service when you press it.</li>
        <li>Your code and STDIN are sent to the selected provider. Wandbox sets <code>save:false</code>; an internet
          connection is needed, and public services may rate-limit heavy use or stop long-running programs.</li>
      </ul>
    </section>
  );
}

const NATIVE_ABOUT = {
  c: { label: 'C', file: 'main.c', pattern: 'C (GCC or Clang)' },
  cpp: { label: 'C++', file: 'main.cpp', pattern: 'C++ (GCC or Clang)' },
  python: { label: 'Python', file: 'main.py', pattern: 'Python (3.x)' },
};

function NativeAbout({ language }) {
  const info = NATIVE_ABOUT[language];
  return (
    <section className="cp-about" aria-labelledby={`cp-about-${language}`}>
      <h2 id={`cp-about-${language}`}>About the {info.label} playground</h2>
      <p>
        This editor sends <code>{info.file}</code> to the open-source{' '}
        <a href="https://github.com/judge0/judge0" target="_blank" rel="noreferrer">Judge0</a> execution API.
        Choose a discovered <strong>Runtime</strong> above, enter optional standard input, and press <strong>Run</strong>.
      </p>
      <h3>Runtime discovery and execution flow</h3>
      <ol>
        <li>CodeTrove calls <code>GET https://ce.judge0.com/languages</code> and keeps {info.pattern} entries.</li>
        <li>The Runtime dropdown displays the available versions, newest first where the service provides version information.</li>
        <li>Run submits the source and selected language ID to Judge0:</li>
      </ol>
      <pre className="cp-about__code">{`POST https://ce.judge0.com/submissions?base64_encoded=false&wait=true
{"source_code":"...","language_id":109,"stdin":"Alice\\n30","cpu_time_limit":5,"wall_time_limit":10,"memory_limit":256000}

{"stdout":"Hello, Alice!\\n","stderr":"","compile_output":null,"status":{"id":3,"description":"Accepted"}}`}</pre>
      <p>
        CodeTrove displays <code>compile_output</code> for compiler messages, <code>stdout</code> for normal output,
        <code>stderr</code> for runtime errors, and <code>status.description</code> for execution status. The selected
        runtime ID and source are sent to the public service, so an internet connection is required and public rate
        limits may apply. A self-hosted Judge0-compatible endpoint can provide different runtime versions.
      </p>
    </section>
  );
}

function SqlAbout() {
  return (
    <section className="cp-about" aria-labelledby="cp-about-sql">
      <h2 id="cp-about-sql">About the SQL playground</h2>
      <p>
        Choose SQLite, MySQL, PostgreSQL, Microsoft SQL Server (T-SQL), or MariaDB from the <strong>Database</strong>
        dropdown. The selection changes SQL highlighting, local syntax diagnostics, and the dialect-specific formatter
        rules. The parser checks grammar while you edit and underlines a reported token; click a diagnostic below the
        editor to jump to its line.
      </p>
      <p>
        Only SQLite is an execution engine in this browser playground: it runs locally through SQL.js WebAssembly in
        a dedicated worker, with a temporary in-memory database. The other dialects are syntax/format modes only; they
        do not connect to MySQL, PostgreSQL, MariaDB, or SQL Server, and pressing Run is disabled for those choices.
        The local parser checks grammar, not database objects, types, permissions, server versions, query plans, or
        runtime behavior. SQLite-only commands such as <code>EXPLAIN QUERY PLAN</code> will not work in other engines.
      </p>
      <h3>Salary-ranking interview examples</h3>
      <p>
        Use the <strong>Example</strong> menu and sample button to load a full employee dataset, then practice finding
        the third-highest distinct salary and the second-highest distinct salary in each department. Both use a
        correlated <code>COUNT(DISTINCT ...)</code> subquery, so ties share a rank and the examples work across the
        listed dialect grammars. The department query compares the inner and outer department, restarting its rank
        within each department. With the bundled data, the global third salary is <code>112000</code>; the department
        results are Engineering <code>118000</code>, Design <code>98000</code>, and Sales <code>93000</code>.
      </p>
      <p>
        Results are limited to the first 200 rows per result set. A query is stopped after 10 seconds; if that limit
        is reached, the isolated worker restarts and its in-memory database is cleared. SQLite data is never sent to a
        remote database service.
      </p>
      <h3>Open-source components and documentation</h3>
      <ul>
        <li><a href="https://github.com/sql-js/sql.js" target="_blank" rel="noreferrer">SQL.js</a> is MIT-licensed SQLite compiled to WebAssembly for browser use.</li>
        <li><a href="https://github.com/codemirror/lang-sql" target="_blank" rel="noreferrer">CodeMirror SQL language support</a> is MIT-licensed and provides SQL dialect highlighting and completion.</li>
        <li><a href="https://github.com/sql-formatter-org/sql-formatter" target="_blank" rel="noreferrer">SQL Formatter</a> is an open-source formatter with dialect-specific SQL formatting options.</li>
        <li><a href="https://github.com/taozhi8833998/node-sql-parser" target="_blank" rel="noreferrer">node-sql-parser</a> is an open-source local parser used for dialect-specific grammar diagnostics.</li>
        <li><a href="https://www.sqlite.org/lang.html" target="_blank" rel="noreferrer">SQLite SQL language reference</a> documents the dialect executed by this playground.</li>
      </ul>
    </section>
  );
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
          {item.key === 'sql' ? (
            <SqlPlayground isActive={item.key === active.key} />
          ) : (
            <RunnableCode
              variant="playground"
              language={item.key}
              initial={item.code}
              initialInput={item.input}
              targets={item.targets}
              versionSamples={item.key === 'javascript' ? JAVASCRIPT_SAMPLES : null}
              isActive={item.key === active.key}
            />
          )}
        </div>
      ))}

      {active.key === 'kotlin' && <KotlinAbout />}
      {active.key === 'java' && <JavaAbout />}
      {NATIVE_ABOUT[active.key] && <NativeAbout language={active.key} />}
      {active.key === 'sql' && <SqlAbout />}

      {active.key !== 'sql' && <p className="cp-note">
        JavaScript and TypeScript run in an isolated browser worker (10&nbsp;s limit, no DOM). JavaScript, TypeScript,
        Java, C, C++ and Python syntax checks run locally in the browser; formatting also runs locally with Prettier,
        clang-format WASM or Ruff WASM. Kotlin diagnostics and execution use JetBrains&apos; public service, and Run
        sends Java to Wandbox/Judge0 and C, C++ or Python to Judge0. Kotlin&apos;s built-in Format action currently
        normalizes indentation only; use a full Kotlin editor/formatter for project-wide ktfmt formatting.
      </p>}

      {active.key !== 'sql' && <section className="cp-about cp-editor-references" aria-labelledby="cp-editor-references-title">
        <h2 id="cp-editor-references-title">More editors and references</h2>
        <p>Use these free web tools when you need a full editor, language extensions, or a development environment beyond this browser playground.</p>
        <div className="cp-links">
          <a className="cp-link" href="https://vscode.dev/" target="_blank" rel="noreferrer">Open VS Code for the Web</a>
          <a className="cp-link" href="https://code.visualstudio.com/docs/remote/vscode-web" target="_blank" rel="noreferrer">VS Code Web documentation</a>
          <a className="cp-link" href="https://prettier.io/docs/browser" target="_blank" rel="noreferrer">Prettier browser API</a>
        </div>
      </section>}
    </div>
  );
}
