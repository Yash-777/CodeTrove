import { useState } from 'react';
import { Check, Copy, RefreshCw, Sparkles } from 'lucide-react';
import {
  base64ToBytes,
  bytesToBase64,
  currentJavaDateValue,
  decryptHeader,
  decryptLegacy,
  encryptHeader,
  encryptLegacy,
  formatJavaDate,
  generateEncryptionSecret,
  generateSalt,
  KDF_ALGORITHMS,
} from '../../utils/javaPasswordCrypto.js';
import './JavaPasswordCryptoPanel.css';

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });
const ITERATION_PRESETS = [1024, 10000, 50000, 100000, 310000, 600000, 1000000];
const LEGACY_SAMPLE = {
  secret: 'YWRtaW5AZHNwcm8uY29tMjAyMy0xMi0yOVQxMDowOUujxOjQ6K8UZpQ76Mgpd6Y=',
  saltText: 'Yash',
  dateValue: '2023-12-29T10:09:02',
  plaintext: 'Yash@007',
  algorithm: 'PBKDF2_HMAC_SHA1',
  iterations: 1024,
  keyLengthBits: 128,
  saltBytes: 24,
};
const HEADER_SAMPLE = {
  secret: 'vzQbXsDk6GSjrmWqGg3ROWbT8z8TMKlXxBOqp3rhsf0',
  saltText: '',
  dateValue: '2023-12-29T10:09:34',
  plaintext: 'Yash@001',
  algorithm: 'PBKDF2_HMAC_SHA256',
  iterations: 600000,
  keyLengthBits: 256,
  saltBytes: 24,
};

function makeHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function parseHex(value, label) {
  const normalized = value.trim();
  if (!normalized || normalized.length % 2 || !/^[0-9a-f]+$/i.test(normalized)) {
    throw new Error(`${label} must be valid hexadecimal with an even number of characters.`);
  }
  return Uint8Array.from(normalized.match(/.{2}/g), (part) => parseInt(part, 16));
}

async function copyValue(value) {
  if (!value) return;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }
  } catch { /* Try the same local fallback used by the rest of CodeTrove. */ }
  const field = document.createElement('textarea');
  field.value = value;
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.opacity = '0';
  document.body.appendChild(field);
  field.select();
  const copied = document.execCommand('copy');
  field.remove();
  if (!copied) throw new Error('Copy was blocked. Select the value and copy it manually.');
}

