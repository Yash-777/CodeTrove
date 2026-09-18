import { useEffect, useMemo, useState } from 'react';
import { Copy, Check, X, Github, ExternalLink } from 'lucide-react';
import './JwtToolPage.css';

const EXAMPLE_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
const DEFAULT_HEADER = { alg: 'HS256', typ: 'JWT' };
const DEFAULT_PAYLOAD = { sub: '1234567890', name: 'John Doe', iat: 1516239022 };

const ALGORITHMS = [
  ['HS256', 'HMAC using SHA-256'], ['HS384', 'HMAC using SHA-384'], ['HS512', 'HMAC using SHA-512'],
  ['RS256', 'RSASSA-PKCS1-v1_5 using SHA-256'], ['RS384', 'RSASSA-PKCS1-v1_5 using SHA-384'], ['RS512', 'RSASSA-PKCS1-v1_5 using SHA-512'],
  ['PS256', 'RSASSA-PSS using SHA-256'], ['PS384', 'RSASSA-PSS using SHA-384'], ['PS512', 'RSASSA-PSS using SHA-512'],
  ['ES256', 'ECDSA using P-256 and SHA-256'], ['ES384', 'ECDSA using P-384 and SHA-384'], ['ES512', 'ECDSA using P-521 and SHA-512'],
  ['EdDSA', 'EdDSA'], ['none', 'No digital signature'],
];

const bytesToBase64Url = (bytes) => {
  let binary = '';
  new Uint8Array(bytes).forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};
const base64UrlToText = (value) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
};
const encodeJson = (value) => bytesToBase64Url(new TextEncoder().encode(JSON.stringify(value)));
const parseJson = (value, fallback) => { try { return JSON.parse(value); } catch { return fallback; } };

function parseToken(value) {
  const parts = value.trim().split('.');
  if (parts.length !== 3) return null;
  try {
    return { header: JSON.parse(base64UrlToText(parts[0])), payload: JSON.parse(base64UrlToText(parts[1])), signature: parts[2], parts };
  } catch { return null; }
}

async function generateSignature(input, secret, algorithm) {
  if (algorithm === 'none') return '';
  const match = algorithm.match(/^HS(256|384|512)$/);
  if (!match) return '';
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: `SHA-${match[1]}` }, false, ['sign']);
  return bytesToBase64Url(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(input)));
}

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard?.writeText(value || '');
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };
  return <button type="button" className="jwt-copy" onClick={copy}>{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}</button>;
}

function JsonCard({ title, value, tone = 'header' }) {
  return <section className={`jwt-card jwt-card--${tone}`}><div className="jwt-card-title"><span>{title}</span><CopyButton value={value} /></div><pre>{value}</pre></section>;
}

