'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  ExternalLink,
  Eye,
  FileSearch,
  KeyRound,
  Radio,
  Search,
  Terminal,
  Video,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, errorMessage } from '@/lib/client';
import { challengeVisual } from '@/lib/catalog';
import type { ArenaState } from '@/lib/contracts';

type SignalBridge = {
  help: () => string;
  probe: (node: string) => string;
  unlock: (phrase: string) => string;
};

const art = (id: string) => ({
  ...challengeVisual(id),
  backgroundImage:
    "linear-gradient(90deg,rgba(7,10,14,.12),rgba(7,10,14,.42)),url('/artwork/challenge-sprite.jpg')",
});

function LabShell({
  id,
  kicker,
  title,
  subtitle,
  children,
}: {
  id: string;
  kicker: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className={`web-lab web-lab-${id}`}>
      <nav className="web-lab-nav">
        <Link href="/" className="web-lab-back">
          <ArrowLeft size={15} /> Cipherground arena
        </Link>
        <span>LIVE INVESTIGATION / {kicker}</span>
      </nav>
      <header className="web-lab-hero" style={art(id)}>
        <div>
          <span className="web-lab-kicker">{kicker}</span>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </header>
      {children}
      <footer className="web-lab-footer">
        <span>CIPHERGROUND FIELD SYSTEM</span>
        <Link href="/">Return to challenge submission</Link>
      </footer>
    </main>
  );
}

