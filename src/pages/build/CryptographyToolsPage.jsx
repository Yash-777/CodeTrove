import { useMemo, useState } from 'react';
import { Check, Copy, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import './CryptographyToolsPage.css';

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const bytesToBase64 = (bytes) => btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''));
const base64ToBytes = (value) => Uint8Array.from(atob(value.trim()), (char) => char.charCodeAt(0));
const toHex = (bytes) => Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
const getWebCrypto = () => { const api = globalThis.crypto || (typeof window !== 'undefined' ? window.crypto : undefined); if (!api?.subtle || !api?.getRandomValues) throw new Error('Web Crypto is unavailable. Open this page in a secure context (HTTPS or localhost) and use a modern browser.'); return api; };
const randomHex = (size = 32) => { const bytes = getWebCrypto().getRandomValues(new Uint8Array(size)); return toHex(bytes); };
const hexToBytes = (hex) => { const value = hex.trim(); if (!value || value.length % 2 || !/^[0-9a-f]+$/i.test(value)) throw new Error('Enter valid hexadecimal text (an even number of characters).'); return Uint8Array.from(value.match(/.{2}/g), (part) => parseInt(part, 16)); };
const copyText = async (value) => { const text = value || ''; try { if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return; } } catch { /* Fall back for browsers without clipboard permission. */ } const field = document.createElement('textarea'); field.value = text; field.setAttribute('readonly', ''); field.style.position = 'fixed'; field.style.opacity = '0'; document.body.appendChild(field); field.select(); const copied = document.execCommand('copy'); field.remove(); if (!copied) throw new Error('Copy was blocked by the browser. Select the text and copy it manually.'); };

const MODES = [
  { id: 'symmetric', label: 'Symmetric / Asymmetric', description: 'Encrypt and decrypt text with AES-GCM or RSA-OAEP. AES uses the same secret key; RSA uses a public/private key pair.' },
  { id: 'hash', label: 'Hashing', description: 'Create a one-way digest for integrity checks and fingerprints. Hashes cannot be decrypted or reliably reversed.' },
  { id: 'hmac', label: 'Message Authentication (HMAC)', description: 'Sign a message with a shared secret and verify that the message and signature match.' },
  { id: 'base64', label: 'Base64 Encode / Decode', description: 'Convert text to Base64 and back. Base64 is encoding, not encryption or a security feature.' },
];
const SAMPLES = {
  symmetric: 'CodeTrove: keep this message private.',
  hash: 'Hello CodeTrove',
  hmac: '{\n  "customerID": "987654321",\n  "appId": 11\n}',
  base64: 'Hello CodeTrove!\nEncode text, then decode it back.',
};