export default function JwtToolPage() {
  const [mode, setMode] = useState('decoder');
  const [token, setToken] = useState(EXAMPLE_TOKEN);
  const [secret, setSecret] = useState('your-256-bit-secret');
  const [algorithm, setAlgorithm] = useState('HS256');
  const [headerText, setHeaderText] = useState(JSON.stringify(DEFAULT_HEADER, null, 2));
  const [payloadText, setPayloadText] = useState(JSON.stringify(DEFAULT_PAYLOAD, null, 2));
  const [encoded, setEncoded] = useState('');
  const [verification, setVerification] = useState(null);
  const decoded = useMemo(() => parseToken(token), [token]);

  useEffect(() => {
    if (!decoded || !secret || !decoded.signature) { setVerification(null); return undefined; }
    let active = true;
    (async () => {
      const expected = await generateSignature(`${decoded.parts[0]}.${decoded.parts[1]}`, secret, decoded.header.alg);
      if (active) setVerification(expected === decoded.signature);
    })();
    return () => { active = false; };
  }, [decoded, secret]);

  const updateAlgorithm = (event) => {
    const next = event.target.value;
    setAlgorithm(next);
    const header = parseJson(headerText, DEFAULT_HEADER);
    setHeaderText(JSON.stringify({ ...header, alg: next }, null, 2));
  };

  const generate = async () => {
    const header = { ...parseJson(headerText, DEFAULT_HEADER), alg: algorithm };
    const payload = parseJson(payloadText, DEFAULT_PAYLOAD);
    const headerPart = encodeJson(header);
    const payloadPart = encodeJson(payload);
    const signature = await generateSignature(`${headerPart}.${payloadPart}`, secret, algorithm);
    setEncoded(`${headerPart}.${payloadPart}.${signature}`);
  };

  const clearDecoder = () => { setToken(''); setVerification(null); };
  const pretty = (value) => JSON.stringify(value, null, 2);

  return <div className="jwt-tool-page">
    <div className="jwt-tool-credit"><Github size={14} /> Generated with Copilot · <a href="https://jwt.io" target="_blank" rel="noreferrer">jwt.io reference <ExternalLink size={12} /></a></div>
    <div className="jwt-tool-container">
      <header className="jwt-tool-intro"><div className="jwt-tool-kicker">Build / Tools / JWT</div><h1>JSON Web Tokens</h1><p>Decode, verify, and generate JSON Web Tokens.</p></header>
      <div className="jwt-mode-tabs" role="tablist"><button type="button" className={mode === 'decoder' ? 'active' : ''} onClick={() => setMode('decoder')}>Decoder</button><button type="button" className={mode === 'encoder' ? 'active' : ''} onClick={() => setMode('encoder')}>Encoder</button></div>

      {mode === 'decoder' ? <section className="jwt-workspace">
        <div className="jwt-column jwt-encoded-column"><h2>Encoded Token</h2><p className="jwt-help">Paste a JWT below that you'd like to decode, validate, and verify.</p><textarea className="jwt-token-input" value={token} onChange={(event) => setToken(event.target.value)} spellCheck="false" aria-label="Encoded JWT" /><div className="jwt-token-preview">{(token || ' ').split('.').map((part, index) => <span key={index} className={`jwt-part jwt-part-${index}`}>{part || ' '}{index < 2 && <b>.</b>}</span>)}</div><div className="jwt-row-actions"><button type="button" className="jwt-button muted" onClick={clearDecoder}><X size={15} /> Clear</button><CopyButton value={token} /></div><label className="jwt-field-label" htmlFor="verify-secret">Verify Signature</label><input id="verify-secret" className="jwt-input" type="password" value={secret} onChange={(event) => setSecret(event.target.value)} placeholder="Enter your secret" />{verification !== null && <div className={`jwt-verification ${verification ? 'valid' : 'invalid'}`}>{verification ? <Check size={16} /> : <X size={16} />} {verification ? 'Signature verified' : 'Invalid signature'}</div>}</div>
        <div className="jwt-column jwt-decoded-column"><h2>Decoded Header & Payload</h2><p className="jwt-help">The decoded parts of your JSON Web Token.</p><JsonCard title="Header" value={decoded ? pretty(decoded.header) : '{\n  "error": "Invalid JWT"\n}'} tone="header" /><JsonCard title="Payload" value={decoded ? pretty(decoded.payload) : '{\n  "error": "Invalid JWT"\n}'} tone="payload" /><JsonCard title="Signature" value={decoded?.signature || 'No signature'} tone="signature" /></div>
      </section> : <section className="jwt-workspace">
        <div className="jwt-column jwt-encoder-column"><h2>Generate example</h2><p className="jwt-help">Fill in the fields below to generate a signed JWT.</p><label className="jwt-field-label" htmlFor="algorithm">Select signing algorithm</label><select id="algorithm" className="jwt-input" value={algorithm} onChange={updateAlgorithm}>{ALGORITHMS.map(([value, label]) => <option key={value} value={value}>{value} — {label}</option>)}</select><p className="jwt-note">NOTE: selecting an algorithm updates the <strong>alg</strong> value in the Header section.</p><label className="jwt-field-label" htmlFor="encoder-secret">Secret</label><input id="encoder-secret" className="jwt-input" type="password" value={secret} onChange={(event) => setSecret(event.target.value)} placeholder="your-256-bit-secret" /><JsonCard title="Header" value={headerText} tone="header" /><textarea className="jwt-editor" value={headerText} onChange={(event) => setHeaderText(event.target.value)} spellCheck="false" aria-label="JWT header JSON" /><JsonCard title="Payload" value={payloadText} tone="payload" /><textarea className="jwt-editor" value={payloadText} onChange={(event) => setPayloadText(event.target.value)} spellCheck="false" aria-label="JWT payload JSON" /><button type="button" className="jwt-generate" onClick={generate}>Generate JWT</button></div>
        <div className="jwt-column jwt-output-column"><h2>Encoded Token</h2><p className="jwt-help">JSON Web Token (JWT)</p><div className="jwt-output-token">{encoded ? encoded.split('.').map((part, index) => <span key={index} className={`jwt-part jwt-part-${index}`}>{part}{index < 2 && <b>.</b>}</span>) : <span className="jwt-empty">Generate a token to see it here.</span>}</div><div className="jwt-row-actions"><button type="button" className="jwt-button muted" onClick={() => setEncoded('')}><X size={15} /> Clear</button><CopyButton value={encoded} /></div></div>
      </section>}
    </div>
    <div className="jwt-tool-credit jwt-tool-credit--bottom">Built for CodeTrove · <a href="https://github.com/Yash-777/CodeTrove" target="_blank" rel="noreferrer">View source <ExternalLink size={12} /></a></div>
  </div>;
}
