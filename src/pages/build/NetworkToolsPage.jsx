import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, Globe2, Network, RefreshCw, ShieldCheck } from 'lucide-react';
import './NetworkToolsPage.css';

const SECTIONS = [
  { id: 'connection', label: 'Your Connection', icon: Globe2 },
  { id: 'dns', label: 'Domain Name System (DNS)', icon: Network },
  { id: 'transport', label: 'Transport Layer', icon: Network },
  { id: 'tls', label: 'Security Layer (TLS/SSL)', icon: ShieldCheck },
];

const SUBSECTIONS = {
  connection: [
    { id: 'ip', label: 'My IP & ISP' },
    { id: 'speed', label: 'Speed test' },
    { id: 'traceroute', label: 'Traceroute' },
  ],
  dns: [
    { id: 'roles', label: 'Registrars & resolvers' },
    { id: 'lookup', label: 'DNS lookup' },
    { id: 'domain-ip', label: 'Domain IP lookup' },
  ],
  transport: [
    { id: 'handshake', label: 'TCP handshake' },
    { id: 'connect-time', label: 'Connection timing' },
  ],
  tls: [
    { id: 'authorities', label: 'Certificate authorities' },
    { id: 'checker', label: 'Certificate checker' },
  ],
};

const DNS_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'CAA', 'SOA', 'SRV', 'HTTPS'];
const RESOLVERS = {
  cloudflare: { label: 'Cloudflare (1.1.1.1)', endpoint: 'https://cloudflare-dns.com/dns-query' },
  google: { label: 'Google (8.8.8.8)', endpoint: 'https://dns.google/resolve' },
};
const DEFAULT_HOST = 'yash-777.github.io';
const SSL_CHECKER = 'https://www.sslshopper.com/ssl-checker.html#hostname=';

function getHostname(value) {
  const input = value.trim();
  if (!input) throw new Error('Enter a hostname, for example yash-777.github.io.');
  let parsed;
  try {
    parsed = new URL(input.includes('://') ? input : `https://${input}`);
  } catch {
    throw new Error('Enter a valid hostname without a path, such as example.com.');
  }
  if (parsed.username || parsed.password || (parsed.pathname !== '/' && parsed.pathname !== '') || parsed.search || parsed.hash) {
    throw new Error('Enter only a hostname, not a URL path or query string.');
  }
  const hostname = parsed.hostname.replace(/\.$/, '').toLowerCase();
  if (!hostname || hostname.length > 253 || !/^[a-z0-9.-]+$/.test(hostname)) {
    throw new Error('That hostname contains unsupported characters.');
  }
  return hostname;
}

async function queryDns(hostname, type, resolverId) {
  const resolver = RESOLVERS[resolverId];
  const url = new URL(resolver.endpoint);
  url.searchParams.set('name', hostname);
  url.searchParams.set('type', type);
  const response = await fetch(url, { headers: { accept: 'application/dns-json' } });
  if (!response.ok) throw new Error(`${resolver.label} returned HTTP ${response.status} for ${type}.`);
  const payload = await response.json();
  if (payload.Status !== 0 && payload.Status !== 3) {
    throw new Error(`${resolver.label} returned DNS status ${payload.Status} for ${type}.`);
  }
  return (payload.Answer || []).map((answer) => ({
    type,
    name: answer.name,
    data: answer.data,
    ttl: answer.TTL,
  }));
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      // Use a selection-based fallback when clipboard permission is unavailable.
    }
  }
  const field = document.createElement('textarea');
  field.value = value;
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.opacity = '0';
  document.body.appendChild(field);
  field.select();
  const copied = document.execCommand('copy');
  field.remove();
  if (!copied) throw new Error('Copy was blocked by the browser. Select the command and copy it manually.');
}

