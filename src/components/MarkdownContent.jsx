/**
 * src/components/MarkdownContent.jsx
 * ------------------------------------------------------------------
 * GitHub Wiki-compatible Markdown renderer.
 *
 * Supports GFM plus authored raw HTML used by GitHub Wiki content:
 * images, HTML tables, <details>/<summary>, <pre lang="..."> blocks,
 * task lists, and GitHub-style alert blockquotes.
 */

import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import RunnableCode from './CodeRunner/RunnableCode.jsx';
import MermaidDiagram from './MermaidDiagram.jsx';
import './MarkdownContent.css';
import remarkInlineMarks from './remarkInlineMarks';

import { Children, cloneElement, isValidElement } from "react";

const ALERT_RE = /^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*\r?\n?/i;

const ALERT_LABELS = {
  note: "Note",
  tip: "Tip",
  important: "Important",
  warning: "Warning",
  caution: "Caution",
};

// Octicon-style 16x16 paths, drawn with currentColor so CSS controls the color.
const ALERT_ICON_PATHS = {
  note: "M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z",
  tip: "M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.211c-.04-.282-.163-.547-.37-.847a8.456 8.456 0 0 0-.542-.68c-.084-.1-.173-.205-.268-.32C3.201 7.75 2.5 6.766 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.516-.701 2.5-1.328 3.259-.095.115-.184.22-.268.319-.207.245-.383.453-.541.681-.208.3-.33.565-.37.847a.751.751 0 0 1-1.485-.212c.084-.593.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75ZM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM6 15.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z",
  important:
    "M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Zm7 2.25v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z",
  warning:
    "M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z",
  caution:
    "M4.47.22A.749.749 0 0 1 5 0h6c.199 0 .389.079.53.22l4.25 4.25c.141.14.22.331.22.53v6a.749.749 0 0 1-.22.53l-4.25 4.25A.749.749 0 0 1 11 16H5a.749.749 0 0 1-.53-.22L.22 11.53A.749.749 0 0 1 0 11V5c0-.199.079-.389.22-.53Zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z",
};

function AlertIcon({ type }) {
  return (
    <svg
      className="markdown-alert__icon"
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden="true"
      fill="currentColor"
    >
      <path d={ALERT_ICON_PATHS[type]} />
    </svg>
  );
}

// Safety net in case textContent isn't defined elsewhere in your file.
function textContent(node) {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textContent).join("");
  if (isValidElement(node)) return textContent(node.props.children);
  return "";
}

function alertType(children) {
  const match = textContent(children).match(ALERT_RE);
  return match ? match[1].toLowerCase() : null;
}

function stripAlertMarker(children, state = { done: false }) {
  return Children.map(children, (child) => {
    if (state.done) return child;

    if (typeof child === "string") {
      if (!child.trim()) return child;
      state.done = true;
      return child.replace(ALERT_RE, "");
    }

    if (isValidElement(child) && child.props.children != null) {
      return cloneElement(
        child,
        undefined,
        stripAlertMarker(child.props.children, state)
      );
    }

    return child;
  });
}

// js/javascript -> 'javascript', ts/typescript -> 'typescript', kt/kotlin -> 'kotlin', java -> 'java'
function normalizeRunnableLanguage(language = '') {
  const value = language.toLowerCase();
  if (value === 'ts' || value === 'typescript') return 'typescript';
  if (value === 'kt' || value === 'kotlin') return 'kotlin';
  if (value === 'java') return 'java';
  return 'javascript';
}

// Keep canonical Markdown links such as `[label](https://example.com)` as
// normal anchors, while trimming parser-provided whitespace before routing.
function normalizeMarkdownHref(href) {
  if (typeof href !== 'string') return undefined;
  const normalized = href.trim();
  return normalized || undefined;
}

