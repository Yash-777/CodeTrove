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
import './MarkdownContent.css';

function textContent(value) {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(textContent).join('');
  if (value?.props?.children) return textContent(value.props.children);
  return '';
}

function alertType(children) {
  const match = textContent(children).match(/^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);
  return match ? match[1].toLowerCase() : null;
}

// js/javascript -> 'javascript', ts/typescript -> 'typescript', kt/kotlin -> 'kotlin', java -> 'java'
function normalizeRunnableLanguage(language = '') {
  const value = language.toLowerCase();
  if (value === 'ts' || value === 'typescript') return 'typescript';
  if (value === 'kt' || value === 'kotlin') return 'kotlin';
  if (value === 'java') return 'java';
  return 'javascript';
}

const NETWORKING_DIAGRAMS = {
  'request-lifecycle': 'request-lifecycle.png',
  'dns-resolution': 'dns-resolution.png',
  'url-anatomy': 'url-anatomy.png',
  'tls-trust': 'tls-trust.png',
  'proxy-comparison': 'proxy-comparison.png',
  'forward-proxy': 'proxy-comparison.png',
  'reverse-proxy': 'proxy-comparison.png',
  'protocol-transfers': 'protocol-transfers.png',
  'socket-lifecycle': 'socket-lifecycle.png',
  'ftp-connections': 'ftp-connections.png',
  'dns-tls-http': 'dns-tls-http.png',
  'smtp-flow': 'smtp-flow.png',
};

function resolveMarkdownImage(src) {
  if (typeof src !== 'string' || !src.startsWith('networking-diagram:')) return src;
  const name = NETWORKING_DIAGRAMS[src.slice('networking-diagram:'.length)];
  return name ? `${import.meta.env.BASE_URL}networking/${name}` : src;
}

function MarkdownCode({ inline, className, children, node, ...props }) {
  const match = /language-([\w-]+)/.exec(className || '');
  const language = match ? match[1] : 'text';
  const meta = node?.data?.meta || node?.properties?.meta || '';
  const normalizedLanguage = normalizeRunnableLanguage(language);
  const isRunnable = !inline && ['js', 'javascript', 'ts', 'typescript', 'kt', 'kotlin', 'java'].includes(language.toLowerCase()) && /(?:^|\s)runnable(?:\s|$)/.test(String(meta));

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

export default function MarkdownContent({ children }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkRunnableCode]}
      rehypePlugins={[rehypeRaw]}
      components={{
        code: MarkdownCode,
        pre: MarkdownPre,
        h1: ({ node, ...props }) => <h1 className="markdown-h1" {...props} />,
        h2: ({ node, ...props }) => <h2 className="markdown-h2" {...props} />,
        h3: ({ node, ...props }) => <h3 className="markdown-h3" {...props} />,
        h4: ({ node, ...props }) => <h4 className="markdown-h4" {...props} />,
        p: ({ node, ...props }) => <p className="markdown-p" {...props} />,
        ul: ({ node, className, ...props }) => (
          <ul className={`markdown-ul${className ? ` ${className}` : ''}`} {...props} />
        ),
        ol: ({ node, ...props }) => <ol className="markdown-ol" {...props} />,
        li: ({ node, ordered: _ordered, ...props }) => <li className="markdown-li" {...props} />,
        img: ({ node, ...props }) => (
          <img className="markdown-image" loading="lazy" {...props} src={resolveMarkdownImage(props.src)} />
        ),
        table: ({ node, ...props }) => <table className="markdown-table" {...props} />,
        thead: ({ node, ...props }) => <thead className="markdown-thead" {...props} />,
        tbody: ({ node, ...props }) => <tbody className="markdown-tbody" {...props} />,
        tr: ({ node, ...props }) => <tr className="markdown-tr" {...props} />,
        th: ({ node, ...props }) => <th className="markdown-th" {...props} />,
        td: ({ node, ...props }) => <td className="markdown-td" {...props} />,
        a: ({ node, href, children, ...props }) => {
          const isInternalRoute = href?.startsWith('/') && !href.startsWith('//');
          return isInternalRoute
            ? <Link className="markdown-a" to={href} {...props}>{children}</Link>
            : <a className="markdown-a" href={href} {...props}>{children}</a>;
        },
        blockquote: ({ node, children, ...props }) => {
          const type = alertType(children);
          return (
            <blockquote
              className={`markdown-blockquote${type ? ` markdown-alert markdown-alert--${type}` : ''}`}
              data-alert={type || undefined}
              {...props}
            >
              {children}
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
