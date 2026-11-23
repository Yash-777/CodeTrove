import { useState } from 'react';
import {
  TABLE_PRESETS, getSavedTableColor, saveTableColor, resetTableColor,
} from '../utils/tableTheme';

export default function TableColorPicker() {
  const [color, setColor] = useState(getSavedTableColor);

  const pick = (hex) => { setColor(hex); saveTableColor(hex); };
  const reset = () => { resetTableColor(); setColor(getSavedTableColor()); };

  return (
    <section>
      <h3>Table color</h3>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {TABLE_PRESETS.map((p) => (
          <button
            key={p.name}
            type="button"
            title={p.name}
            aria-label={p.name}
            onClick={() => pick(p.color)}
            style={{
              width: 28, height: 28, borderRadius: 6, cursor: 'pointer',
              background: p.color,
              border: color.toLowerCase() === p.color ? '3px solid var(--color-text-primary)' : '1px solid var(--color-border)',
            }}
          />
        ))}
        <input type="color" value={color} onChange={(e) => pick(e.target.value)} aria-label="Custom color" />
        <button type="button" onClick={reset}>Reset</button>
      </div>

      {/* Live preview, uses the real table classes */}
      <table className="markdown-table" style={{ marginTop: 12 }}>
        <thead className="markdown-thead"><tr className="markdown-tr">
          <th className="markdown-th">Name</th><th className="markdown-th">Role</th>
        </tr></thead>
        <tbody className="markdown-tbody">
          <tr className="markdown-tr"><td className="markdown-td">Ann</td><td className="markdown-td">Dev</td></tr>
          <tr className="markdown-tr"><td className="markdown-td">Bob</td><td className="markdown-td">QA</td></tr>
          <tr className="markdown-tr"><td className="markdown-td">Cy</td><td className="markdown-td">Ops</td></tr>
        </tbody>
      </table>
    </section>
  );
}