function RedConsole() {
  const [token, setToken] = useState('');
  const [signedIn, setSignedIn] = useState(false);
  const [status, setStatus] = useState('Bridge dormant');

  useEffect(() => {
    let active = true;
    void api<ArenaState>('state')
      .then((state) => {
        if (!active) return;
        const challenge = state.challenges.find(
          (item) => item.id === 'red-console-protocol',
        );
        setToken(challenge?.personalToken || '');
        setSignedIn(!!state.user);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const responses: Record<string, string> = {
      rabbit: 'rabbit → phase=red',
      mirror: 'mirror → frequency=101',
      phone: 'phone → action=wake',
    };
    const bridge: SignalBridge = {
      help() {
        const message =
          "Probe the visible node names with signalConsole.probe('name'), then combine their values with hyphens.";
        console.info(message);
        return message;
      },
      probe(node) {
        const message =
          responses[String(node).toLowerCase()] ||
          'Unknown node. Inspect the signal cards in the Elements panel.';
        console.info(message);
        return message;
      },
      unlock(phrase) {
        if (String(phrase).toLowerCase() !== 'red-101-wake') {
          console.warn('Protocol rejected. Order the three probed values.');
          return 'Protocol rejected';
        }
        if (!signedIn || !token) {
          console.warn(
            'Protocol solved. Sign in through the arena for a personal token.',
          );
          setStatus('Solved — sign in through the arena to bind your flag');
          return 'Solved, but a signed-in session is required';
        }
        const flag = `CTF{WAKE_THE_RED_SIGNAL:${token}}`;
        console.log(
          '%c' + flag,
          'color:#ff6b71;font-size:18px;font-weight:bold',
        );
        setStatus('Protocol awake — flag printed in console');
        return flag;
      },
    };
    (window as typeof window & { signalConsole?: SignalBridge }).signalConsole =
      bridge;
    console.info(
      '%cRED SIGNAL BRIDGE ONLINE',
      'color:#ff5c64;font-weight:bold;letter-spacing:2px',
    );
    console.info('Start with window.signalConsole.help()');
    return () => {
      delete (window as typeof window & { signalConsole?: SignalBridge })
        .signalConsole;
    };
  }, [signedIn, token]);

  return (
    <LabShell
      id="red-console-protocol"
      kicker="signal station 101"
      title="The Red Console Protocol"
      subtitle="Three unstable nodes are broadcasting through the page. The interface was disabled, but its diagnostic bridge is still exposed to the browser."
    >
      <section className="web-lab-grid signal-grid">
        <article className="web-lab-card lab-wide">
          <span className="web-lab-label">OPERATOR BRIEF</span>
          <h2>The controls are gone. The evidence is not.</h2>
          <p>
            Open your browser Developer Tools, inspect the three signal nodes,
            and use the Console. A global diagnostic object announces itself
            when this page loads. Its help method explains the first command.
          </p>
          <div className="console-command">
            <Terminal size={17} /> window.signalConsole.help()
          </div>
        </article>
        <article
          className="signal-node"
          data-node="rabbit"
          data-phase="red"
          data-order="1"
        >
          <Radio size={23} />
          <span>NODE / RABBIT</span>
          <strong>Chromatic drift detected</strong>
          <small>Inspect this element, then probe its node name.</small>
        </article>
        <article
          className="signal-node"
          data-node="mirror"
          data-frequency="101"
          data-order="2"
        >
          <Eye size={23} />
          <span>NODE / MIRROR</span>
          <strong>Carrier frequency unstable</strong>
          <small>Reflection obscures the value shown to operators.</small>
        </article>
        <article
          className="signal-node"
          data-node="phone"
          data-action="wake"
          data-order="3"
        >
          <KeyRound size={23} />
          <span>NODE / PHONE</span>
          <strong>Final verb awaiting input</strong>
          <small>The bridge accepts one hyphenated phrase.</small>
        </article>
        <article className="web-lab-card lab-wide protocol-status">
          <span className={status.includes('awake') ? 'status-live' : ''} />
          <div>
            <small>PROTOCOL STATUS</small>
            <strong>{status}</strong>
          </div>
          {!signedIn && (
            <Link href="/account">Sign in for a personal flag</Link>
          )}
        </article>
      </section>
    </LabShell>
  );
}

const screeningTabs = [
  'incident',
  'rentals',
  'security',
  'maintenance',
  'terminal',
];

function LastScreening() {
  const [tab, setTab] = useState('incident');
  const [code, setCode] = useState('');
  const [terminal, setTerminal] = useState('ACCESS CODE REQUIRED');

  async function verify() {
    try {
      const data = await api<{ flag: string }>('labs/last-screening/verify', {
        code,
      });
      setTerminal(data.flag);
    } catch (cause) {
      setTerminal(errorMessage(cause).toUpperCase());
    }
  }

  return (
    <LabShell
      id="last-screening"
      kicker="midnight video archive"
      title="The Last Screening"
      subtitle="At 23:30 the shutters came down. At 23:47 the alarm found an impossible rental still moving through the building."
    >
      <section className="screening-layout">
        <aside className="screening-nav" aria-label="Case sections">
          <span>CASE FILE 88-M</span>
          {screeningTabs.map((item, index) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={tab === item ? 'active' : ''}
            >
              <small>0{index + 1}</small> {item}
            </button>
          ))}
        </aside>
        <div className="screening-content">
          {tab === 'incident' && (
            <article className="case-sheet">
              <span className="web-lab-label">INCIDENT / 23:47 LOCAL</span>
              <h2>Someone reopened the return chute.</h2>
              <p>
                The night clerk counted every cassette at 23:30. Seventeen
                minutes later, an interior alarm registered movement beside the
                return belt. The paper incident form says the relevant checkout
                happened at <strong>23:10 corrected time</strong> and belonged
                to the only customer code written in Greek letters.
              </p>
              <blockquote>
                “Do not trust the time burned into the security frames. Mira
                never reset that recorder after the outage.”
              </blockquote>
              <div className="case-callout">
                Required code format: TAPE-CUSTOMER-AISLE
              </div>
            </article>
          )}
          {tab === 'rentals' && (
            <article className="case-sheet">
              <span className="web-lab-label">
                CHECKOUT LEDGER / CARBON COPY
              </span>
              <h2>Late rentals</h2>
              <div className="ledger-table">
                <div>
                  <b>TIME</b>
                  <b>TAPE</b>
                  <b>CUSTOMER</b>
                  <b>STATUS</b>
                </div>
                <div>
                  <span>22:58</span>
                  <span>0311</span>
                  <span>ORION</span>
                  <span>returned</span>
                </div>
                <div>
                  <span>23:04</span>
                  <span>0592</span>
                  <span>DELTA</span>
                  <span>damaged</span>
                </div>
                <div>
                  <span>23:10</span>
                  <span>0419</span>
                  <span>BETA</span>
                  <span>open</span>
                </div>
                <div>
                  <span>23:16</span>
                  <span>0770</span>
                  <span>LYRA</span>
                  <span>returned</span>
                </div>
              </div>
              <p className="case-note">
                Pencil note: “The open row was entered from the camera clock,
                not corrected time.” Determine whether the row still matches.
              </p>
            </article>
          )}
          {tab === 'security' && (
            <article className="case-sheet">
              <span className="web-lab-label">SECURITY CONTACT SHEET</span>
              <h2>Frame 22:53:04</h2>
              <div className="security-frame">
                <Video size={44} />
                <span>CAM 02 · RETURN BELT · 22:53:04</span>
                <p>Subject carries cassette 0419. Jacket patch reads Β.</p>
              </div>
              <p>
                Only one frame shows the cassette entering the building. The
                recorder timestamp must be corrected using the maintenance log.
              </p>
            </article>
          )}
          {tab === 'maintenance' && (
            <article className="case-sheet">
              <span className="web-lab-label">MAINTENANCE / SEPT 14</span>
              <h2>Recorder drift and inventory gaps</h2>
              <div className="maintenance-list">
                <p>
                  <Clock3 /> CAM 02 clock remains{' '}
                  <strong>17 minutes slow</strong>.
                </p>
                <p>
                  <FileSearch /> Unlabeled overnight returns move to{' '}
                  <strong>aisle 23</strong>.
                </p>
                <p>
                  <Search /> Aisles 08 and 31 were sealed before closing.
                </p>
              </div>
              <a
                href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                target="_blank"
                rel="noreferrer"
                className="training-link"
              >
                Mandatory staff training tape <ExternalLink size={14} />
              </a>
              <small className="decoy-warning">
                Optional external media. It is not required to solve the case.
              </small>
            </article>
          )}
          {tab === 'terminal' && (
            <article className="case-sheet screening-terminal">
              <span className="web-lab-label">NIGHT DROP TERMINAL</span>
              <h2>Reconstruct the access code.</h2>
              <p>Use the tape number, customer code, and aisle suffix.</p>
              <label>
                TAPE-CUSTOMER-AISLE
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="0000-CODE-00"
                  maxLength={20}
                />
              </label>
              <button onClick={() => void verify()}>
                Verify record <ArrowRight size={15} />
              </button>
              <output>{terminal}</output>
            </article>
          )}
        </div>
      </section>
    </LabShell>
  );
}

type Dispatch = {
  case: string;
  telegram: string;
  archive: string;
  instruction: string;
  responseHeader?: string;
};

function BakerStreet() {
  const [dispatch, setDispatch] = useState<Dispatch | null>(null);
  const [ledger, setLedger] = useState<unknown>(null);
  const [caseId, setCaseId] = useState('');
  const [year, setYear] = useState('');
  const [order, setOrder] = useState('');
  const [result, setResult] = useState('No request sent.');
  const [error, setError] = useState('');

  async function loadDispatch() {
    setError('');
    try {
      const response = await fetch('/api/labs/baker-street/dispatch');
      const data = (await response.json()) as Dispatch;
      data.responseHeader =
        response.headers.get('x-dispatch-year') || '(missing)';
      setDispatch(data);
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }

  async function loadLedger() {
    setError('');
    try {
      const response = await fetch(
        `/api/labs/baker-street/ledger?case=${encodeURIComponent(caseId)}`,
      );
      const data = (await response.json()) as Record<string, unknown>;
      if (!response.ok)
        throw new Error(
          typeof data.error === 'string' ? data.error : 'Ledger rejected',
        );
      setLedger({
        ...data,
        responseHeader: response.headers.get('x-required-headers'),
      });
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }

  async function openVault() {
    setError('');
    try {
      const response = await fetch(
        `/api/labs/baker-street/vault?year=${encodeURIComponent(year)}`,
        {
          headers: {
            'X-Case-Id': caseId,
            'X-Evidence-Order': order,
          },
        },
      );
      const data = (await response.json()) as { flag?: string; error?: string };
      if (!response.ok) throw new Error(data.error || 'Vault rejected');
      setResult(data.flag || 'Empty vault');
    } catch (cause) {
      setError(errorMessage(cause));
      setResult('REQUEST REJECTED');
    }
  }

  return (
    <LabShell
      id="baker-street-packet"
      kicker="case violet / packet office"
      title="The Baker Street Packet"
      subtitle="The sealed dispatch is authentic. The address on its envelope is a decoy. Follow what the server actually sends."
    >
      <section className="baker-grid">
        <article className="web-lab-card baker-brief">
          <span className="web-lab-label">CASE INSTRUCTIONS</span>
          <h2>Three requests. One complete chain of custody.</h2>
          <ol>
            <li>
              Request the dispatch and inspect both its JSON and response
              headers.
            </li>
            <li>
              Decode the telegram. Open the named ledger with the correct case
              query.
            </li>
            <li>
              Rebuild the vault request with its year and two custom headers.
            </li>
          </ol>
          <p>
            You may use these controls, the Network panel, cURL, or browser
            <code> fetch()</code>. The final API accepts only evidence in the
            order authenticated by the dispatch.
          </p>
        </article>
        <article className="request-card">
          <span>REQUEST 01</span>
          <code>GET /api/labs/baker-street/dispatch</code>
          <button onClick={loadDispatch}>Send dispatch request</button>
          <pre>
            {dispatch ? JSON.stringify(dispatch, null, 2) : 'Awaiting request…'}
          </pre>
        </article>
        <article className="request-card">
          <span>REQUEST 02</span>
          <code>GET /api/labs/baker-street/ledger?case=…</code>
          <label>
            Case query
            <input
              value={caseId}
              onChange={(event) => setCaseId(event.target.value)}
            />
          </label>
          <button onClick={loadLedger}>Open evidence ledger</button>
          <pre>
            {ledger ? JSON.stringify(ledger, null, 2) : 'Ledger locked…'}
          </pre>
        </article>
        <article className="request-card request-final">
          <span>REQUEST 03 / VAULT</span>
          <code>GET /api/labs/baker-street/vault?year=…</code>
          <div className="request-fields">
            <label>
              year query
              <input
                value={year}
                onChange={(event) => setYear(event.target.value)}
              />
            </label>
            <label>
              X-Case-Id
              <input
                value={caseId}
                onChange={(event) => setCaseId(event.target.value)}
              />
            </label>
            <label>
              X-Evidence-Order
              <input
                value={order}
                onChange={(event) => setOrder(event.target.value)}
                placeholder="ITEM,ITEM,ITEM"
              />
            </label>
          </div>
          <button onClick={openVault}>Transmit reconstructed request</button>
          <output>{result}</output>
          {error && <p className="lab-error">{error}</p>}
        </article>
      </section>
    </LabShell>
  );
}

export default function LabExperience({ slug }: { slug: string }) {
  if (slug === 'red-console') return <RedConsole />;
  if (slug === 'last-screening') return <LastScreening />;
  if (slug === 'baker-street-packet') return <BakerStreet />;
  return (
    <main className="web-lab lab-missing">
      <h1>Investigation not found</h1>
      <Link href="/">Return to Cipherground</Link>
    </main>
  );
}