export default function CryptographyToolsPage() {
  const [mode, setMode] = useState('symmetric');
  const [action, setAction] = useState('encrypt');
  const [algorithm, setAlgorithm] = useState('AES-GCM');
  const [hashAlgorithm, setHashAlgorithm] = useState('SHA-256');
  const [hashType, setHashType] = useState('PBKDF2');
  const [iterations, setIterations] = useState(310000);
  const [derivedBits, setDerivedBits] = useState(256);
  const [hashToVerify, setHashToVerify] = useState('');
  const [hmacAlgorithm, setHmacAlgorithm] = useState('SHA-256');
  const [keyText, setKeyText] = useState('');
  const [salt, setSalt] = useState('');
  const [ivText, setIvText] = useState('');
  const [input, setInput] = useState(SAMPLES.symmetric);
  const [output, setOutput] = useState('');
  const [notice, setNotice] = useState('');
  const [rsaKeys, setRsaKeys] = useState(null);
  const [publicKeyText, setPublicKeyText] = useState('');
  const [privateKeyText, setPrivateKeyText] = useState('');
  const [signature, setSignature] = useState('');
  const [canonicalizeJson, setCanonicalizeJson] = useState(true);
  const [encoding, setEncoding] = useState('Hex');
  const current = useMemo(() => MODES.find((item) => item.id === mode), [mode]);

  const changeMode = (next) => {
    setMode(next);
    setAction(next === 'symmetric' ? 'encrypt' : next === 'hash' ? 'hash' : next === 'hmac' ? 'sign' : 'encode');
    setInput(SAMPLES[next]); setOutput(''); setNotice('');
  };
  const loadSample = () => { setInput(SAMPLES[mode]); setOutput(''); setNotice('Sample loaded.'); };
  const generateSecret = () => { try { setKeyText(randomHex(32)); setNotice('Generated a random 256-bit key (hex). Keep it private.'); } catch (error) { setNotice(error?.message || 'Unable to generate a key.'); } };
  const generateSalt = () => { try { setSalt(randomHex(16)); setNotice('Generated a random 128-bit salt. Save it with the password hash; the salt is not a secret.'); } catch (error) { setNotice(error?.message || 'Unable to generate a salt.'); } };
  const generateIv = () => { try { setIvText(randomHex(12)); setNotice('Generated a 96-bit AES-GCM IV. Use a unique IV for every encryption with the same key.'); } catch (error) { setNotice(error?.message || 'Unable to generate an IV.'); } };
  const canonicalize = (value) => {
    if (Array.isArray(value)) return value.map(canonicalize);
    if (value && typeof value === 'object') return Object.keys(value).sort().reduce((acc, key) => { acc[key] = canonicalize(value[key]); return acc; }, {});
    return value;
  };
  const getMessage = () => {
    if (!canonicalizeJson) return input;
    try { return JSON.stringify(canonicalize(JSON.parse(input))); } catch { throw new Error('Canonical JSON is enabled, but the input is not valid JSON. Turn it off or fix the JSON.'); }
  };
  const run = async () => {
    setNotice('');
    try {
      if (mode === 'base64') {
        setOutput(action === 'encode' ? bytesToBase64(encoder.encode(input)) : decoder.decode(base64ToBytes(input)));
      } else if (mode === 'hash') {
        if (hashAlgorithm === 'MD5') throw new Error('MD5 is not supported by the browser Web Crypto API. Use SHA-256 or another listed SHA-2 option for modern integrity checks.');
        const webCrypto = getWebCrypto();
        if (action === 'verify' && hashType === 'PBKDF2') {
          const parts = hashToVerify.trim().split('$');
          if (parts.length !== 6 || parts[0] !== 'pbkdf2') throw new Error('Paste a generated PBKDF2 hash in the format shown in the result field.');
          const [, storedAlgorithm, storedIterations, storedBits, storedSalt, storedHash] = parts;
          if (!['SHA-256', 'SHA-384', 'SHA-512', 'SHA-1'].includes(storedAlgorithm) || !Number.isInteger(Number(storedIterations)) || Number(storedIterations) < 10000 || Number(storedIterations) > 5000000 || ![128, 256, 384, 512].includes(Number(storedBits))) throw new Error('Stored PBKDF2 parameters are invalid or outside the supported range.');
          const keyMaterial = await webCrypto.subtle.importKey('raw', encoder.encode(input), 'PBKDF2', false, ['deriveBits']);
          const candidate = new Uint8Array(await webCrypto.subtle.deriveBits({ name: 'PBKDF2', salt: hexToBytes(storedSalt), iterations: Number(storedIterations), hash: storedAlgorithm }, keyMaterial, Number(storedBits)));
          setOutput(toHex(candidate).toLowerCase() === storedHash.toLowerCase() ? 'VALID — password matches the stored hash.' : 'INVALID — password does not match the stored hash.');
        } else if (hashType === 'PBKDF2') {
          if (!Number.isInteger(Number(iterations)) || Number(iterations) < 10000 || Number(iterations) > 5000000) throw new Error('PBKDF2 iterations must be between 10,000 and 5,000,000.');
          const saltBytes = salt.trim() ? hexToBytes(salt) : webCrypto.getRandomValues(new Uint8Array(16));
          const keyMaterial = await webCrypto.subtle.importKey('raw', encoder.encode(input), 'PBKDF2', false, ['deriveBits']);
          const derived = new Uint8Array(await webCrypto.subtle.deriveBits({ name: 'PBKDF2', salt: saltBytes, iterations: Number(iterations), hash: hashAlgorithm }, keyMaterial, Number(derivedBits)));
          const saltHex = toHex(saltBytes);
          setSalt(saltHex);
          setOutput(`pbkdf2$${hashAlgorithm}$${Number(iterations)}$${Number(derivedBits)}$${saltHex}$${toHex(derived)}`);
          setNotice('Password hash generated. Save the complete encoded result, including algorithm, iteration count, key length, and salt, for later verification.');
        } else {
          const digest = new Uint8Array(await webCrypto.subtle.digest(hashAlgorithm, encoder.encode(input)));
          const result = encoding === 'Base64' ? bytesToBase64(digest) : toHex(digest);
          if (action === 'verify') setOutput(result.toLowerCase() === hashToVerify.trim().toLowerCase() ? 'VALID — digest matches.' : 'INVALID — digest does not match.');
          else setOutput(result);
        }
      } else if (mode === 'hmac') {
        if (!keyText.trim()) throw new Error('Enter a secret key or use Generate key.');
        const message = encoder.encode(getMessage());
        const key = await getWebCrypto().subtle.importKey('raw', encoder.encode(keyText), { name: 'HMAC', hash: `SHA-${hmacAlgorithm.split('-')[1]}` }, false, ['sign', 'verify']);
        if (action === 'sign') {
          const signed = new Uint8Array(await getWebCrypto().subtle.sign('HMAC', key, message));
          const value = encoding === 'Base64' ? bytesToBase64(signed) : toHex(signed);
          setSignature(value); setOutput(value); setNotice('HMAC signature generated. Verification requires the same message, key, and algorithm.');
        } else {
          if (!signature.trim()) throw new Error('Paste a signature to verify.');
          let signatureBytes;
          try { signatureBytes = encoding === 'Base64' ? base64ToBytes(signature) : Uint8Array.from(signature.trim().match(/.{1,2}/g) || [], (part) => parseInt(part, 16)); } catch { throw new Error('Signature format is invalid.'); }
          const valid = await getWebCrypto().subtle.verify('HMAC', key, signatureBytes, message);
          setOutput(valid ? 'VALID — signature matches this message.' : 'INVALID — message, key, algorithm, or signature differs.');
        }
      } else if (algorithm === 'AES-GCM') {
        if (!keyText.trim()) throw new Error('Enter a 256-bit key in hex or generate one.');
        const keyBytes = Uint8Array.from(keyText.trim().match(/.{1,2}/g) || [], (part) => parseInt(part, 16));
        if (keyBytes.length !== 32 || keyBytes.some(Number.isNaN)) throw new Error('AES-256 key must be 64 hexadecimal characters (32 bytes). Use Generate key.');
        if (action === 'encrypt') {
          const iv = getWebCrypto().getRandomValues(new Uint8Array(12));
          const cryptoKey = await getWebCrypto().subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt']);
          const encrypted = await getWebCrypto().subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, encoder.encode(input));
          setIvText(toHex(iv)); setOutput(`iv:${toHex(iv)}\n${bytesToBase64(new Uint8Array(encrypted))}`);
        } else {
          const lines = input.trim().split(/\r?\n/); const ivLine = lines[0].startsWith('iv:') ? lines.shift().slice(3) : ivText;
          const iv = Uint8Array.from((ivLine || '').match(/.{1,2}/g) || [], (part) => parseInt(part, 16));
          if (iv.length !== 12) throw new Error('Provide the 12-byte IV in the IV field or use the iv: header from the sample output.');
          const cryptoKey = await getWebCrypto().subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['decrypt']);
          const encrypted = base64ToBytes(lines.join('').trim());
          setOutput(decoder.decode(await getWebCrypto().subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, encrypted)));
        }
      } else {
        if (action === 'encrypt' && !rsaKeys) throw new Error('Generate an RSA key pair first.');
        if (action === 'encrypt') {
          const encrypted = await getWebCrypto().subtle.encrypt({ name: 'RSA-OAEP' }, rsaKeys.publicKey, encoder.encode(input)); setOutput(bytesToBase64(new Uint8Array(encrypted)));
        } else {
          if (!rsaKeys) throw new Error('RSA decryption requires the private key pair generated in this session. Importing pasted PEM keys is not supported in this demo.');
          setOutput(decoder.decode(await getWebCrypto().subtle.decrypt({ name: 'RSA-OAEP' }, rsaKeys.privateKey, base64ToBytes(input))));
        }
      }
    } catch (error) { setOutput(''); setNotice(error?.message || 'Unable to complete this operation. Check the input and options.'); }
  };
  const generateRsa = async () => {
    try {
      const pair = await getWebCrypto().subtle.generateKey({ name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['encrypt', 'decrypt']);
      setRsaKeys(pair);
      const pub = await getWebCrypto().subtle.exportKey('spki', pair.publicKey); const priv = await getWebCrypto().subtle.exportKey('pkcs8', pair.privateKey);
      const pem = (label, bytes) => `-----BEGIN ${label}-----\n${bytesToBase64(new Uint8Array(bytes)).match(/.{1,64}/g).join('\n')}\n-----END ${label}-----`;
      setPublicKeyText(pem('PUBLIC KEY', pub)); setPrivateKeyText(pem('PRIVATE KEY', priv)); setNotice('RSA-2048 key pair generated in this browser session. The private key is sensitive; do not share it.');
    } catch (error) { setNotice(error?.message || 'RSA key generation failed. Use a secure context (HTTPS or localhost).'); }
  };
  const tabs = mode === 'symmetric' ? [['encrypt', 'Encrypt'], ['decrypt', 'Decrypt']] : mode === 'hash' ? (hashType === 'PBKDF2' ? [['hash', 'Generate hash'], ['verify', 'Verify password']] : [['hash', 'Generate hash'], ['verify', 'Verify digest']]) : mode === 'hmac' ? [['sign', 'Generate signature'], ['verify', 'Verify signature']] : [['encode', 'Encode'], ['decode', 'Decode']];

  return <main className="crypto-page">
    <header className="crypto-intro"><span className="crypto-eyebrow">BUILD / TOOLS / CRYPTOGRAPHY</span><h1><ShieldCheck size={30} /> Cryptography Tools</h1><p>Encrypt data, create hashes, and generate or verify HMAC signatures directly in your browser using the Web Crypto API.</p><div className="crypto-safety"><strong>Security note:</strong> Use this page for learning and local testing. Never paste production secrets or sensitive customer data into tools you do not control. Hashing is one-way; Base64 is not encryption.</div></header>
    <section className="crypto-card">
      <div className="crypto-mode-tabs" role="tablist" aria-label="Cryptography tool categories">{MODES.map((item) => <button type="button" role="tab" aria-selected={mode === item.id} className={mode === item.id ? 'is-active' : ''} key={item.id} onClick={() => changeMode(item.id)}>{item.label}</button>)}</div>
      <div className="crypto-mode-description"><strong>{current.label}</strong><p>{current.description}</p></div>
      <div className="crypto-security-options">
        {mode === 'symmetric' && <><label>Encryption algorithm<select value={algorithm} onChange={(e) => { setAlgorithm(e.target.value); setOutput(''); }}><option value="AES-GCM">AES-256-GCM (recommended)</option><option value="RSA-OAEP">RSA-OAEP (2048-bit)</option></select></label>{algorithm === 'AES-GCM' ? <><label className="crypto-wide">Secret key (64 hex characters)<input value={keyText} onChange={(e) => setKeyText(e.target.value)} placeholder="Generate a key or paste 64 hex characters" /></label><button type="button" className="crypto-button" onClick={generateSecret}><Sparkles size={15}/> Generate key</button><label>IV / nonce (hex)<input value={ivText} onChange={(e) => setIvText(e.target.value)} placeholder="Generated during encryption" /></label><button type="button" className="crypto-button" onClick={generateIv}><RefreshCw size={15}/> Generate IV</button></> : <><button type="button" className="crypto-button" onClick={generateRsa}><Sparkles size={15}/> Generate RSA key pair</button>{rsaKeys && <p className="crypto-field-note">RSA keys generated for this session. Exported PEM values are shown below.</p>}</>}</>}
        {mode === 'hash' && <><label>Hash type<select value={hashType} onChange={(e) => { setHashType(e.target.value); setOutput(''); setNotice(''); setAction(e.target.value === 'PBKDF2' ? 'hash' : 'hash'); }}><option value="PBKDF2">Password hash (PBKDF2)</option><option value="DIGEST">Fast digest (SHA)</option></select></label><label>Algorithm<select value={hashAlgorithm} onChange={(e) => setHashAlgorithm(e.target.value)}><option>SHA-256</option><option>SHA-384</option><option>SHA-512</option><option>SHA-1</option><option>MD5</option></select></label>{hashType === 'PBKDF2' && <><label>Iterations<input type="number" min="10000" max="5000000" step="10000" value={iterations} onChange={(e) => setIterations(e.target.value)} /></label><label>Derived key length<select value={derivedBits} onChange={(e) => setDerivedBits(Number(e.target.value))}><option value={128}>128 bits</option><option value={256}>256 bits</option><option value={384}>384 bits</option><option value={512}>512 bits</option></select></label><label className="crypto-wide">Salt (hex)<input value={salt} onChange={(e) => setSalt(e.target.value)} placeholder="Generate a random salt or paste a saved salt" /></label><button type="button" className="crypto-button" onClick={generateSalt}><Sparkles size={15}/> Generate salt</button>{action === 'verify' && <label className="crypto-wide">Stored PBKDF2 hash<input value={hashToVerify} onChange={(e) => setHashToVerify(e.target.value)} placeholder="Paste the full pbkdf2$... result" /></label>}</>}{hashType === 'DIGEST' && <><label>Output format<select value={encoding} onChange={(e) => setEncoding(e.target.value)}><option>Hex</option><option>Base64</option></select></label>{action === 'verify' && <label className="crypto-wide">Digest to verify<input value={hashToVerify} onChange={(e) => setHashToVerify(e.target.value)} placeholder="Paste expected digest" /></label>}</>}<p className="crypto-field-note">PBKDF2 is a salted, configurable password-based key derivation function. SHA digest is fast and intended for integrity/fingerprints, not password storage. MD5 is unsupported by Web Crypto; SHA-1 is legacy.</p></>}
        {mode === 'hmac' && <><label>HMAC algorithm<select value={hmacAlgorithm} onChange={(e) => setHmacAlgorithm(e.target.value)}><option>SHA-256</option><option>SHA-384</option><option>SHA-512</option><option>SHA-1</option></select></label><label>Signature format<select value={encoding} onChange={(e) => setEncoding(e.target.value)}><option>Hex</option><option>Base64</option></select></label><label className="crypto-wide">Secret key<input value={keyText} onChange={(e) => setKeyText(e.target.value)} placeholder="Enter a shared secret" /></label><button type="button" className="crypto-button" onClick={generateSecret}><Sparkles size={15}/> Generate key</button><label className="crypto-check"><input type="checkbox" checked={canonicalizeJson} onChange={(e) => setCanonicalizeJson(e.target.checked)}/> Canonicalize JSON (sort object keys)</label>{action === 'verify' && <label className="crypto-wide">Signature to verify<input value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Paste the signature" /></label>}</>}
        {mode === 'base64' && <><label>Text encoding<select value={encoding} onChange={(e) => setEncoding(e.target.value)}><option>UTF-8</option></select></label><p className="crypto-field-note">Base64 is reversible encoding. It does not protect data from being read.</p></>}
      </div>
      <div className="crypto-action-tabs" role="tablist" aria-label="Operation">{tabs.map(([value, label]) => <button type="button" role="tab" aria-selected={action === value} className={action === value ? 'is-active' : ''} key={value} onClick={() => { setAction(value); setOutput(''); setNotice(''); }}>{label}</button>)}</div>
      <div className="crypto-editors"><section className="crypto-editor"><div className="crypto-editor-head"><label htmlFor="crypto-input">{mode === 'symmetric' ? (action === 'encrypt' ? 'Plain text' : 'Encrypted text (Base64)') : mode === 'hash' ? (action === 'verify' ? 'Password / text to verify' : 'Password / text to hash') : mode === 'hmac' ? 'Message / JSON payload' : action === 'encode' ? 'Text to encode' : 'Base64 to decode'}</label><div><button type="button" className="crypto-button" onClick={loadSample}>Sample</button><button type="button" className="crypto-button" onClick={() => { setInput(''); setOutput(''); setNotice(''); }}>Clear</button><button type="button" className="crypto-button" onClick={() => copyText(input)}><Copy size={14}/> Copy</button></div></div><textarea id="crypto-input" value={input} onChange={(e) => setInput(e.target.value)} spellCheck="false" placeholder="Enter or paste your text here…" /></section>
      <section className="crypto-editor"><div className="crypto-editor-head"><label htmlFor="crypto-output">Result</label><div><button type="button" className="crypto-button" onClick={() => copyText(output)} disabled={!output}><Copy size={14}/> Copy</button><button type="button" className="crypto-button crypto-primary" onClick={run}>{mode === 'symmetric' ? (action === 'encrypt' ? 'Encrypt' : 'Decrypt') : mode === 'hash' ? (action === 'verify' ? 'Verify' : 'Generate hash') : mode === 'hmac' ? (action === 'sign' ? 'Generate signature' : 'Verify signature') : action === 'encode' ? 'Encode' : 'Decode'}</button></div></div><textarea id="crypto-output" value={output} onChange={setOutput} spellCheck="false" placeholder="The result will appear here…" /></section></div>
      {mode === 'symmetric' && algorithm === 'RSA-OAEP' && rsaKeys && <div className="crypto-key-exports"><label>Public key (PEM)<textarea readOnly value={publicKeyText}/></label><label>Private key (PEM — keep secret)<textarea readOnly value={privateKeyText}/></label></div>}
      {notice && <p className="crypto-notice" role="status">{notice}</p>}
    </section>
    <section className="crypto-reference"><span className="crypto-eyebrow">QUICK REFERENCE</span><h2>What each cryptography tool does</h2><p>Use the operation and algorithm that match your security requirement.</p><div className="crypto-table-wrap"><table><thead><tr><th>Tool</th><th>Example / input</th><th>Output</th><th>How it is validated</th><th>Important note</th></tr></thead><tbody><tr><th>AES-256-GCM</th><td><code>Hello CodeTrove</code></td><td>IV + encrypted Base64 bytes</td><td>Decrypt with the same key and IV; authentication fails if ciphertext or key is changed.</td><td>Never reuse an IV with the same key.</td></tr><tr><th>RSA-OAEP</th><td>Short message + public key</td><td>Encrypted Base64 bytes</td><td>Only the matching private key decrypts it.</td><td>Use hybrid encryption for large files; RSA has input-size limits.</td></tr><tr><th>SHA-256</th><td><code>Hello CodeTrove</code></td><td>Fixed-length 256-bit digest</td><td>Hash the same input again and compare digests.</td><td>One-way; not a password-storage function.</td></tr><tr><th>HMAC-SHA256</th><td>Message + shared secret</td><td>Hex or Base64 signature</td><td>Recompute and verify using the same secret and exact message.</td><td>Use constant-time verification on server implementations where applicable.</td></tr><tr><th>Base64</th><td><code>Hello</code></td><td><code>SGVsbG8=</code></td><td>Decode and compare with the original text.</td><td>Encoding only; anyone can decode it.</td></tr></tbody></table></div><div className="crypto-how"><h3>How the examples are created and validated</h3><ol><li>Choose an algorithm and enter a sample message or load the built-in sample.</li><li>Generate a secret key, salt, or IV when the selected operation requires one. Keep real secrets private.</li><li>Run the operation. This page uses the browser's Web Crypto API; keys are generated in the current browser session.</li><li>Validate by decrypting with the same key and IV, comparing a digest, verifying an HMAC signature, or decoding Base64 and comparing the original text.</li></ol><p><strong>Salt note:</strong> A salt is commonly used with password key-derivation functions such as PBKDF2, scrypt, or Argon2. It is not automatically mixed into AES or HMAC by this demo; the Generate salt control is available for educational examples and future password-hashing workflows.</p></div><details className="crypto-explainer"><summary>Password hashing: parameters, salt, and verification</summary><p><strong>1. Choose the algorithm.</strong> PBKDF2 is a password-based key derivation function. SHA-256, SHA-384, or SHA-512 is selected as its underlying pseudorandom function. The fast digest option is for integrity fingerprints and should not be used to store passwords.</p><p><strong>2. Generate a salt.</strong> The tool generates 16 random bytes (128 bits), shown as hexadecimal. A salt is unique per password and does not need to be secret. It prevents identical passwords from producing identical hashes when different salts are used.</p><p><strong>3. Set the parameters.</strong> Iterations control the amount of work; higher values take longer. Derived key length controls the output size. This tool defaults to 310,000 iterations and 256 bits, but production settings should follow your platform's current security guidance and performance budget.</p><p><strong>4. Create and store the result.</strong> The output format is <code>pbkdf2$algorithm$iterations$bits$saltHex$derivedHashHex</code>. Store the complete string, not only the derived hash, because verification needs the algorithm, work factor, key length, and salt.</p><p><strong>5. Verify.</strong> Paste the stored result into the verification field and enter the candidate password. The tool derives a new value using the stored parameters and salt, then compares it with the saved value. A match means the candidate password matches this hash; it does not decrypt or reveal the original password.</p><p><strong>Example:</strong> Input <code>correct horse battery staple</code>, generate a random salt, keep PBKDF2 / SHA-256 / 310,000 iterations / 256 bits, then select Generate hash. Copy the full result, switch to Verify password, paste it into Stored PBKDF2 hash, and run Verify with the same password. Changing one character should return INVALID.</p><p><strong>Compatibility note:</strong> This page uses a documented, app-specific PBKDF2 string format. It is not automatically compatible with Authgear or another service's stored hash format unless that service uses the same algorithm, parameters, encoding, and verification format.</p></details><p className="crypto-privacy">All operations are performed locally in your browser. Do not treat this educational page as a substitute for a reviewed production cryptography design.</p></section>
  </main>;
}