function MarkdownCode({ inline, className, children, node, ...props }) {
  const match = /language-([\w-]+)/.exec(className || '');
  const language = match ? match[1] : 'text';
  const meta = node?.data?.meta || node?.properties?.meta || '';
  const normalizedLanguage = normalizeRunnableLanguage(language);
  const isRunnable = !inline && ['js', 'javascript', 'ts', 'typescript', 'kt', 'kotlin', 'java'].includes(language.toLowerCase()) && /(?:^|\s)runnable(?:\s|$)/.test(String(meta));

  if (!inline && language.toLowerCase() === 'mermaid') {
    return <MermaidDiagram chart={String(children).replace(/\n$/, '')} />;
  }

  if (isRunnable) {
    // key = language + source: navigating to another page must remount the box,
    // otherwise React reuses it and shows the previous page's edited code/output.
    const source = String(children).replace(/\n$/, '');
    return <RunnableCode key={`${normalizedLanguage}:${source}`} initial={source} language={normalizedLanguage} />;
  }

  if (inline) {
    return <code className="markdown-inline-code" {...props}>{children}</code>;
  }

  return (
    <SyntaxHighlighter
      style={oneDark}
      language={language}
      className="markdown-code-block"
      {...props}
    >
      {String(children).replace(/\n$/, '')}
    </SyntaxHighlighter>
  );
}

function MarkdownPre({ node, children, ...props }) {
  const codeNode = node?.children?.[0];
  const codeClasses = codeNode?.properties?.className || [];
  if (Array.isArray(codeClasses) && codeClasses.includes('language-mermaid')) {
    const chart = (codeNode.children || []).map((child) => child.value || '').join('').replace(/\n$/, '');
    return <MermaidDiagram chart={chart} />;
  }

  if (Array.isArray(codeClasses) && codeClasses.includes('runnable')) {
    const source = (codeNode.children || []).map((child) => child.value || '').join('').replace(/\n$/, '');
    const languageClass = codeClasses.find((name) => /^language-/.test(name)) || 'language-js';
    const language = normalizeRunnableLanguage(languageClass.replace(/^language-/, ''));
    return <RunnableCode key={`${language}:${source}`} initial={source} language={language} />;
  }

  const lang = props.lang || props['data-lang'];

  // GitHub Wiki content commonly uses <pre lang="java">...</pre>.
  // Convert that form to the same highlighted renderer used by fenced blocks.
  if (lang) {
    const content = textContent(children).replace(/\n$/, '');
    return (
      <SyntaxHighlighter
        style={oneDark}
        language={String(lang).replace(/^language-/, '')}
        className="markdown-code-block markdown-html-pre"
      >
        {content}
      </SyntaxHighlighter>
    );
  }

  return <pre className="markdown-pre" {...props}>{children}</pre>;
}

// Preserve the optional fenced-code meta word (e.g. ```js runnable) as a HAST property.
function remarkRunnableCode() {
  return (tree) => {
    const visit = (node) => {
      if (node?.type === 'code' && /^(js|javascript|ts|typescript|kt|kotlin|java)$/i.test(node.lang || '') && /(?:^|\s)runnable(?:\s|$)/.test(node.meta || '')) {
        node.data = node.data || {};
        node.data.hProperties = { ...(node.data.hProperties || {}), className: [`language-${node.lang}`, 'runnable'], meta: node.meta };
      }
      if (Array.isArray(node?.children)) node.children.forEach(visit);
    };
    visit(tree);
  };
}

