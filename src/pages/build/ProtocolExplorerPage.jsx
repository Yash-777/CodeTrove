import { useEffect, useMemo, useState } from 'react';
import { Activity, ChevronLeft, ChevronRight, CircleHelp, Copy, ExternalLink, Pause, Play, RotateCcw, Search, Zap } from 'lucide-react';
import ToolBackLink from '../../components/ToolBackLink.jsx';
import './ProtocolExplorerPage.css';

const PROTOCOLS = [
  {
    id: 'http', name: 'HTTP', label: 'Hypertext transfer', category: 'Application', layer: 7, port: '80', transport: 'TCP', rfc: 'RFC 9110', color: '#f97316',
    description: 'The web request language. A browser asks for a resource and the server answers with a status code, headers, and a response body.',
    steps: ['Resolve the name', 'Open a TCP connection', 'Request a resource', 'Return the response'],
    participants: ['Browser', 'DNS resolver', 'Web server'],
    packets: [
      ['Browser', 'DNS resolver', 'DNS', 'Query A example.com', '71 B'],
      ['DNS resolver', 'Browser', 'DNS', 'Answer A 203.0.113.10', '87 B'],
      ['Browser', 'Web server', 'TCP', 'SYN · Seq=1000', '60 B'],
      ['Web server', 'Browser', 'TCP', 'SYN, ACK · Ack=1001', '60 B'],
      ['Browser', 'Web server', 'TCP', 'ACK · Ack=5001', '60 B'],
      ['Browser', 'Web server', 'HTTP', 'GET / HTTP/1.1 · Host: example.com', '91 B'],
      ['Web server', 'Browser', 'HTTP', 'HTTP/1.1 200 OK · text/html', '149 B'],
    ],
  },
  {
    id: 'https', name: 'HTTPS', label: 'HTTP with TLS', category: 'Security', layer: 7, port: '443', transport: 'TCP + TLS', rfc: 'RFC 9110 / 8446', color: '#8b5cf6',
    description: 'HTTP carried through an encrypted, authenticated TLS session. The request is protected after the handshake completes.',
    steps: ['Resolve the name', 'Open TCP', 'Negotiate TLS', 'Exchange encrypted HTTP'],
    participants: ['Browser', 'DNS resolver', 'Secure server'],
    packets: [
      ['Browser', 'DNS resolver', 'DNS', 'Query A secure.example.com', '78 B'],
      ['DNS resolver', 'Browser', 'DNS', 'Answer A 203.0.113.10', '94 B'],
      ['Browser', 'Secure server', 'TCP', 'SYN · port 443', '60 B'],
      ['Secure server', 'Browser', 'TCP', 'SYN, ACK', '60 B'],
      ['Browser', 'Secure server', 'TLS', 'ClientHello · TLS 1.3', '517 B'],
      ['Secure server', 'Browser', 'TLS', 'ServerHello + Certificate', '3.1 KB'],
      ['Browser', 'Secure server', 'TLS', 'Finished · encrypted channel ready', '85 B'],
      ['Browser', 'Secure server', 'HTTPS', 'GET /account · encrypted', '1.2 KB'],
    ],
  },
  {
    id: 'dns', name: 'DNS', label: 'Names into addresses', category: 'Core', layer: 7, port: '53', transport: 'UDP or TCP', rfc: 'RFC 1034', color: '#06b6d4',
    description: 'DNS maps names such as example.com to records. A recursive resolver follows cached data or asks authoritative servers.',
    steps: ['Ask the resolver', 'Check the root', 'Find the TLD server', 'Ask authoritative DNS', 'Cache the answer'],
    participants: ['Laptop', 'Recursive resolver', 'Authoritative server'],
    packets: [
      ['Laptop', 'Recursive resolver', 'DNS', 'Query A www.example.com', '75 B'],
      ['Recursive resolver', 'Root server', 'DNS', 'Referral: .com nameservers', '493 B'],
      ['Recursive resolver', '.com TLD server', 'DNS', 'Referral: example.com NS', '402 B'],
      ['Recursive resolver', 'Authoritative server', 'DNS', 'Query A www.example.com', '75 B'],
      ['Authoritative server', 'Recursive resolver', 'DNS', 'Answer A 203.0.113.10 · TTL 300', '91 B'],
      ['Recursive resolver', 'Laptop', 'DNS', 'Cached answer A 203.0.113.10', '91 B'],
    ],
  },
  {
    id: 'tcp', name: 'TCP', label: 'Reliable byte streams', category: 'Core', layer: 4, port: 'Any', transport: 'IP', rfc: 'RFC 9293', color: '#0ea5e9',
    description: 'TCP creates an ordered, reliable byte stream. Sequence numbers, acknowledgements, retransmissions, and flow control handle delivery.',
    steps: ['Synchronize', 'Acknowledge', 'Send numbered data', 'Close both sides'],
    participants: ['Client', 'Router', 'Server'],
    packets: [
      ['Client', 'Server', 'TCP', 'SYN · Seq=1000 · Window=64240', '60 B'],
      ['Server', 'Client', 'TCP', 'SYN, ACK · Seq=5000 · Ack=1001', '60 B'],
      ['Client', 'Server', 'TCP', 'ACK · Ack=5001', '52 B'],
      ['Client', 'Server', 'TCP', 'PSH, ACK · Seq=1001 · 1200 bytes', '1252 B'],
      ['Server', 'Client', 'TCP', 'ACK · Ack=2201', '52 B'],
      ['Client', 'Server', 'TCP', 'FIN, ACK · close request', '52 B'],
      ['Server', 'Client', 'TCP', 'ACK + FIN · close response', '52 B'],
    ],
  },
  {
    id: 'udp', name: 'UDP', label: 'Independent datagrams', category: 'Core', layer: 4, port: 'Any', transport: 'IP', rfc: 'RFC 768', color: '#22c55e',
    description: 'UDP sends independent datagrams without a connection handshake or built-in retransmission. The application decides how to handle loss.',
    steps: ['Prepare a datagram', 'Send immediately', 'Receive or lose it', 'Let the app decide'],
    participants: ['Client app', 'Network', 'Server app'],
    packets: [
      ['Client app', 'Server app', 'UDP', 'Datagram 1 · sequence=1', '128 B'],
      ['Client app', 'Server app', 'UDP', 'Datagram 2 · sequence=2', '128 B'],
      ['Client app', 'Server app', 'UDP', 'Datagram 3 · sequence=3', '128 B'],
      ['Network', '—', 'UDP', 'Datagram 4 lost in transit', '—'],
      ['Server app', 'Client app', 'UDP', 'Application response', '96 B'],
    ],
  },
  {
    id: 'tls', name: 'TLS', label: 'Encrypted transport', category: 'Security', layer: 6, port: '443', transport: 'TCP', rfc: 'RFC 8446', color: '#ec4899',
    description: 'TLS authenticates the server with a certificate and establishes keys so application data can be encrypted and integrity-protected.',
    steps: ['ClientHello', 'ServerHello', 'Verify certificate', 'Exchange Finished'],
    participants: ['Client', 'Certificate authority', 'Server'],
    packets: [
      ['Client', 'Server', 'TLS', 'ClientHello · supported versions and suites', '517 B'],
      ['Server', 'Client', 'TLS', 'ServerHello · TLS 1.3 selected', '122 B'],
      ['Server', 'Client', 'TLS', 'Certificate · server identity', '2.4 KB'],
      ['Client', 'Server', 'TLS', 'Finished · proof of key possession', '80 B'],
      ['Server', 'Client', 'TLS', 'Finished · secure session confirmed', '80 B'],
      ['Client', 'Server', 'TLS', 'Application Data · encrypted records', '1.1 KB'],
    ],
  },
  {
    id: 'websocket', name: 'WebSocket', label: 'Two-way web messaging', category: 'Application', layer: 7, port: '80 / 443', transport: 'TCP', rfc: 'RFC 6455', color: '#f59e0b',
    description: 'WebSocket upgrades an HTTP connection into a long-lived, bidirectional channel where either side can send messages.',
    steps: ['Open HTTP connection', 'Request upgrade', 'Accept protocol switch', 'Exchange frames'],
    participants: ['Browser', 'WebSocket server'],
    packets: [
      ['Browser', 'WebSocket server', 'HTTP', 'GET /socket · Upgrade: websocket', '381 B'],
      ['WebSocket server', 'Browser', 'HTTP', '101 Switching Protocols', '129 B'],
      ['Browser', 'WebSocket server', 'WS', 'Text frame · {"type":"join"}', '74 B'],
      ['WebSocket server', 'Browser', 'WS', 'Text frame · welcome event', '112 B'],
      ['Browser', 'WebSocket server', 'WS', 'Ping frame', '6 B'],
      ['WebSocket server', 'Browser', 'WS', 'Pong frame', '6 B'],
    ],
  },
  {
    id: 'icmp', name: 'ICMP', label: 'Network control messages', category: 'Core', layer: 3, port: 'None', transport: 'IP', rfc: 'RFC 792', color: '#64748b',
    description: 'ICMP reports network conditions and powers tools such as ping and traceroute. It is a control protocol, not an application data stream.',
    steps: ['Send echo request', 'Return echo reply', 'Reduce TTL', 'Locate each hop'],
    participants: ['Your computer', 'Router', 'Destination'],
    packets: [
      ['Your computer', 'Destination', 'ICMP', 'Echo request · id=42 seq=1', '64 B'],
      ['Destination', 'Your computer', 'ICMP', 'Echo reply · time=18 ms', '64 B'],
      ['Your computer', 'Router', 'ICMP', 'TTL=1 probe', '64 B'],
      ['Router', 'Your computer', 'ICMP', 'Time exceeded · hop 1', '92 B'],
      ['Your computer', 'Destination', 'ICMP', 'TTL=2 probe', '64 B'],
      ['Destination', 'Your computer', 'ICMP', 'Echo reply · final hop', '64 B'],
    ],
  },
];

