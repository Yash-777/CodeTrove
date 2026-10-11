/**
 * src/pages/build/CompilerPage.jsx
 * ------------------------------------------------------------------
 * Route: /build/compiler   (deep link: /build/compiler?lang=kotlin)
 * Online compiler / playground for JavaScript, TypeScript, Kotlin and Java,
 * built on the same RunnableCode component used by `runnable` blocks in
 * the Markdown pages (side-by-side editor and output).
 *
 * - JavaScript / TypeScript run in the browser (sandboxed iframe + Web
 *   Worker, TypeScript is type-checked first).
 * - Kotlin is compiled by JetBrains' public service (api.kotlinlang.org).
 * - Java is compiled and run by Wandbox (open source, wandbox.org) with a
 *   selectable OpenJDK version (utils/javaApi.js).
 * All editors stay mounted so switching tabs keeps your code.
 */

import { Link, useSearchParams } from 'react-router-dom';
import RunnableCode from '../../components/CodeRunner/RunnableCode.jsx';
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
    code: KOTLIN_MAIN_SAMPLE,
    targets: KOTLIN_TARGET_OPTIONS,
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
        Scanner in = new Scanner(System.in);
        String name = in.hasNextLine() ? in.nextLine() : "World";
        int age = in.hasNextInt() ? in.nextInt() : 0;

        System.out.println("Hello, " + name + "!");
        System.out.println("In 5 years you will be " + (age + 5) + ".");
    }
}
`,
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
        A browser cannot run <code>javac</code> or a JVM, so this page sends your code to{' '}
        <a href="https://wandbox.org/" target="_blank" rel="noreferrer">Wandbox</a>, an open-source
        (<a href="https://github.com/melpon/wandbox" target="_blank" rel="noreferrer">melpon/wandbox</a>) online
        compiler that runs real OpenJDK builds in sandboxed containers. The calls are plain CORS requests, so it works
        on GitHub Pages with no backend of our own. Press <strong>Run</strong> (or <kbd>Ctrl/Cmd</kbd> + <kbd>Enter</kbd>):
      </p>
      <ol>
        <li>The page asks <code>GET /api/list.json</code> for the available Java compilers (the runtime dropdown).</li>
        <li>Run sends <code>POST /api/compile.json</code> with your source, the selected runtime and STDIN.</li>
        <li>Wandbox compiles and runs it, then returns the compiler messages and the program&apos;s output, which are shown on the right.</li>
      </ol>
      <pre className="cp-about__code">{`POST https://wandbox.org/api/compile.json
{"code":"public class Main { ... }","compiler":"openjdk-jdk-21+35","stdin":"Alice\n30","options":"","compiler-option-raw":"","runtime-option-raw":"","save":false}

{"status":"0","compiler_error":"","program_output":"Hello, Alice!\n","program_error":""}`}</pre>

      <h3>Runtime version</h3>
      <p>
        The <strong>Java</strong> dropdown above the editor lists the JDK versions the service offers (newest first;
        the default is the newest LTS available). The selected id is sent as <code>compiler</code>, so you can check
        how code behaves on, for example, Java 17 versus 21. The editor file is <code>Main.java</code> with{' '}
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
        <li>Your code and STDIN are sent to wandbox.org, nothing is saved (<code>save:false</code>), an internet
          connection is needed, and the public service may rate-limit heavy use or stop long-running programs.</li>
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
          <RunnableCode
            variant="playground"
            language={item.key}
            initial={item.code}
            initialInput={item.input}
            targets={item.targets}
          />
        </div>
      ))}

      {active.key === 'kotlin' && <KotlinAbout />}
      {active.key === 'java' && <JavaAbout />}

      <p className="cp-note">
        JavaScript and TypeScript run in your browser (isolated, 10&nbsp;s limit, no DOM). Kotlin is compiled by
        JetBrains&apos; public service (api.kotlinlang.org) and Java by the open-source Wandbox service (wandbox.org), so the Kotlin or Java code you run is sent to those services.
      </p>
    </div>
  );
}