function normalizeReferenceIdentifier(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

// Keep reference-style links such as `[label][1]`, `[label][]`, and `[1]`
// working across authored wiki Markdown, including definitions with titles.
// Standard CommonMark parsing resolves most references already; this
// compatibility pass also handles remaining mdast reference nodes.
function remarkReferenceLinks() {
  return (tree) => {
    const definitions = new Map();
    const collectDefinitions = (node) => {
      if (node?.type === 'definition') {
        definitions.set(normalizeReferenceIdentifier(node.identifier || node.label), node);
      }
      if (Array.isArray(node?.children)) node.children.forEach(collectDefinitions);
    };
    const resolveReferences = (node) => {
      if (node?.type !== 'linkReference' && node?.type !== 'imageReference') {
        if (Array.isArray(node?.children)) node.children.forEach(resolveReferences);
        return;
      }
      const definition = definitions.get(normalizeReferenceIdentifier(node.identifier || node.label));
      if (definition) {
        node.type = node.type === 'imageReference' ? 'image' : 'link';
        node.url = definition.url;
        node.title = definition.title || null;
        delete node.identifier;
        delete node.label;
        delete node.referenceType;
      }
      if (Array.isArray(node?.children)) node.children.forEach(resolveReferences);
    };
    collectDefinitions(tree);
    resolveReferences(tree);
  };
}

export default function MarkdownContent({ children }) {
  return (
    <ReactMarkdown
      //remarkPlugins={[remarkGfm, remarkReferenceLinks, remarkRunnableCode]}
      remarkPlugins={[
        [remarkGfm, { singleTilde: false }], // was: remarkGfm
        remarkInlineMarks,                   // new
        remarkReferenceLinks,
        remarkRunnableCode,
      ]}
      rehypePlugins={[rehypeRaw]}
      components={{
        code: MarkdownCode,
        pre: MarkdownPre,
        h1: ({ node, ...props }) => <h1 className="markdown-h1" {...props} />,
        h2: ({ node, ...props }) => <h2 className="markdown-h2" {...props} />,
        h3: ({ node, ...props }) => <h3 className="markdown-h3" {...props} />,
        h4: ({ node, ...props }) => <h4 className="markdown-h4" {...props} />,
        p: ({ node, ...props }) => <p className="markdown-p" {...props} />,
        ul: ({ node, className, ordered: _ordered, ...props }) => (
          <ul className={`markdown-ul${className ? ` ${className}` : ''}`} {...props} />
        ),
        ol: ({ node, ...props }) => <ol className="markdown-ol" {...props} />,
        li: ({ node, ordered: _ordered, ...props }) => <li className="markdown-li" {...props} />,
        img: ({ node, ...props }) => (
          <img className="markdown-image" loading="lazy" {...props} />
        ),
        table: ({ node, ...props }) => <table className="markdown-table" {...props} />,
        thead: ({ node, ...props }) => <thead className="markdown-thead" {...props} />,
        tbody: ({ node, ...props }) => <tbody className="markdown-tbody" {...props} />,
        tr: ({ node, ...props }) => <tr className="markdown-tr" {...props} />,
        th: ({ node, isHeader: _isHeader, ...props }) => <th className="markdown-th" {...props} />,
        td: ({ node, ...props }) => <td className="markdown-td" {...props} />,
        a: ({ node, href, children, ...props }) => {
          const normalizedHref = normalizeMarkdownHref(href);
          const isInternalRoute = normalizedHref?.startsWith('/') && !normalizedHref.startsWith('//');
          return isInternalRoute
            ? <Link className="markdown-a" to={normalizedHref} {...props}>{children}</Link>
            : <a className="markdown-a" href={normalizedHref} {...props}>{children}</a>;
        },
        mark: ({ node, ...props }) => <mark className="markdown-mark" {...props} />,
        sub: ({ node, ...props }) => <sub className="markdown-sub" {...props} />,
        sup: ({ node, ...props }) => <sup className="markdown-sup" {...props} />,
        
        kbd: ({ node, ...props }) => <kbd className="markdown-kbd" {...props} />,
        
        blockquote: ({ node, children, ...props }) => {
          const type = alertType(children);

          if (!type) {
            return (
              <blockquote className="markdown-blockquote" {...props}>
                {children}
              </blockquote>
            );
          }

          return (
            <blockquote
              className={`markdown-blockquote markdown-alert markdown-alert--${type}`}
              data-alert={type}
              {...props}
            >
              <div className="markdown-alert__title">
                <AlertIcon type={type} />
                <span>{ALERT_LABELS[type]}</span>
              </div>
              {stripAlertMarker(children)}
            </blockquote>
          );
        },
        details: ({ node, ...props }) => <details className="markdown-details" {...props} />,
        summary: ({ node, ...props }) => <summary className="markdown-summary" {...props} />,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
