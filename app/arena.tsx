'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import type { ArenaState } from '@/lib/contracts';
import { api, errorMessage } from '@/lib/client';
import { useArenaTools } from './webmcp';
import {
  Account,
  ChallengeBody,
  Leaderboard,
  Submissions,
  Team,
  Guide,
  Studio,
  ErrorMessage,
} from './flows';
import {
  Flag,
  LayoutGrid,
  Trophy,
  Users,
  History,
  BookOpen,
  Shield,
  Terminal,
  Globe,
  Fingerprint,
  KeyRound,
  ScanSearch,
  Cpu,
  Box,
  Search,
  ArrowUpRight,
  ChevronRight,
  Radio,
  CheckCircle2,
  SlidersHorizontal,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { catalog, categories, type Challenge } from '@/lib/catalog';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
const routes: Record<string, string> = {
  Challenges: '/',
  Leaderboard: '/leaderboard',
  'My team': '/team',
  Submissions: '/submissions',
  'Field guide': '/guide',
  'Author studio': '/studio',
  Account: '/account',
};

const icons: Record<string, LucideIcon> = {
  Web: Globe,
  Forensics: Fingerprint,
  Cryptography: KeyRound,
  OSINT: ScanSearch,
  'Reverse Engineering': Cpu,
  Misc: Box,
};
function AutoClose({ children }: { children: React.ReactNode }) {
  const { setOpenMobile } = useSidebar();
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const close = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest('button,a')) {
        setOpenMobile(false);
      }
    };
    element.addEventListener('click', close);
    return () => element.removeEventListener('click', close);
  }, [setOpenMobile]);
  return (
    <div ref={root} style={{ display: 'contents' }}>
      {children}
    </div>
  );
}
export default function Arena({
  initialPage = 'Challenges',
  initialChallenge = '',
}: {
  initialPage?: string;
  initialChallenge?: string;
}) {
  const [page, setPage] = useState(initialPage),
    [category, setCategory] = useState('All challenges'),
    [query, setQuery] = useState(''),
    [difficulty, setDifficulty] = useState('All difficulties'),
    [selected, setSelected] = useState<Challenge | null>(
      catalog.find((c) => c.id === initialChallenge) || null,
    );
  const [state, setState] = useState<ArenaState>({
      user: null,
      team: null,
      challenges: catalog,
      solved: [],
      hints: [],
      points: 0,
      runnerAvailable: false,
    }),
    [loadError, setLoadError] = useState(''),
    [loading, setLoading] = useState(true),
    [status, setStatus] = useState('All statuses');
  const refresh = useCallback(async () => {
    try {
      setState(await api<ArenaState>('state'));
      setLoadError('');
    } catch (e) {
      setLoadError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);
  const pendingChallenge = useRef(initialChallenge);
  useArenaTools(refresh);
  useEffect(() => {
    const initial = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(initial);
  }, [refresh]);
  useEffect(() => {
    if (!loading && pendingChallenge.current) {
      const c = state.challenges.find(
        (c: Challenge) => c.id === pendingChallenge.current,
      );
      setSelected(c || null);
      if (!c) setLoadError('That challenge is unavailable or unpublished.');
      pendingChallenge.current = '';
    }
  }, [loading, state.challenges]);
  function navigate(name: string) {
    setPage(name);
    setSelected(null);
    window.history.pushState({}, '', routes[name]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function openChallenge(c: Challenge) {
    setSelected(c);
    window.history.pushState({}, '', '/challenges/' + c.id);
  }
  function closeChallenge() {
    setSelected(null);
    window.history.pushState({}, '', routes[page] || '/');
  }
  useEffect(() => {
    const pop = () => {
      const id = location.pathname.split('/challenges/')[1];
      if (id) {
        setSelected(
          state.challenges.find((c: Challenge) => c.id === id) || null,
        );
        setPage('Challenges');
      } else {
        setSelected(null);
        setPage(
          Object.keys(routes).find((k) => routes[k] === location.pathname) ||
            'Challenges',
        );
      }
    };
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, [state.challenges]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        document
          .querySelector<HTMLInputElement>('[aria-label="Search challenges"]')
          ?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const filtered = state.challenges.filter(
    (c: Challenge) =>
      (category === 'All challenges' || c.category === category) &&
      (difficulty === 'All difficulties' || c.difficulty === difficulty) &&
      (status === 'All statuses' ||
        (status === 'Solved' ? c.solved : !c.solved)) &&
      (c.title + ' ' + c.tags.join(' '))
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const selectedLive =
    selected &&
    (state.challenges.find((c: Challenge) => c.id === selected.id) || selected);

  return (
    <SidebarProvider>
      <Sidebar className="arena-sidebar">
        <AutoClose>
          <SidebarHeader>
            <Link className="brand" href="/">
              <span className="brand-mark">
                <Terminal size={22} />
              </span>
              cipherground<span className="brand-dot">.</span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <div className="event-select">
              <span className="event-symbol">
                <Flag size={18} />
              </span>
              <div>
                Open Arena<small>SEASON 01</small>
              </div>
              <span className="live-dot" />
            </div>
            <div className="nav-label">WORKSPACE</div>
            <nav>
              {(
                [
                  [LayoutGrid, 'Challenges'],
                  [Trophy, 'Leaderboard'],
                  [Users, 'My team'],
                  [History, 'Submissions'],
                ] satisfies [LucideIcon, string][]
              ).map(([I, n]) => (
                <button
                  key={n}
                  className={'nav-item ' + (page === n ? 'active' : '')}
                  onClick={() => navigate(n)}
                >
                  <I size={19} />
                  {n}
                  {n === 'Challenges' && (
                    <span className="nav-count">{state.challenges.length}</span>
                  )}
                </button>
              ))}
            </nav>
            <div className="nav-label second">RESOURCES</div>
            <nav>
              {(
                [
                  [BookOpen, 'Field guide'],
                  [Shield, 'Author studio'],
                ] satisfies [LucideIcon, string][]
              ).map(([I, n]) => (
                <button
                  key={n}
                  className={'nav-item ' + (page === n ? 'active' : '')}
                  onClick={() => navigate(n)}
                >
                  <I size={19} />
                  {n}
                </button>
              ))}
            </nav>
            <div className="sidebar-note">
              <span className="eyebrow">
                <Sparkles size={14} /> BUILT FOR THE CURIOUS
              </span>
              <h3>Think beyond the flag.</h3>
              <p>
                Real evidence. Connected clues. Challenges worth understanding.
              </p>
              <button onClick={() => navigate('Field guide')}>
                Read the field guide <ArrowUpRight size={16} />
              </button>
            </div>
          </SidebarContent>
          <SidebarFooter>
            <button className="profile" onClick={() => navigate('Account')}>
              <span className="avatar">
                {state.user ? state.user.name.slice(0, 2).toUpperCase() : '?'}
              </span>
              <div>
                {state.user?.name || 'Welcome, challenger'}
                <small>
                  {state.user
                    ? `${state.points} points · ${state.team?.name || 'Solo challenger'}`
                    : 'Sign in to track your progress'}
                </small>
              </div>
              <ChevronRight size={16} />
            </button>
          </SidebarFooter>
        </AutoClose>
      </Sidebar>
      <main className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <SidebarTrigger />
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>{page}</strong>
          </div>
          <div className="topbar-right">
            <span className="system-status">
              <span className="live-dot" />{' '}
              {loading
                ? 'Connecting…'
                : loadError
                  ? 'Connection interrupted'
                  : 'Systems operational'}
            </span>
            <button
              className="outline-button"
              onClick={() => navigate('Account')}
            >
              {state.user ? state.user.name : 'Join the arena'}{' '}
              <ArrowUpRight size={14} />
            </button>
          </div>
        </header>
        <div className="page-content">
          {loadError && (
            <div className="connection-error">
              <ErrorMessage message={loadError} />
              <button className="outline-button" onClick={refresh}>
                Retry connection
              </button>
            </div>
          )}
          <div className="page-heading">
            <div>
              <div className="eyebrow">THE PROVING GROUND</div>
              <h1>
                {page === 'Challenges' ? 'Find your next breakthrough.' : page}
              </h1>
              <p>
                Follow the evidence. Exploit the unexpected. Capture the flag.
              </p>
            </div>
            <div className="season-badge">
              <Radio size={15} /> OPEN ARENA <span>SEASON 01</span>
            </div>
          </div>
          <section className="stats-strip">
            {(
              [
                [
                  Flag,
                  String(state.challenges.length),
                  'Challenges available',
                  'Across 6 disciplines',
                ],
                [
                  CheckCircle2,
                  `${state.solved.length} / ${state.challenges.length}`,
                  'Your progress',
                  state.solved.length
                    ? 'Keep the discoveries coming'
                    : 'Every solve starts somewhere',
                ],
                [
                  Trophy,
                  state.points.toLocaleString(),
                  'Your total points',
                  state.solved.length
                    ? 'Earned through discovery'
                    : 'Make your first move',
                ],
                [
                  Users,
                  state.team ? 'Team' : 'Solo',
                  'Your team',
                  state.team?.name || 'Better minds, together',
                ],
              ] satisfies [LucideIcon, string | number, string, string][]
            ).map(([I, v, l, n]) => (
              <div className="stat" key={l}>
                <span className="stat-icon">
                  <I size={18} />
                </span>
                <div>
                  <span className="stat-label">{l}</span>
                  <strong>{v}</strong>
                  <small>{n}</small>
                </div>
              </div>
            ))}
          </section>
          {page === 'Challenges' ? (
            <>
              <section className="feature-banner">
                <div className="feature-copy">
                  <span className="eyebrow">
                    <span className="live-dot" /> IN THE SPOTLIGHT
                  </span>
                  <h2>
                    A ghost in the machine.
                    <br />A flaw in the cache.
                  </h2>
                  <p>
                    Trace a request through layers of misplaced trust.
                    <br />
                    The next response might not be yours.
                  </p>
                  <button
                    className="primary-button"
                    onClick={() =>
                      openChallenge(
                        state.challenges.find(
                          (c: Challenge) => c.id === catalog[0].id,
                        ) || catalog[0],
                      )
                    }
                  >
                    Investigate the challenge <ArrowRight size={16} />
                  </button>
                </div>
                <div className="terminal-art">
                  <div className="terminal-top">
                    <span />
                    <span />
                    <span />
                    <small>northstar / gateway.log</small>
                  </div>
                  <div className="terminal-body">
                    <p>
                      <span className="muted">$</span> curl -I
                      gateway.local/invoice
                    </p>
                    <p className="terminal-dim">HTTP/1.1 200 OK</p>
                    <p className="terminal-dim">
                      X-Cache: <span className="green">HIT</span>
                    </p>
                    <p className="terminal-dim">X-Request-ID: 0x7f3a</p>
                    <p className="terminal-comment">
                      {'// same key. different door.'}
                    </p>
                    <p className="green">
                      &gt; follow the request
                      <span className="cursor-block" />
                    </p>
                  </div>
                  <span className="terminal-caption">
                    WEB EXPLOITATION <span>350 PTS</span>
                  </span>
                </div>
                <span className="feature-index">01 / 12</span>
              </section>
              <div className="challenge-heading">
                <h2>
                  Challenge library <span>{state.challenges.length}</span>
                </h2>
                <span className="muted">
                  Choose a problem. Leave with a new perspective.
                </span>
              </div>
              <div className="category-tabs">
                {categories.map((c) => {
                  const I = icons[c] || LayoutGrid;
                  return (
                    <button
                      key={c}
                      className={category === c ? 'selected' : ''}
                      onClick={() => setCategory(c)}
                    >
                      <I size={15} />
                      {c === 'Reverse Engineering' ? 'Reversing' : c}
                      <span>
                        {c === 'All challenges'
                          ? state.challenges.length
                          : state.challenges.filter(
                              (x: Challenge) => x.category === c,
                            ).length}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="filters">
                <div className="search-box">
                  <Search size={17} />
                  <input
                    aria-label="Search challenges"
                    placeholder="Search challenges, tags, or techniques..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <kbd>/</kbd>
                </div>
                <Select
                  value={difficulty}
                  onValueChange={(v) => setDifficulty(v || 'All difficulties')}
                >
                  <SelectTrigger
                    className="filter-select"
                    aria-label="Difficulty"
                  >
                    <SlidersHorizontal size={15} />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['All difficulties', 'Easy', 'Medium', 'Hard'].map((x) => (
                      <SelectItem value={x} key={x}>
                        {x}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v || 'All statuses')}
                >
                  <SelectTrigger
                    className="filter-select"
                    aria-label="Solve status"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['All statuses', 'Unsolved', 'Solved'].map((x) => (
                      <SelectItem value={x} key={x}>
                        {x}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="results-count">
                  {filtered.length} challenges
                </span>
              </div>
              {!filtered.length && (
                <div className="panel no-results">
                  <Search size={24} />
                  <h3>No challenges match these filters.</h3>
                  <button
                    className="outline-button"
                    onClick={() => {
                      setCategory('All challenges');
                      setDifficulty('All difficulties');
                      setStatus('All statuses');
                      setQuery('');
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              )}
              <div className="challenge-grid">
                {filtered.map((c: Challenge) => {
                  const I = icons[c.category] || Box;
                  return (
                    <button
                      key={c.id}
                      className={
                        'challenge-card cat-' +
                        c.category.split(' ')[0].toLowerCase()
                      }
                      onClick={() => openChallenge(c)}
                    >
                      <div className="card-top">
                        <span className="category-icon">
                          <I size={22} />
                        </span>
                        <span
                          className={'difficulty ' + c.difficulty.toLowerCase()}
                        >
                          <i />
                          {c.difficulty}
                        </span>
                      </div>
                      <div className="card-category">{c.category}</div>
                      <h3>
                        {c.title}
                        <ArrowUpRight size={16} />
                      </h3>
                      <p>{c.summary}</p>
                      <div className="tags">
                        {c.tags.map((t) => (
                          <span key={t}>{t}</span>
                        ))}
                      </div>
                      <div className="card-bottom">
                        <strong>
                          {c.points}
                          <small>PTS</small>
                        </strong>
                        <span>
                          <Flag size={13} /> {c.solves || 0} solves
                        </span>
                        <span className={c.solved ? 'solved' : 'unsolved'}>
                          {c.solved ? (
                            <>
                              <CheckCircle2 size={12} /> Solved
                            </>
                          ) : (
                            'Unsolved'
                          )}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              {page === 'Account' && (
                <Account state={state} refresh={refresh} />
              )}{' '}
              {page === 'Leaderboard' && <Leaderboard state={state} />}{' '}
              {page === 'My team' && (
                <Team
                  state={state}
                  refresh={refresh}
                  signIn={() => navigate('Account')}
                />
              )}{' '}
              {page === 'Submissions' && (
                <Submissions state={state} signIn={() => navigate('Account')} />
              )}{' '}
              {page === 'Field guide' && <Guide />}{' '}
              {page === 'Author studio' && (
                <Studio
                  state={state}
                  refresh={refresh}
                  signIn={() => navigate('Account')}
                />
              )}
            </>
          )}
          <footer className="footer">
            <span>
              <Terminal size={14} /> Built for curiosity. Designed for
              discovery.
            </span>
            <span>CIPHERGROUND / SEASON 01</span>
          </footer>
        </div>
      </main>
      <Dialog open={!!selected} onOpenChange={(o) => !o && closeChallenge()}>
        <DialogContent className="challenge-dialog">
          <DialogTitle>{selected?.title}</DialogTitle>
          <DialogDescription>
            {selected?.category} · {selected?.difficulty} · {selected?.points}{' '}
            points
          </DialogDescription>
          {selectedLive && (
            <ChallengeBody
              key={selectedLive.id}
              challenge={selectedLive}
              state={state}
              refresh={refresh}
              signIn={() => navigate('Account')}
            />
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
