/**
 * src/components/MarkdownContent.jsx
 * ------------------------------------------------------------------
 * Renders markdown content with proper styling. Handles:
 *   - Code blocks with syntax highlighting (via react-syntax-highlighter)
 *   - Tables, lists, links, emphasis
 *   - GitHub flavored markdown (GFM)
 */

import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import './MarkdownContent.css';

export default function MarkdownContent({ children }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const language = match ? match[1] : 'text';

          if (inline) {
            return <code className="markdown-inline-code">{children}</code>;
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
        },
        h1: ({ node, ...props }) => <h1 className="markdown-h1" {...props} />,
        h2: ({ node, ...props }) => <h2 className="markdown-h2" {...props} />,
        h3: ({ node, ...props }) => <h3 className="markdown-h3" {...props} />,
        h4: ({ node, ...props }) => <h4 className="markdown-h4" {...props} />,
        p: ({ node, ...props }) => <p className="markdown-p" {...props} />,
        ul: ({ node, ...props }) => <ul className="markdown-ul" {...props} />,
        ol: ({ node, ...props }) => <ol className="markdown-ol" {...props} />,
        li: ({ node, ...props }) => <li className="markdown-li" {...props} />,
        table: ({ node, ...props }) => <table className="markdown-table" {...props} />,
        th: ({ node, ...props }) => <th className="markdown-th" {...props} />,
        td: ({ node, ...props }) => <td className="markdown-td" {...props} />,
        a: ({ node, ...props }) => <a className="markdown-a" {...props} />,
        blockquote: ({ node, ...props }) => <blockquote className="markdown-blockquote" {...props} />,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
