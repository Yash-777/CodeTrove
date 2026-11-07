import { ArrowLeftRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import './ToolBackLink.css';

const TOOL_BACK_LABEL = 'Back to Tools';

export default function ToolBackLink({ className = '' }) {
  const classes = ['tool-back-link', className].filter(Boolean).join(' ');
  return (
    <Link className={classes} to="/build/tools" aria-label={TOOL_BACK_LABEL}>
      <ArrowLeftRight size={16} aria-hidden="true" />
      {TOOL_BACK_LABEL}
    </Link>
  );
}