function CopyIconButton({ value, label, copied, onCopy }) {
  return (
    <button
      type="button"
      className={`crypto-icon-copy${copied ? ' is-copied' : ''}`}
      onClick={() => onCopy(value, label)}
      disabled={!value}
      aria-label={copied ? `${label} copied` : `Copy ${label}`}
      title={copied ? 'Copied to clipboard' : `Copy ${label}`}
    >
      {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
    </button>
  );
}

export default function JavaPasswordCryptoPanel({ active }) {
  const [profile, setProfile] = useState('header');
  const [algorithm, setAlgorithm] = useState(HEADER_SAMPLE.algorithm);
  const [iterations, setIterations] = useState(HEADER_SAMPLE.iterations);
  const [keyLengthBits, setKeyLengthBits] = useState(HEADER_SAMPLE.keyLengthBits);
  const [saltBytes, setSaltBytes] = useState(HEADER_SAMPLE.saltBytes);
  const [secret, setSecret] = useState('');
  const [saltText, setSaltText] = useState('');
  const [dateValue, setDateValue] = useState(() => currentJavaDateValue());
  const [includeDate, setIncludeDate] = useState(true);
  const [rawKey, setRawKey] = useState('');
  const [rawIv, setRawIv] = useState('');
  const [action, setAction] = useState('encrypt');
  const [input, setInput] = useState('CodeTrove: keep this message private.');
  const [output, setOutput] = useState('');
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState('');

  const setPreset = (nextProfile) => {
    const preset = nextProfile === 'legacy' ? LEGACY_SAMPLE : HEADER_SAMPLE;
    setProfile(nextProfile);
    setAlgorithm(preset.algorithm);
    setIterations(preset.iterations);
    setKeyLengthBits(preset.keyLengthBits);
    setSaltBytes(preset.saltBytes);
    setIncludeDate(true);
    setAction('encrypt');
    setNotice(`${nextProfile === 'legacy' ? 'Legacy Mode' : 'Header Configuration'} parameters selected. Existing secret, salt, date, and message fields were preserved.`);
  };

  const loadSample = (nextProfile = profile) => {
    const sample = nextProfile === 'legacy' ? LEGACY_SAMPLE : HEADER_SAMPLE;
    setProfile(nextProfile);
    setAlgorithm(sample.algorithm);
    setIterations(sample.iterations);
    setKeyLengthBits(sample.keyLengthBits);
    setSaltBytes(sample.saltBytes);
    setSecret(sample.secret);
    setSaltText(sample.saltText);
    setDateValue(sample.dateValue);
    setIncludeDate(true);
    setInput(sample.plaintext);
    setAction('encrypt');
    setOutput('');
    setNotice(`Loaded the supplied ${nextProfile === 'legacy' ? 'legacy' : 'header'} example. The secret is a demonstration value only.`);
  };

  const onCopy = async (value, label) => {
    try {
      await copyValue(value);
      setCopied(label);
      setNotice(`${label} copied to clipboard.`);
      window.setTimeout(() => setCopied((current) => current === label ? '' : current), 1600);
    } catch (error) {
      setNotice(error?.message || 'Unable to copy this value.');
    }
  };

  const generateSecret = () => {
    try {
      if (profile === 'raw-gcm') {
        const bytes = globalThis.crypto.getRandomValues(new Uint8Array(32));
        setRawKey(makeHex(bytes));
        setNotice('Generated a random 256-bit AES key. Keep it private.');
      } else {
        setSecret(generateEncryptionSecret(keyLengthBits));
        setNotice(`Generated a Base64 URL-safe ${keyLengthBits}-bit encryption secret. Store it securely; it is not the derived AES key.`);
      }
    } catch (error) {
      setNotice(error?.message || 'Unable to generate a secret.');
    }
  };

  const generateSaltValue = () => {
    try {
      setSaltText(generateSalt(saltBytes));
      setNotice(`Generated a ${saltBytes}-byte Base64 salt.`);
    } catch (error) {
      setNotice(error?.message || 'Unable to generate a salt.');
    }
  };

  const generateIv = () => {
    try {
      const value = globalThis.crypto.getRandomValues(new Uint8Array(12));
      setRawIv(makeHex(value));
      setNotice('Generated a 96-bit GCM nonce. Never reuse a nonce with the same key.');
    } catch (error) {
      setNotice(error?.message || 'Unable to generate a nonce.');
    }
  };

  const run = async () => {
    setNotice('');
    try {
      if (profile === 'raw-gcm') {
        const keyBytes = parseHex(rawKey, 'AES-256 key');
        if (keyBytes.length !== 32) throw new Error('The AES-256 key must be exactly 64 hexadecimal characters.');
        if (action === 'encrypt') {
          const crypto = globalThis.crypto;
          if (!crypto?.subtle) throw new Error('Web Crypto requires HTTPS or localhost.');
          const nonce = crypto.getRandomValues(new Uint8Array(12));
          const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt']);
          const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce, tagLength: 128 }, key, encoder.encode(input));
          setOutput(`iv:${makeHex(nonce)}\n${bytesToBase64(new Uint8Array(encrypted))}`);
          setNotice('AES-GCM ciphertext generated. The nonce is included in the output; your selected fields were kept unchanged.');
        } else {
          const lines = input.trim().split(/\r?\n/);
          const nonceText = lines[0].startsWith('iv:') ? lines.shift().slice(3) : rawIv;
          const nonce = parseHex(nonceText, 'GCM nonce');
          if (nonce.length !== 12) throw new Error('GCM nonce must be exactly 12 bytes (24 hexadecimal characters).');
          const key = await globalThis.crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['decrypt']);
          const ciphertext = base64ToBytes(lines.join('').trim());
          const clear = await globalThis.crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce, tagLength: 128 }, key, ciphertext);
          setOutput(decoder.decode(clear));
          setNotice('AES-GCM authentication succeeded.');
        }
        return;
      }

      if (action === 'encrypt') {
        if (profile === 'legacy') formatJavaDate(dateValue);
        const value = profile === 'legacy'
          ? await encryptLegacy({ plaintext: input, secret, saltText, dateValue, algorithm, iterations, keyLengthBits })
          : await encryptHeader({ plaintext: input, secret, algorithm, iterations, keyLengthBits, saltBytes, saltText, dateValue, includeDate });
        setOutput(value);
        if (profile === 'legacy') {
          setNotice(`Java-compatible Legacy Mode output. Date used: ${dateValue} (local time, matching Java's default timezone). The original 16-byte IV rule uses the first 16 UTF-8 bytes of the date, so seconds are stored in this control but do not affect that IV. Output is Base64(salt bytes || IV || AES-CBC ciphertext).`);
        } else {
          setNotice(includeDate ? `Java-compatible Header Configuration output. Creation date included in the authenticated header: ${dateValue} (local time).` : 'Java-compatible Header Configuration output. No creation date was included in the authenticated header.');
        }
      } else if (profile === 'legacy') {
        setOutput(await decryptLegacy({ envelope: input, secret, saltText, algorithm, iterations, keyLengthBits }));
        setNotice('Legacy ciphertext decrypted. The date is not required for decryption because the IV is stored in the envelope.');
      } else {
        const result = await decryptHeader({ envelope: input, secret });
        setOutput(result.plaintext);
        const date = result.metadata.dateMillis === -(1n << 63n) ? null : new Date(Number(result.metadata.dateMillis));
        setNotice(date
          ? `Header authenticated and decrypted. Stored creation date: ${currentJavaDateValue(date)} (local time). Header parameters were read from the envelope; your selected controls were left unchanged.`
          : 'Header authenticated and decrypted. The envelope contains no creation date; your selected controls were left unchanged.');
      }
    } catch (error) {
      setOutput('');
      setNotice(error?.message || 'Unable to complete this cryptographic operation. Check the input and parameters.');
    }
  };

  return (
    <section className="crypto-card crypto-java-panel" hidden={!active}>
      <div className="crypto-mode-description">
        <strong>Symmetric encryption</strong>
        <p>Select a format. Header Configuration (AES-GCM) is recommended for new values; Legacy Mode reproduces the compatible AES-CBC envelope. Processing stays in this browser.</p>
      </div>

      <div className="crypto-java-config">
        <label className="crypto-java-field crypto-java-format">Encryption format
          <select value={profile} onChange={(event) => setPreset(event.target.value)}>
            <option value="header">Header Configuration — AES-GCM (recommended)</option>
            <option value="legacy">Legacy Mode — AES-CBC compatibility</option>
            <option value="raw-gcm">AES-GCM — raw 256-bit key</option>
          </select>
        </label>

        {profile !== 'raw-gcm' ? <>
          <label className="crypto-java-field">PBKDF2 algorithm
            <select value={algorithm} onChange={(event) => setAlgorithm(event.target.value)}>
              {KDF_ALGORITHMS.map((item) => <option value={item} key={item}>{item.replaceAll('_', ' ')}</option>)}
            </select>
          </label>
          <label className="crypto-java-field">AES key length
            <select value={keyLengthBits} onChange={(event) => setKeyLengthBits(Number(event.target.value))}>
              <option value={128}>128 bits</option><option value={192}>192 bits</option><option value={256}>256 bits</option>
            </select>
          </label>
          <label className="crypto-java-field">PBKDF2 iterations
            <select value={ITERATION_PRESETS.includes(Number(iterations)) ? String(iterations) : 'custom'} onChange={(event) => { if (event.target.value !== 'custom') setIterations(Number(event.target.value)); }}>
              {ITERATION_PRESETS.map((count) => <option value={count} key={count}>{count.toLocaleString()}</option>)}
              <option value="custom">Custom value…</option>
            </select>
            {!ITERATION_PRESETS.includes(Number(iterations)) && <input type="number" min="1" max="10000000" step="1" aria-label="Custom PBKDF2 iterations" value={iterations} onChange={(event) => setIterations(event.target.value)} />}
          </label>
          <label className="crypto-java-field">Generated salt size
            <select value={saltBytes} onChange={(event) => setSaltBytes(Number(event.target.value))}>
              {[8, 16, 24, 32, 48, 64].map((bytes) => <option value={bytes} key={bytes}>{bytes} bytes ({bytes * 8} bits)</option>)}
            </select>
          </label>
          <label className="crypto-java-field crypto-java-wide">Encryption secret
            <span className="crypto-java-input-copy"><input type="text" autoComplete="off" spellCheck="false" value={secret} onChange={(event) => setSecret(event.target.value)} placeholder="Enter or generate the PBKDF2 password / secret" /><CopyIconButton value={secret} label="encryption secret" copied={copied === 'encryption secret'} onCopy={onCopy} /></span>
          </label>
          <label className="crypto-java-field crypto-java-wide">Salt
            <span className="crypto-java-input-copy"><input type="text" autoComplete="off" spellCheck="false" value={saltText} onChange={(event) => setSaltText(event.target.value)} placeholder={profile === 'legacy' ? 'Required: original salt (Base64 when valid; otherwise UTF-8 fallback)' : 'Optional: leave blank to generate a fresh random salt for this encryption'} /><CopyIconButton value={saltText} label="salt" copied={copied === 'salt'} onCopy={onCopy} /></span>
            <span className="crypto-java-hint">Header Mode stores the salt in the envelope. Legacy decryption requires the same original salt text.</span>
          </label>
          <label className="crypto-java-field crypto-java-wide">Creation date / time (local)
            <input type="datetime-local" step="1" value={dateValue} onChange={(event) => setDateValue(event.target.value)} />
            <span className="crypto-java-hint">Legacy Mode derives its IV from this formatted date. Header Configuration stores the date in milliseconds when enabled.</span>
          </label>
          {profile === 'header' && <label className="crypto-java-check"><input type="checkbox" checked={includeDate} onChange={(event) => setIncludeDate(event.target.checked)} /> Include creation date in authenticated header</label>}
        </> : <>
          <label className="crypto-java-field crypto-java-wide">AES-256 key (hex)
            <span className="crypto-java-input-copy"><input type="text" autoComplete="off" spellCheck="false" value={rawKey} onChange={(event) => setRawKey(event.target.value)} placeholder="64 hexadecimal characters" /><CopyIconButton value={rawKey} label="AES key" copied={copied === 'AES key'} onCopy={onCopy} /></span>
          </label>
          <label className="crypto-java-field">GCM nonce (hex)
            <span className="crypto-java-input-copy"><input type="text" autoComplete="off" spellCheck="false" value={rawIv} onChange={(event) => setRawIv(event.target.value)} placeholder="Generated on encrypt or read from iv: header" /><CopyIconButton value={rawIv} label="GCM nonce" copied={copied === 'GCM nonce'} onCopy={onCopy} /></span>
          </label>
          <span className="crypto-java-hint crypto-java-wide">The 96-bit nonce is generated for encryption and embedded in the result. Decryption reads it from an <code>iv:</code> line or this field.</span>
        </>}

        {profile !== 'raw-gcm' && <div className="crypto-java-presets crypto-java-wide crypto-java-parameter-presets" aria-label="Key size and iteration presets">
          <span>AES key size</span>
          {[128, 192, 256].map((bits) => <button type="button" className={`crypto-button${keyLengthBits === bits ? ' is-selected' : ''}`} aria-pressed={keyLengthBits === bits} key={bits} onClick={() => setKeyLengthBits(bits)}>{bits} bits</button>)}
          <span>PBKDF2 iterations</span>
          {[1024, 10000, 100000, 600000].map((count) => <button type="button" className={`crypto-button${Number(iterations) === count ? ' is-selected' : ''}`} aria-pressed={Number(iterations) === count} key={count} onClick={() => setIterations(count)}>{count.toLocaleString()}</button>)}
        </div>}

        <div className="crypto-java-presets crypto-java-wide" aria-label="Quick parameter presets">
          <span>Parameter presets</span>
          <button type="button" className="crypto-button" onClick={() => setPreset('header')}>Header defaults · 256 bit · 600,000</button>
          <button type="button" className="crypto-button" onClick={() => setPreset('legacy')}>Legacy defaults · 128 bit · 1,024</button>
          <button type="button" className="crypto-button" onClick={generateSecret}><Sparkles size={14} /> Generate secret</button>
          {profile !== 'raw-gcm' && <button type="button" className="crypto-button" onClick={generateSaltValue}><Sparkles size={14} /> Generate salt</button>}
          {profile === 'raw-gcm' && <button type="button" className="crypto-button" onClick={generateIv}><RefreshCw size={14} /> Generate nonce</button>}
          <button type="button" className="crypto-button" onClick={() => setDateValue(currentJavaDateValue())}>Use current date</button>
          {profile === 'raw-gcm' && <button type="button" className="crypto-button" onClick={() => { const sample = LEGACY_SAMPLE; setInput(sample.plaintext); setOutput(''); setAction('encrypt'); setNotice('Loaded a plain-text AES-GCM sample.'); }}>Sample message</button>}
        </div>
      </div>

      <div className="crypto-action-tabs" role="tablist" aria-label="Symmetric operation">
        {['encrypt', 'decrypt'].map((item) => <button type="button" role="tab" aria-selected={action === item} className={action === item ? 'is-active' : ''} key={item} onClick={() => { setAction(item); setOutput(''); setNotice(''); }}>{item === 'encrypt' ? 'Encrypt' : 'Decrypt'}</button>)}
      </div>

      <div className="crypto-editors">
        <section className="crypto-editor">
          <div className="crypto-editor-head"><label htmlFor="crypto-symmetric-input">{action === 'encrypt' ? 'Plain text' : 'Encrypted text / envelope'}</label><div>
            <button type="button" className="crypto-button" onClick={() => loadSample(profile === 'legacy' ? 'legacy' : 'header')}>Sample</button>
            <button type="button" className="crypto-button" onClick={() => { setInput(''); setOutput(''); setNotice(''); }}>Clear</button>
            <CopyIconButton value={input} label="input" copied={copied === 'input'} onCopy={onCopy} />
          </div></div>
          <textarea id="crypto-symmetric-input" value={input} onChange={(event) => setInput(event.target.value)} spellCheck="false" placeholder={action === 'encrypt' ? 'Enter text to encrypt…' : 'Paste the Base64 encrypted value…'} />
        </section>
        <section className="crypto-editor">
          <div className="crypto-editor-head"><label htmlFor="crypto-symmetric-output">{action === 'encrypt' ? 'Encrypted result' : 'Decrypted text'}</label><div>
            <CopyIconButton value={output} label="result" copied={copied === 'result'} onCopy={onCopy} />
            <button type="button" className="crypto-button crypto-primary" onClick={run}>{action === 'encrypt' ? 'Encrypt' : 'Decrypt'}</button>
          </div></div>
          <textarea id="crypto-symmetric-output" value={output} readOnly spellCheck="false" placeholder="The result will appear here." />
        </section>
      </div>
      {notice && <p className="crypto-notice" role="status">{notice}</p>}
      <details className="crypto-explainer crypto-java-explainer">
        <summary>Format compatibility and security notes</summary>
        <p><strong>Header Configuration:</strong> AES/GCM/NoPadding with a 128-bit authentication tag. The binary header is <code>CTRV</code> magic, version, KDF enum ordinal, AES key length, PBKDF2 iterations, salt length, nonce length, signed date milliseconds, salt bytes, and nonce. That exact header is authenticated as GCM additional data. The output is standard Base64 of <code>header || ciphertext || tag</code>, matching the supplied implementation.</p>
        <p><strong>Legacy Mode:</strong> PBKDF2 derives the AES key, AES/CBC/PKCS5Padding encrypts UTF-8 text, and standard Base64 encodes <code>salt bytes || 16-byte date-derived IV || ciphertext</code>. Web Crypto's AES-CBC padding is byte-compatible with Java's PKCS5-style AES padding. The date string is copied into a 16-byte IV buffer; consequently the IV uses only the first 16 UTF-8 bytes and does not include the seconds portion. The ciphertext itself has no separate date text; the date is represented by its IV and displayed in the status message.</p>
        <p><strong>Compatibility:</strong> Reproduce the same secret, salt text, KDF, iteration count, key size, and local timezone. The supplied code first tries standard Base64 salt decoding, then Base64 URL-safe decoding, then the platform-default string bytes. Header decryption reads all cryptographic parameters from the envelope. Legacy decryption requires its original parameters.</p>
        <p><strong>Security:</strong> Legacy CBC is included only for compatibility and has no authentication tag. Prefer Header Configuration for new data. Use a fresh random salt and nonce for each header encryption, protect the encryption secret, and do not paste production secrets into a demo page.</p>
      </details>
    </section>
  );
}
