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
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
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

function MarkdownCode({ inline, className, children, ...props }) {
  const match = /language-([\w-]+)/.exec(className || '');
  const language = match ? match[1] : 'text';

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

export default function MarkdownContent({ children }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
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
        li: ({ node, ...props }) => <li className="markdown-li" {...props} />,
        img: ({ node, ...props }) => (
          <img className="markdown-image" loading="lazy" {...props} />
        ),
        table: ({ node, ...props }) => <table className="markdown-table" {...props} />,
        thead: ({ node, ...props }) => <thead className="markdown-thead" {...props} />,
        tbody: ({ node, ...props }) => <tbody className="markdown-tbody" {...props} />,
        tr: ({ node, ...props }) => <tr className="markdown-tr" {...props} />,
        th: ({ node, ...props }) => <th className="markdown-th" {...props} />,
        td: ({ node, ...props }) => <td className="markdown-td" {...props} />,
        a: ({ node, ...props }) => <a className="markdown-a" {...props} />,
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
