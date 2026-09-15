/**
 * src/components/PasswordField.jsx
 * ------------------------------------------------------------------
 * A password <input> plus:
 *   - a 5-segment strength meter (colors from
 *     utils/passwordStrength.js STRENGTH_LEVELS)
 *   - a checklist of the 4 rules, ticking off as they're met
 *   - a show/hide toggle (Eye / EyeOff icons from lucide-react - an
 *     open-source icon library, used instead of drawing our own SVGs)
 *   - a "Generate strong password" button using the Web Crypto API
 *     (see utils/passwordStrength.js for why, not Math.random())
 *
 * `value` / `onChange` follow the standard "controlled input"
 * pattern - the parent (SignUpPage) owns the actual password string
 * in its own useState, and passes it down along with a setter. This
 * component never keeps its own copy of the password, only UI state
 * (show/hide).
 */

import { useState } from 'react';
import { Eye, EyeOff, Wand2, Check, X } from 'lucide-react';
import { scorePassword, STRENGTH_LEVELS, generateStrongPassword } from '../utils/passwordStrength.js';
import './PasswordField.css';

export default function PasswordField({ value, onChange, id = 'password' }) {
  const [visible, setVisible] = useState(false);
  const { score, checks } = scorePassword(value);
  const level = STRENGTH_LEVELS[Math.max(score - 1, 0)]; // score 0 still shows the weakest bar/color while typing

  function handleGenerate() {
    const generated = generateStrongPassword(12);
    onChange(generated);
    setVisible(true); // reveal it immediately so they can see/copy what was generated
  }

  return (
    <div className="password-field">
      <div className="password-field__input-row">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="new-password"
          required
        />
        <button
          type="button"
          className="password-field__icon-btn"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          title={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
        <button
          type="button"
          className="password-field__icon-btn"
          onClick={handleGenerate}
          aria-label="Generate a strong password"
          title="Generate a strong password"
        >
          <Wand2 size={18} />
        </button>
      </div>

      {/* 5 segments, filled up to `score` and colored by the current level */}
      <div className="password-field__meter" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="password-field__segment"
            style={{ background: i < score ? level.color : 'var(--color-border)' }}
          />
        ))}
      </div>
      <p className="password-field__level" style={{ color: value ? level.color : 'var(--color-muted)' }}>
        {value ? level.label : 'Enter a password'}
      </p>

      <ul className="password-field__checklist">
        {checks.map((check) => (
          <li key={check.label} className={check.passed ? 'is-met' : ''}>
            {check.passed ? <Check size={14} /> : <X size={14} />} {check.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