const CATEGORIES = ['All', 'Core', 'Application', 'Security'];
const SPEEDS = { 0.5: 1400, 1: 850, 1.5: 560, 2: 360 };

function ProtocolExplorerPage() {
  const [selectedId, setSelectedId] = useState('http');
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [view, setView] = useState('network');
  const [selectedPacket, setSelectedPacket] = useState(0);
  const [speed, setSpeed] = useState('1');
  const [playing, setPlaying] = useState(false);

  const filteredProtocols = useMemo(() => PROTOCOLS.filter((protocol) => {
    const matchesCategory = category === 'All' || protocol.category === category;
    const term = query.trim().toLowerCase();
    return matchesCategory && (!term || `${protocol.name} ${protocol.label} ${protocol.description}`.toLowerCase().includes(term));
  }), [category, query]);
  const protocol = PROTOCOLS.find((item) => item.id === selectedId) || PROTOCOLS[0];
  const packet = protocol.packets[selectedPacket];
  const progress = protocol.packets.length ? Math.round(((selectedPacket + 1) / protocol.packets.length) * 100) : 0;

  useEffect(() => {
    setSelectedPacket(0);
    setPlaying(false);
  }, [selectedId]);

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => {
      setSelectedPacket((current) => {
        if (current >= protocol.packets.length - 1) {
          setPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, SPEEDS[speed]);
    return () => window.clearInterval(timer);
  }, [playing, protocol, speed]);

  const chooseProtocol = (id) => {
    setSelectedId(id);
    setView('network');
  };
  const step = (direction) => {
    setPlaying(false);
    setSelectedPacket((current) => Math.max(0, Math.min(protocol.packets.length - 1, current + direction)));
  };

  return (
    <main className="protocol-page">
      <header className="protocol-page__header">
        <div>
          <ToolBackLink />
          <p className="protocol-eyebrow"><Activity size={14} aria-hidden="true" /> BUILD / NETWORKING</p>
          <h1>Protocol Explorer</h1>
          <p className="protocol-page__intro">See how internet protocols cooperate, one message at a time. Choose a scenario, inspect its packets, and move through the exchange at your own pace.</p>
        </div>
        <div className="protocol-page__header-note"><Zap size={17} aria-hidden="true" /><span>Illustrative teaching traces. No live traffic is captured.</span></div>
      </header>

      <div className="protocol-layout">
        <aside className="protocol-library" aria-label="Protocol library">
          <div className="protocol-library__title"><span>Protocols</span><strong>{PROTOCOLS.length}</strong></div>
          <label className="protocol-search"><Search size={15} aria-hidden="true" /><span className="sr-only">Search protocols</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search protocols" /></label>
          <div className="protocol-filters" role="tablist" aria-label="Protocol categories">
            {CATEGORIES.map((item) => <button key={item} type="button" className={category === item ? 'is-active' : ''} onClick={() => setCategory(item)}>{item}</button>)}
          </div>
          <div className="protocol-list">
            {filteredProtocols.map((item) => <button type="button" className={`protocol-list__item${item.id === selectedId ? ' is-selected' : ''}`} key={item.id} onClick={() => chooseProtocol(item.id)}><span className="protocol-list__dot" style={{ background: item.color }} /><span><strong>{item.name}</strong><small>{item.label}</small></span><span className="protocol-list__layer">L{item.layer}</span></button>)}
            {filteredProtocols.length === 0 && <p className="protocol-empty">No protocol matches that search.</p>}
          </div>
          <div className="protocol-library__tip"><CircleHelp size={15} aria-hidden="true" /><span>Start with DNS, TCP, and HTTP to follow a complete page request.</span></div>
        </aside>

        <section className="protocol-workspace" aria-live="polite">
          <div className="protocol-workspace__topline"><span className="protocol-breadcrumb">NOW EXPLORING / <strong>{protocol.name}</strong></span><span className="protocol-progress">{selectedPacket + 1} / {protocol.packets.length} events</span></div>
          <div className="protocol-title-row"><div><h2>{protocol.name} <span>{protocol.label}</span></h2><p>{protocol.description}</p></div><div className="protocol-layer-badge">OSI LAYER <strong>{protocol.layer}</strong></div></div>
          <div className="protocol-facts"><div><span>Category</span><strong>{protocol.category}</strong></div><div><span>Default port</span><strong>{protocol.port}</strong></div><div><span>Transport</span><strong>{protocol.transport}</strong></div><div><span>Defined in</span><strong>{protocol.rfc}</strong></div></div>

          <div className="protocol-view-tabs" role="tablist" aria-label="Protocol views"><button type="button" className={view === 'network' ? 'is-active' : ''} onClick={() => setView('network')} role="tab" aria-selected={view === 'network'}>Network view</button><button type="button" className={view === 'sequence' ? 'is-active' : ''} onClick={() => setView('sequence')} role="tab" aria-selected={view === 'sequence'}>Sequence view</button></div>
          {view === 'network' ? <NetworkView protocol={protocol} packet={packet} /> : <SequenceView protocol={protocol} selectedPacket={selectedPacket} onSelect={setSelectedPacket} />}

          <div className="protocol-event-caption"><span className="protocol-event-number">{String(selectedPacket + 1).padStart(2, '0')}</span><div><strong>{protocol.steps[Math.min(selectedPacket, protocol.steps.length - 1)]}</strong><p>{packet[0]} → {packet[1]} · {packet[3]}</p></div></div>
          <div className="protocol-controls"><button type="button" className="protocol-control" onClick={() => step(-1)} disabled={selectedPacket === 0} aria-label="Previous event"><ChevronLeft size={17} /></button><button type="button" className="protocol-control protocol-control--primary" onClick={() => (selectedPacket === protocol.packets.length - 1 ? setSelectedPacket(0) : setPlaying((current) => !current))}>{playing ? <Pause size={16} /> : <Play size={16} />}{playing ? 'Pause' : selectedPacket === protocol.packets.length - 1 ? 'Replay' : 'Play'}</button><button type="button" className="protocol-control" onClick={() => step(1)} disabled={selectedPacket === protocol.packets.length - 1}><ChevronRight size={16} /> Step</button><button type="button" className="protocol-control" onClick={() => { setPlaying(false); setSelectedPacket(0); }}><RotateCcw size={15} /> Reset</button><label className="protocol-speed">Speed<select value={speed} onChange={(event) => setSpeed(event.target.value)}>{Object.keys(SPEEDS).map((value) => <option key={value} value={value}>{value}×</option>)}</select></label><div className="protocol-progress-bar" aria-label={`${progress}% complete`}><span style={{ width: `${progress}%` }} /></div></div>

          <section className="protocol-packets"><div className="protocol-section-heading"><div><p className="protocol-eyebrow">EVENT LOG</p><h3>Packet flow</h3></div><span>Click an event to inspect it</span></div><div className="protocol-table-wrap"><table><thead><tr><th>No.</th><th>From</th><th>To</th><th>Protocol</th><th>Message</th><th>Size</th></tr></thead><tbody>{protocol.packets.map((item, index) => <tr key={`${item[3]}-${index}`} className={selectedPacket === index ? 'is-current' : ''} onClick={() => { setPlaying(false); setSelectedPacket(index); }}><td>{String(index + 1).padStart(2, '0')}</td><td>{item[0]}</td><td>{item[1]}</td><td><span className="protocol-chip">{item[2]}</span></td><td>{item[3]}</td><td>{item[4]}</td></tr>)}</tbody></table></div></section>

          <details className="protocol-explainer"><summary>How to use this simulator</summary><p>Play advances through a predefined teaching scenario. The network view emphasizes participants and direction, while Sequence view emphasizes message order. Times and sizes are representative, not measurements from a live endpoint.</p><p>This page runs entirely in your browser and does not send the selected protocol scenario or packet data to a service.</p></details>
          <footer className="protocol-references"><span>Want a larger protocol library?</span><a href="https://a2aprotocol.ai/tools/protocol-explorer" target="_blank" rel="noopener noreferrer">A2A Protocol Explorer <ExternalLink size={13} /></a><a href="https://protocol-explorer-alpha.vercel.app/" target="_blank" rel="noopener noreferrer">Protocol Explorer Alpha <ExternalLink size={13} /></a><button type="button" onClick={() => navigator.clipboard?.writeText(window.location.href)} title="Copy this tool URL"><Copy size={14} aria-hidden="true" /> Copy link</button></footer>
        </section>
      </div>
    </main>
  );
}

function NetworkView({ protocol, packet }) {
  return <div className="protocol-network-view"><div className="protocol-network-stage"><div className="protocol-network-grid" />{protocol.participants.map((participant, index) => <div className={`protocol-node protocol-node--${index}`} key={participant}><span className="protocol-node__icon">{index === 0 ? '↗' : index === protocol.participants.length - 1 ? '◆' : '◌'}</span><strong>{participant}</strong><small>{index === 0 ? 'source' : index === protocol.participants.length - 1 ? 'destination' : 'service'}</small></div>)}<div className="protocol-packet-route"><span className="protocol-route-line" /><span className="protocol-route-arrow">→</span><span className="protocol-route-label">{packet[2]} · {packet[3]}</span></div></div><div className="protocol-network-legend"><span><i className="legend-dot legend-dot--client" /> Client / source</span><span><i className="legend-dot legend-dot--service" /> Service / hop</span><span><i className="legend-dot legend-dot--server" /> Server / destination</span></div></div>;
}

function SequenceView({ protocol, selectedPacket, onSelect }) {
  return <div className="protocol-sequence-view"><div className="protocol-sequence-head">{protocol.participants.map((participant) => <strong key={participant}>{participant}</strong>)}</div><div className="protocol-sequence-body">{protocol.packets.map((packet, index) => { const from = protocol.participants.indexOf(packet[0]); const to = protocol.participants.indexOf(packet[1]); const start = Math.max(4, Math.min(78, ((from < 0 ? 0 : from) / Math.max(1, protocol.participants.length - 1)) * 74 + 4)); const width = Math.max(10, Math.abs((to < 0 ? protocol.participants.length - 1 : to) - (from < 0 ? 0 : from)) / Math.max(1, protocol.participants.length - 1) * 74); return <button type="button" className={`protocol-sequence-event${selectedPacket === index ? ' is-current' : ''}`} style={{ '--event-left': `${start}%`, '--event-width': `${width}%` }} onClick={() => onSelect(index)}><span className="protocol-sequence-line" /><span className="protocol-sequence-arrow">{from <= to ? '→' : '←'}</span><span className="protocol-sequence-label">{packet[2]} · {packet[3]}</span><small>{String(index + 1).padStart(2, '0')}</small></button>; })}</div></div>;
}

export default ProtocolExplorerPage;