function Tabs({ items, selected, onSelect, label, className = '' }) {
  return (
    <div className={`network-tabs ${className}`} role="tablist" aria-label={label}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            type="button"
            role="tab"
            aria-selected={selected === item.id}
            className={selected === item.id ? 'is-active' : ''}
            key={item.id}
            onClick={() => onSelect(item.id)}
          >
            {Icon && <Icon size={16} aria-hidden="true" />}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function CommandCard({ title, explanation, commands }) {
  const [copied, setCopied] = useState('');
  const [message, setMessage] = useState('');
  const handleCopy = async (id, command) => {
    try {
      await copyText(command);
      setCopied(id);
      setMessage('Command copied. Paste it into a terminal on your computer.');
      window.setTimeout(() => setCopied(''), 1500);
    } catch (error) {
      setMessage(error.message);
    }
  };
  return (
    <section className="network-command-card">
      <h3>{title}</h3>
      <p>{explanation}</p>
      <div className="network-command-list">
        {commands.map((item) => (
          <div className="network-command" key={item.id}>
            <div className="network-command__label">{item.label}</div>
            <code>{item.command}</code>
            <button type="button" className={`network-button${copied === item.id ? ' is-copied' : ''}`} onClick={() => handleCopy(item.id, item.command)}>
              {copied === item.id ? <Check size={15} /> : <Copy size={15} />}
              {copied === item.id ? 'Copied' : 'Copy command'}
            </button>
          </div>
        ))}
      </div>
      {message && <p className="network-notice" role="status">{message}</p>}
    </section>
  );
}

function HostField({ hostname, setHostname }) {
  return (
    <label className="network-host-field">
      <span>Hostname to check</span>
      <input value={hostname} onChange={(event) => setHostname(event.target.value)} placeholder="example.com" autoComplete="url" spellCheck="false" />
    </label>
  );
}

function ConnectionPanel({ ipDetails, ipBusy, ipMessage, onLookup }) {
  return (
    <div className="network-panel">
      <h2>My public IP and ISP</h2>
      <p className="network-lead">Look up the public address and approximate network information visible to an IP-lookup service. Your browser cannot read your ISP or public IP directly, so this request is sent to ipwho.is.</p>
      <div className="network-toolbar">
        <button type="button" className="network-button network-button--primary" onClick={onLookup} disabled={ipBusy}>
          {ipBusy ? <RefreshCw size={15} className="network-spin" /> : <Globe2 size={15} />}
          {ipBusy ? 'Looking up…' : 'Look up my connection'}
        </button>
        <span className="network-muted">No location lookup runs until you press the button.</span>
      </div>
      {ipMessage && <p className="network-notice" role="status">{ipMessage}</p>}
      {ipDetails && (
        <dl className="network-details-grid">
          <div><dt>Public IP</dt><dd>{ipDetails.ip || 'Not provided'}</dd></div>
          <div><dt>ISP / organization</dt><dd>{ipDetails.connection?.isp || ipDetails.connection?.org || 'Not provided'}</dd></div>
          <div><dt>Location estimate</dt><dd>{[ipDetails.city, ipDetails.region, ipDetails.country].filter(Boolean).join(', ') || 'Not provided'}</dd></div>
          <div><dt>Network / ASN</dt><dd>{ipDetails.connection?.asn ? `AS${ipDetails.connection.asn}` : 'Not provided'}</dd></div>
        </dl>
      )}
      <details className="network-explainer">
        <summary>What does this result mean?</summary>
        <p>The public IP is the address a remote service sees after any router, VPN, or carrier-grade NAT. ISP and location are estimates returned by the lookup provider; they may be missing or imprecise. This does not reveal your device's private LAN address.</p>
      </details>
    </div>
  );
}

function DnsPanel({ hostname, setHostname, resolver, setResolver, dnsResults, dnsBusy, dnsMessage, lookup, lookupMode = 'all', title = 'DNS lookup', description = 'Query common DNS record types through the selected public DNS-over-HTTPS resolver. This browser-based lookup is a convenient view, not a replacement for your operating system\'s configured resolver.' }) {
  return (
    <div className="network-panel">
      <h2>{title}</h2>
      <p className="network-lead">{description}</p>
      <div className="network-form-grid">
        <HostField hostname={hostname} setHostname={setHostname} />
        <label className="network-host-field">
          <span>Public resolver</span>
          <select value={resolver} onChange={(event) => setResolver(event.target.value)}>
            {Object.entries(RESOLVERS).map(([id, item]) => <option value={id} key={id}>{item.label}</option>)}
          </select>
        </label>
      </div>
      <div className="network-toolbar">
        <button type="button" className="network-button network-button--primary" onClick={() => lookup(lookupMode)} disabled={dnsBusy}>
          {dnsBusy ? <RefreshCw size={15} className="network-spin" /> : <Network size={15} />}
          {dnsBusy ? 'Querying…' : lookupMode === 'ip' ? 'Look up IPv4 / IPv6' : 'Look up all records'}
        </button>
        {lookupMode === 'all' && <button type="button" className="network-button" onClick={() => lookup('ip')} disabled={dnsBusy}>Domain IP lookup (A / AAAA)</button>}
        <span className="network-muted">Records: {DNS_TYPES.join(', ')}</span>
      </div>
      {dnsMessage && <p className="network-notice" role="status">{dnsMessage}</p>}
      {dnsResults.length > 0 && (
        <div className="network-record-list" aria-live="polite">
          {dnsResults.map((record, index) => (
            <article className="network-record" key={`${record.type}-${record.name}-${record.data}-${index}`}>
              <span className="network-record__type">{record.type}</span>
              <div><strong>{record.name}</strong><code>{record.data}</code></div>
              <span className="network-record__ttl">TTL {record.ttl ?? '—'}s</span>
            </article>
          ))}
        </div>
      )}
      <details className="network-explainer">
        <summary>How DNS lookup works</summary>
        <p>The selected recursive resolver receives the hostname and record-type query, then returns its current answer. A, AAAA, and CNAME commonly map a name to an address or alias. MX identifies mail exchangers; NS names authoritative servers; TXT and CAA hold other domain policies. An empty result can mean no record of that type, a cached negative response, or a resolver/network restriction.</p>
        <p>The resolver can see the names you query. Do not use this page for confidential internal hostnames.</p>
      </details>
    </div>
  );
}

function NetworkToolsPage() {
  const [section, setSection] = useState('connection');
  const [subsection, setSubsection] = useState({ connection: 'ip', dns: 'roles', transport: 'handshake', tls: 'authorities' });
  const [hostname, setHostname] = useState(DEFAULT_HOST);
  const [resolver, setResolver] = useState('cloudflare');
  const [ipDetails, setIpDetails] = useState(null);
  const [ipBusy, setIpBusy] = useState(false);
  const [ipMessage, setIpMessage] = useState('');
  const [dnsResults, setDnsResults] = useState([]);
  const [dnsBusy, setDnsBusy] = useState(false);
  const [dnsMessage, setDnsMessage] = useState('');

  const chooseSection = (next) => {
    setSection(next);
    setSubsection((current) => ({ ...current, [next]: current[next] || SUBSECTIONS[next][0].id }));
  };

  const lookupIp = async () => {
    setIpBusy(true);
    setIpMessage('');
    setIpDetails(null);
    try {
      const response = await fetch('https://ipwho.is/');
      if (!response.ok) throw new Error(`IP lookup returned HTTP ${response.status}.`);
      const result = await response.json();
      if (result.success === false) throw new Error(result.message || 'The IP lookup provider could not return connection details.');
      setIpDetails(result);
      setIpMessage('Connection lookup completed. Results are approximate and come from ipwho.is.');
    } catch (error) {
      setIpMessage(`${error.message || 'The lookup failed.'} Check your connection or browser privacy settings and try again.`);
    } finally {
      setIpBusy(false);
    }
  };

  const lookupDns = async (mode) => {
    setDnsBusy(true);
    setDnsMessage('');
    setDnsResults([]);
    try {
      const host = getHostname(hostname);
      const types = mode === 'ip' ? ['A', 'AAAA'] : DNS_TYPES;
      const responses = await Promise.all(types.map(async (type) => {
        try {
          return { type, records: await queryDns(host, type, resolver), error: '' };
        } catch (error) {
          return { type, records: [], error: error.message || `Unable to query ${type}.` };
        }
      }));
      const records = responses.flatMap((item) => item.records);
      const errors = responses.filter((item) => item.error);
      setDnsResults(records);
      if (records.length) {
        setDnsMessage(`${records.length} answer${records.length === 1 ? '' : 's'} returned by ${RESOLVERS[resolver].label}${errors.length ? `; ${errors.length} record type(s) could not be queried` : ''}.`);
      } else if (errors.length) {
        setDnsMessage(errors[0].error);
      } else {
        setDnsMessage(`No ${mode === 'ip' ? 'A or AAAA address' : 'matching'} records were returned for ${host}.`);
      }
    } catch (error) {
      setDnsMessage(error.message || 'DNS lookup failed.');
    } finally {
      setDnsBusy(false);
    }
  };

  const currentSubsection = subsection[section];
  const certificateHost = (() => {
    try { return getHostname(hostname); } catch { return ''; }
  })();

  return (
    <main className="network-page">
      <header className="network-intro">
        <p className="network-eyebrow">BUILD / TOOLS / NETWORKING</p>
        <div className="network-heading-row">
          <div>
            <h1><Network size={29} aria-hidden="true" /> Network</h1>
            <p>Explore connection details, DNS records, TCP connection setup, and TLS certificates with browser-based diagnostics and practical local commands.</p>
          </div>
          <Link className="network-back-link" to="/build/tools">Back to Tools</Link>
        </div>
        <div className="network-safety"><strong>Privacy note:</strong> Network checks may send the hostname or public IP to a selected third-party resolver or lookup service. DNS and IP results are fetched only when you request them. The speed-test and certificate-checker panels are hosted by their respective providers.</div>
      </header>

      <section className="network-card" aria-label="Network diagnostics">
        <Tabs items={SECTIONS} selected={section} onSelect={chooseSection} label="Network sections" className="network-section-tabs" />
        <Tabs items={SUBSECTIONS[section]} selected={currentSubsection} onSelect={(value) => setSubsection((current) => ({ ...current, [section]: value }))} label={`${SECTIONS.find((item) => item.id === section)?.label} tools`} className="network-sub-tabs" />

        {section === 'connection' && currentSubsection === 'ip' && <ConnectionPanel ipDetails={ipDetails} ipBusy={ipBusy} ipMessage={ipMessage} onLookup={lookupIp} />}
        {section === 'connection' && currentSubsection === 'speed' && (
          <div className="network-panel">
            <h2>TRAI MySpeed test</h2>
            <p className="network-lead">TRAI MySpeed measures connection performance using the official service. Run it when other large downloads are idle for a more representative result. The test runs on the provider's site embedded below.</p>
            <div className="network-frame-wrap"><iframe title="TRAI MySpeed internet speed test" src="https://myspeed.trai.gov.in/" loading="lazy" allow="clipboard-read; clipboard-write" referrerPolicy="strict-origin-when-cross-origin" /></div>
            <p className="network-muted">If the service does not render here, its security policy or your browser may block embedding. Speed-test results depend on test server, Wi-Fi signal, device load, and background traffic.</p>
            <details className="network-explainer"><summary>What a speed test measures</summary><p>Download and upload throughput are estimates between your device and the selected test infrastructure. Latency and test conditions matter; a single result is not a guaranteed speed for every application or destination.</p></details>
          </div>
        )}
        {section === 'connection' && currentSubsection === 'traceroute' && (
          <div className="network-panel">
            <h2>Trace the route from your computer</h2>
            <p className="network-lead">Traceroute sends packets with increasing hop limits and reports the routers that respond along the route. This runs locally in your terminal, not in the browser.</p>
            <CommandCard title="Traceroute commands" explanation="Use the command for your operating system. Replace the hostname to inspect a different destination." commands={[
              { id: 'tracert-win', label: 'Windows Command Prompt / PowerShell', command: 'tracert google.com' },
              { id: 'traceroute-unix', label: 'macOS / Linux', command: 'traceroute google.com' },
              { id: 'tracepath-linux', label: 'Linux alternative (if installed)', command: 'tracepath google.com' },
            ]} />
            <details className="network-explainer"><summary>Read the output</summary><p>Each row is a hop and usually contains up to three round-trip times plus the responding router. Asterisks mean that a probe timed out or the router did not send a reply; filtering does not necessarily mean the route is broken. The path can vary by protocol, time, and network policy.</p></details>
          </div>
        )}

        {section === 'dns' && currentSubsection === 'roles' && (
          <div className="network-panel">
            <h2>Domain registrars, resolvers, and authoritative DNS</h2>
            <p className="network-lead">These services work together, but they have different roles. A registrar manages domain registration; DNS hosting stores records; recursive resolvers find answers for clients.</p>
            <div className="network-concept-grid">
              <article><h3>Domain registrars</h3><p>Companies such as Namecheap, GoDaddy, Porkbun, Cloudflare Registrar, and BigRock sell or manage domain registrations. Many provide a control panel for choosing authoritative nameservers or editing DNS records.</p></article>
              <article><h3>Recursive DNS resolvers</h3><p>A resolver looks up a hostname on behalf of your device and may cache the answer. Examples include your ISP's resolver and public services such as Cloudflare 1.1.1.1 or Google Public DNS 8.8.8.8.</p></article>
              <article><h3>Authoritative nameservers</h3><p>Authoritative servers publish the DNS zone's records. The domain's delegation points resolvers to these servers; the registrar and the authoritative DNS operator can be different companies.</p></article>
            </div>
            <details className="network-explainer"><summary>Typical lookup flow</summary><p>Your device asks its configured recursive resolver. If the answer is not cached, that resolver follows DNS delegation from the root to the top-level domain and then to the domain's authoritative nameserver. It returns the result to your device and can cache it for the record's TTL.</p></details>
          </div>
        )}
        {section === 'dns' && currentSubsection === 'lookup' && <DnsPanel hostname={hostname} setHostname={setHostname} resolver={resolver} setResolver={setResolver} dnsResults={dnsResults} dnsBusy={dnsBusy} dnsMessage={dnsMessage} lookup={lookupDns} />}
        {section === 'dns' && currentSubsection === 'domain-ip' && <DnsPanel hostname={hostname} setHostname={setHostname} resolver={resolver} setResolver={setResolver} dnsResults={dnsResults.filter((record) => record.type === 'A' || record.type === 'AAAA')} dnsBusy={dnsBusy} dnsMessage={dnsMessage} lookup={lookupDns} lookupMode="ip" title="Domain IP lookup" description="Find the IPv4 (A) and IPv6 (AAAA) addresses currently returned for a hostname. This uses the selected DNS-over-HTTPS resolver." />}

        {section === 'transport' && currentSubsection === 'handshake' && (
          <div className="network-panel">
            <h2>TCP three-way handshake</h2>
            <p className="network-lead">Before a TCP connection carries application data, the client and server establish synchronized connection state with three messages.</p>
            <ol className="network-handshake">
              <li><span>1</span><div><strong>SYN</strong><p>The client asks to start a connection and proposes an initial sequence number.</p></div></li>
              <li><span>2</span><div><strong>SYN-ACK</strong><p>The server acknowledges the client's request and proposes its own sequence number.</p></div></li>
              <li><span>3</span><div><strong>ACK</strong><p>The client acknowledges the server. The TCP connection is established and data can flow.</p></div></li>
            </ol>
            <div className="network-callout"><strong>Correct sequence:</strong> SYN → SYN-ACK → ACK. It is three steps, not “SYN-SYN-ACK.”</div>
            <details className="network-explainer"><summary>Where TLS fits</summary><p>For HTTPS, TLS negotiation follows the TCP setup (or uses a different transport with HTTP/3). TCP connection timing is only one part of page-load latency. The browser does not expose raw TCP packets to this page.</p></details>
          </div>
        )}
        {section === 'transport' && currentSubsection === 'connect-time' && (
          <div className="network-panel">
            <h2>Measure connection setup with curl</h2>
            <p className="network-lead">Run this command on your computer to ask curl for the number of new connections, redirect count, and final URL. It reports connection timing metadata; it does not show the individual SYN packets.</p>
            <CommandCard title="Connection and redirect summary" explanation="The requested options follow redirects, discard the response body, and print a concise summary." commands={[
              { id: 'curl-win', label: 'Windows PowerShell / Command Prompt', command: 'curl.exe -L -s -o NUL -w "new connections: %{num_connects}  redirects: %{num_redirects}  final: %{url_effective}\\n" https://google.io' },
              { id: 'curl-unix', label: 'macOS / Linux', command: 'curl -L -s -o /dev/null -w "new connections: %{num_connects}  redirects: %{num_redirects}  final: %{url_effective}\\n" https://google.io' },
            ]} />
            <div className="network-concept-grid network-concept-grid--three">
              <article><h3>new connections</h3><p>How many new connections curl opened for the transfer. Connection reuse and redirects can affect the count.</p></article>
              <article><h3>redirects</h3><p>How many HTTP redirects curl followed because of <code>-L</code>.</p></article>
              <article><h3>final</h3><p>The effective URL after redirects. It helps identify the destination that served the response.</p></article>
            </div>
            <p className="network-muted">The timing of curl's TCP setup is exposed with <code>%&#123;time_connect&#125;</code>; it is elapsed time, not a packet-by-packet handshake capture.</p>
          </div>
        )}

        {section === 'tls' && currentSubsection === 'authorities' && (
          <div className="network-panel">
            <h2>TLS/SSL certificate authorities</h2>
            <p className="network-lead">A certificate authority (CA) validates a domain or organization under its issuance rules and signs a certificate. Browsers use certificate chains and their trusted root store to authenticate HTTPS servers.</p>
            <ul className="network-ca-list">
              <li><strong>Let’s Encrypt</strong><span>Automated, publicly trusted certificates, commonly issued at no cost.</span><a href="https://letsencrypt.org/" target="_blank" rel="noopener noreferrer">Official site</a></li>
              <li><strong>DigiCert</strong><span>Commercial certificate and PKI services.</span><a href="https://www.digicert.com/" target="_blank" rel="noopener noreferrer">Official site</a></li>
              <li><strong>Sectigo</strong><span>Public certificate authority and related security products.</span><a href="https://www.sectigo.com/" target="_blank" rel="noopener noreferrer">Official site</a></li>
              <li><strong>GlobalSign</strong><span>Public CA and identity services.</span><a href="https://www.globalsign.com/" target="_blank" rel="noopener noreferrer">Official site</a></li>
            </ul>
            <details className="network-explainer"><summary>What a certificate proves</summary><p>A valid certificate helps bind a public key to a hostname under a CA's validation process. A successful check also depends on the current validity period, hostname match, signatures, and a chain that the client trusts. HTTPS alone does not prove a site is safe or trustworthy.</p></details>
          </div>
        )}
        {section === 'tls' && currentSubsection === 'checker' && (
          <div className="network-panel">
            <h2>TLS/SSL certificate checker</h2>
            <p className="network-lead">Use the embedded SSL Shopper checker to inspect a site's certificate validity, expiry, issuer, and chain. The checker runs on its own service; CodeTrove does not read or store certificate data.</p>
            <HostField hostname={hostname} setHostname={setHostname} />
            {certificateHost ? (
              <div className="network-frame-wrap network-frame-wrap--certificate"><iframe title={`SSL certificate checker for ${certificateHost}`} src={`${SSL_CHECKER}${encodeURIComponent(certificateHost)}`} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" /></div>
            ) : <p className="network-error" role="alert">Enter a valid hostname only. Do not include a path or query string.</p>}
            <p className="network-muted">If the provider blocks framing, the embedded area may remain blank. For checks from your own computer, use the command below with OpenSSL installed.</p>
            <CommandCard title="Inspect a server certificate with OpenSSL" explanation="This requests the certificate chain for the chosen host from your local terminal. Replace the sample host with the hostname you are checking." commands={[
              { id: 'openssl-unix', label: 'macOS / Linux / Git Bash / WSL', command: `openssl s_client -connect ${certificateHost || 'example.com'}:443 -servername ${certificateHost || 'example.com'} -showcerts </dev/null` },
              { id: 'openssl-windows', label: 'Windows PowerShell (if OpenSSL is installed)', command: `openssl s_client -connect ${certificateHost || 'example.com'}:443 -servername ${certificateHost || 'example.com'} -showcerts < NUL` },
            ]} />
            <details className="network-explainer"><summary>Limits of local browser checks</summary><p>A static browser page cannot inspect a separate server's live TLS certificate chain using ordinary web APIs. The embedded service performs that remote check. OpenSSL can show the chain from your local computer; confirm hostname, dates, verification output, and the certificate's intended use.</p></details>
          </div>
        )}
      </section>
    </main>
  );
}

export default NetworkToolsPage;
