'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Flag,
  ArrowRight,
  Download,
  KeyRound,
  Lightbulb,
  CheckCircle2,
  Play,
  Lock,
  Users,
  Copy,
  Trophy,
  Shield,
  Plus,
  LogOut,
  ArrowUpRight,
  RefreshCw,
  BookOpen,
  Terminal,
  LoaderCircle,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { api } from '@/lib/client';
import { categories } from '@/lib/catalog';
export const ErrorMessage = ({ message }: any) =>
  message ? (
    <p className="error-message" role="alert">
      {message}
    </p>
  ) : null;
export function Picker({ value, onChange, options, label, id }: any) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className="form-select" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((x: string) => (
          <SelectItem key={x} value={x}>
            {x}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
export function Account({ state, refresh }: any) {
  const [mode, setMode] = useState('register'),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function submit(e: any) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api(
        'auth/' + mode,
        Object.fromEntries(new FormData(e.currentTarget)),
      );
      await refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (state.user)
    return (
      <section className="panel account-panel">
        <span className="large-avatar">
          {state.user.name.slice(0, 2).toUpperCase()}
        </span>
        <span className="eyebrow">CHALLENGER PROFILE</span>
        <h2>{state.user.name}</h2>
        <p>{state.user.email}</p>
        <div className="account-stats">
          <span>
            <strong>{state.points}</strong> points earned
          </span>
          <span>
            <strong>{state.solved.length}</strong> flags captured
          </span>
        </div>
        <span className="status-pill">{state.user.role}</span>
        <button
          className="outline-button"
          onClick={async () => {
            try {
              await api('auth/logout', {});
              await refresh();
            } catch (e: any) {
              setError(e.message);
            }
          }}
        >
          <LogOut size={15} /> Sign out
        </button>
        <ErrorMessage message={error} />
      </section>
    );
  return (
    <section className="auth-layout">
      <div className="auth-intro">
        <span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
        <h2>
          Stay curious.
          <br />
          Get your hands dirty.
        </h2>
        <p>
          A good flag is more than an answer. It’s the moment everything clicks.
        </p>
        <div className="auth-benefits">
          <span>
            <CheckCircle2 size={17} /> Keep every solve and every breakthrough
          </span>
          <span>
            <Users size={17} /> Work together with a team of up to five
          </span>
          <span>
            <Trophy size={17} /> Earn your place on the leaderboard
          </span>
        </div>
      </div>
      <form className="panel auth-form" onSubmit={submit}>
        <KeyRound className="green" size={26} />
        <h2>{mode === 'register' ? 'Join the arena' : 'Welcome back'}</h2>
        <p>
          {mode === 'register'
            ? 'Create your challenger profile.'
            : 'Your next challenge is waiting.'}
        </p>
        {mode === 'register' && (
          <label>
            Challenger handle
            <input
              name="name"
              required
              minLength={3}
              maxLength={24}
              pattern="[a-zA-Z0-9_-]+"
              placeholder="e.g. byte_wanderer"
              autoComplete="username"
            />
          </label>
        )}
        <label>
          Email address
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            required
            minLength={12}
            maxLength={128}
            autoComplete={
              mode === 'register' ? 'new-password' : 'current-password'
            }
            placeholder="At least 12 characters"
          />
        </label>
        <ErrorMessage message={error} />
        <button className="primary-button" disabled={busy}>
          {busy ? <LoaderCircle size={16} /> : null}
          {busy
            ? 'Please wait…'
            : mode === 'register'
              ? 'Create account'
              : 'Sign in'}
          <ArrowRight size={16} />
        </button>
        <p className="auth-switch">
          {mode === 'register' ? 'Already a challenger?' : 'New around here?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'register' ? 'login' : 'register');
              setError('');
            }}
          >
            {mode === 'register' ? 'Sign in' : 'Create an account'}
          </button>
        </p>
      </form>
    </section>
  );
}
export function ChallengeBody({ challenge: c, state, refresh, signIn }: any) {
  const [tab, setTab] = useState('brief'),
    [flag, setFlag] = useState(''),
    [error, setError] = useState(''),
    [result, setResult] = useState<any>(null),
    [busy, setBusy] = useState(false),
    [hint, setHint] = useState(''),
    [confirm, setConfirm] = useState(false),
    [instance, setInstance] = useState<any>(null);
  const solved = state.solved.some((x: any) => x.challenge_id === c.id),
    unlocked = state.hints.some((x: any) => x.challenge_id === c.id),
    locked =
      c.prerequisite &&
      !state.solved.some((x: any) => x.challenge_id === c.prerequisite);
  async function action(type: string, body = {}) {
    setBusy(true);
    setError('');
    try {
      const data = await api(`challenges/${c.id}/${type}`, body);
      if (type === 'submit') {
        setResult(data);
        if (data.correct) setFlag('');
      }
      if (type === 'hint') setHint(data.hint);
      if (type === 'instance') setInstance(data);
      await refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="detail-tags">
        {c.tags.map((t: string) => (
          <span key={t}>{t}</span>
        ))}
        {solved && (
          <span className="green">
            <CheckCircle2 size={13} /> Solved
          </span>
        )}
      </div>
      <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
        <TabsList className="detail-tabs">
          <TabsTrigger value="brief">Mission brief</TabsTrigger>
          <TabsTrigger value="hints">
            Hints <Lightbulb size={13} />
          </TabsTrigger>
        </TabsList>
        <TabsContent value="brief">
          <p className="mission-copy">{c.description}</p>
          {locked && (
            <div className="notice">
              <Lock size={17} />
              <span>
                Chained investigation: first solve{' '}
                <strong>
                  {state.challenges.find((x: any) => x.id === c.prerequisite)
                    ?.title || c.prerequisite}
                </strong>
                .
              </span>
            </div>
          )}
          <div className="evidence-panel">
            <div>
              <Download size={20} />
              <div>
                <strong>Investigation files</strong>
                <small>
                  {c.artifact
                    ? 'Source material and evidence · TXT'
                    : 'All evidence is in the mission brief'}
                </small>
              </div>
            </div>
            {c.artifact && (
              <a
                className="outline-button"
                href={'/artifacts/' + c.artifact}
                download
              >
                Download <ArrowUpRight size={14} />
              </a>
            )}
          </div>
          {c.environment && (
            <div className="lab-panel">
              <div>
                <Terminal size={19} />
                <strong>Isolated challenge environment</strong>
              </div>
              <p>
                A private, temporary instance for{' '}
                {state.team ? 'your team' : 'you'}. Expires after 30 minutes.
              </p>
              {!state.runnerAvailable && (
                <div className="notice">
                  The lab runner needs to be connected by the organizer. Source
                  files are available above.
                </div>
              )}
              {instance ? (
                <a
                  href={instance.url}
                  target="_blank"
                  rel="noreferrer"
                  className="primary-button"
                >
                  Open instance <ArrowUpRight size={15} />
                </a>
              ) : (
                <button
                  className="outline-button"
                  disabled={busy || locked || !state.runnerAvailable}
                  onClick={() => (state.user ? action('instance') : signIn())}
                >
                  <Play size={14} /> Launch instance
                </button>
              )}
              {instance && (
                <small>
                  Expires {new Date(instance.expires).toLocaleTimeString()}
                </small>
              )}
            </div>
          )}
        </TabsContent>
        <TabsContent value="hints">
          <div className="hint-panel">
            <Lightbulb size={27} />
            <h3>A nudge in the right direction.</h3>
            <p>
              Unlocking this hint deducts{' '}
              {c.hintCost ?? Math.round(c.points * 0.1)} points from{' '}
              {state.team ? 'your team’s' : 'your'} total. Each hint is charged
              once, even if you reopen it.
            </p>
            {hint ? (
              <blockquote>{hint}</blockquote>
            ) : (
              <button
                className="outline-button"
                disabled={busy || locked || solved}
                onClick={() =>
                  !state.user
                    ? signIn()
                    : unlocked
                      ? action('hint')
                      : setConfirm(true)
                }
              >
                {unlocked
                  ? 'Read unlocked hint'
                  : `Unlock hint · −${c.hintCost ?? Math.round(c.points * 0.1)} pts`}
              </button>
            )}
          </div>
        </TabsContent>
      </Tabs>
      <div className="flag-section">
        <div className="flag-label">
          <Flag size={16} />
          <strong>Capture the flag</strong>
          <span>CTF{'{...}'}</span>
        </div>
        {!state.user ? (
          <button className="primary-button" onClick={signIn}>
            Sign in to submit a flag <ArrowRight size={16} />
          </button>
        ) : solved ? (
          <div className="success-message">
            <CheckCircle2 size={18} /> Flag captured. Your progress is saved.
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void action('submit', { flag });
            }}
            className="flag-form"
          >
            <input
              aria-label="Flag"
              required
              maxLength={256}
              value={flag}
              onChange={(e) => setFlag(e.target.value)}
              placeholder="CTF{your_discovery}"
              autoComplete="off"
              spellCheck={false}
            />
            <button className="primary-button" disabled={busy || locked}>
              {busy ? 'Checking…' : 'Submit flag'}
              <ArrowRight size={15} />
            </button>
          </form>
        )}
        {result && (
          <output
            className={result.correct ? 'success-message' : 'error-message'}
          >
            {result.message}
          </output>
        )}
        <ErrorMessage message={error} />
      </div>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent className="confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Unlock this hint?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deducts{' '}
              {c.hintCost ?? Math.round(c.points * 0.1)} points from your{' '}
              {state.team ? 'team' : 'personal'} score. Team members share the
              unlocked hint.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep investigating</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirm(false);
                void action('hint');
              }}
            >
              Unlock hint
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
export function Leaderboard({ state }: any) {
  const [rows, setRows] = useState<any[]>([]),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    try {
      setRows((await api('leaderboard')).rows);
      setError('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const initial = setTimeout(() => void load(), 0);
    const id = setInterval(() => void load(), 30000);
    return () => {
      clearTimeout(initial);
      clearInterval(id);
    };
  }, [load]);
  return (
    <section>
      <div className="section-heading">
        <div>
          <h2>The ones who connect the dots.</h2>
          <p>Ranked by points. Ties go to the earlier final solve.</p>
        </div>
        <button className="outline-button" onClick={load}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>
      <ErrorMessage message={error} />
      {!rows.length ? (
        <Empty
          icon={Trophy}
          title={
            loading
              ? 'Loading standings…'
              : 'The first place is still yours to take.'
          }
          text="Capture a flag to join the leaderboard. Scores update every 30 seconds."
        />
      ) : (
        <>
          <div className="podium">
            {rows.slice(0, 3).map((r, i) => (
              <div className={'podium-card rank-' + i} key={r.principal}>
                <span className="eyebrow">
                  {['FIRST PLACE', 'SECOND PLACE', 'THIRD PLACE'][i]}
                </span>
                <span className="large-avatar">
                  {r.name.slice(0, 2).toUpperCase()}
                </span>
                <h3>{r.name}</h3>
                <strong>
                  {r.points.toLocaleString()} <small>PTS</small>
                </strong>
                <span>
                  {r.solves} flags captured · {r.type}
                </span>
              </div>
            ))}
          </div>
          <div className="panel table-panel">
            <Table>
              <TableHeader>
                <TableRow>
                  {['Rank', 'Challenger', 'Type', 'Solves', 'Points'].map(
                    (x) => (
                      <TableHead key={x}>{x}</TableHead>
                    ),
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow
                    key={r.principal}
                    className={
                      r.name === (state.team?.name || state.user?.name)
                        ? 'my-row'
                        : ''
                    }
                  >
                    <TableCell>
                      <span className="rank-number">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <strong>{r.name}</strong>
                      {r.name === (state.team?.name || state.user?.name) && (
                        <span className="you-pill">YOU</span>
                      )}
                    </TableCell>
                    <TableCell>{r.type}</TableCell>
                    <TableCell>{r.solves}</TableCell>
                    <TableCell className="score-cell">
                      {r.points.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </section>
  );
}
export function Empty({ icon: Icon, title, text, action }: any) {
  return (
    <div className="panel empty-panel">
      <span className="empty-icon">
        <Icon size={29} />
      </span>
      <h2>{title}</h2>
      <p>{text}</p>
      {action}
    </div>
  );
}
export function Submissions({ state, signIn }: any) {
  const [rows, setRows] = useState<any[]>([]),
    [error, setError] = useState('');
  useEffect(() => {
    if (state.user)
      api('submissions')
        .then((d) => setRows(d.rows))
        .catch((e) => setError(e.message));
  }, [state.user, state.solved.length]);
  if (!state.user)
    return (
      <Empty
        icon={Flag}
        title="Your trail of discoveries."
        text="Sign in to see your submissions and your team’s progress."
        action={
          <button className="primary-button" onClick={signIn}>
            Sign in <ArrowRight size={15} />
          </button>
        }
      />
    );
  return (
    <>
      <div className="section-heading">
        <div>
          <h2>Every attempt is part of the process.</h2>
          <p>
            Your 100 most recent submissions. Submitted flags are never stored.
          </p>
        </div>
      </div>
      <ErrorMessage message={error} />
      {!rows.length ? (
        <Empty
          icon={Flag}
          title="A clean slate."
          text="Your first flag submission will appear here, successful or otherwise."
        />
      ) : (
        <div className="panel table-panel">
          <Table>
            <TableHeader>
              <TableRow>
                {['Challenge', 'Challenger', 'Result', 'Submitted'].map((t) => (
                  <TableHead key={t}>{t}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <strong>{r.title}</strong>
                    <small className="table-small">{r.category}</small>
                  </TableCell>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>
                    <span
                      className={
                        'status-pill ' + (r.correct ? 'correct' : 'incorrect')
                      }
                    >
                      {r.correct ? 'Captured' : 'Incorrect'}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(r.created).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
export function Team({ state, refresh, signIn }: any) {
  const [data, setData] = useState<any>(null),
    [invite, setInvite] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [copied, setCopied] = useState(false);
  useEffect(() => {
    if (state.user)
      api('team')
        .then(setData)
        .catch((e) => setError(e.message));
  }, [state.user, state.team?.id]);
  async function submit(e: any, type: string) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const d = await api(
        'team/' + type,
        Object.fromEntries(new FormData(e.currentTarget)),
      );
      setInvite(d.invite || '');
      await refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (!state.user)
    return (
      <Empty
        icon={Users}
        title="Good problems deserve great company."
        text="Sign in to create a team or join your friends."
        action={
          <button className="primary-button" onClick={signIn}>
            Join the arena <ArrowRight size={15} />
          </button>
        }
      />
    );
  return (
    <>
      <ErrorMessage message={error} />
      {state.team ? (
        <>
          <section className="team-banner">
            <span className="large-avatar">
              <Users size={31} />
            </span>
            <div>
              <span className="eyebrow">YOUR CREW</span>
              <h2>{state.team.name}</h2>
              <p>
                {data?.members.length || 1} / 5 members · {state.points} points
              </p>
            </div>
            <span className="status-pill">
              {data?.team?.owner_id === state.user.id
                ? 'Team captain'
                : 'Team member'}
            </span>
          </section>
          <div className="team-columns">
            <section className="panel">
              <h3>The minds behind the flags</h3>
              {data?.members.map((m: any) => (
                <div className="member-row" key={m.id}>
                  <span className="avatar">
                    {m.name.slice(0, 2).toUpperCase()}
                  </span>
                  <strong>{m.name}</strong>
                  <span>
                    {m.id === data.team.owner_id ? 'Captain' : 'Member'}
                  </span>
                </div>
              ))}
            </section>
            <section className="panel">
              <h3>Bring your people.</h3>
              <p className="body-muted">
                Invite up to four teammates. Everyone shares solves, points, and
                hint penalties.
              </p>
              {invite ? (
                <div className="invite-box">
                  <code>{invite}</code>
                  <button
                    aria-label="Copy invite"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(invite);
                        setCopied(true);
                      } catch {
                        setError('Copy the invite code manually.');
                      }
                    }}
                  >
                    <Copy size={16} />
                    {copied ? 'Copied' : ''}
                  </button>
                </div>
              ) : null}
              {data?.team?.owner_id === state.user.id && (
                <button
                  className="outline-button"
                  onClick={async () => {
                    try {
                      const d = await api('team/rotate-invite', {}, 'PATCH');
                      setInvite(d.invite);
                      setCopied(false);
                    } catch (e: any) {
                      setError(e.message);
                    }
                  }}
                >
                  Generate new invite <ArrowRight size={14} />
                </button>
              )}
              <small className="body-muted">
                Generating an invite invalidates the previous code.
              </small>
            </section>
          </div>
        </>
      ) : (
        <>
          <div className="section-heading">
            <div>
              <h2>Different perspectives. Shared breakthroughs.</h2>
              <p>
                Choose your team before your first solve or hint purchase.
                Membership then stays fixed for fair scoring.
              </p>
            </div>
          </div>
          <div className="team-columns">
            <form
              className="panel form-panel"
              onSubmit={(e) => submit(e, 'create')}
            >
              <Users className="green" size={27} />
              <h2>Start your own crew</h2>
              <p>Build a team of up to five challengers.</p>
              <label>
                Team name
                <input
                  name="name"
                  required
                  minLength={3}
                  maxLength={32}
                  placeholder="e.g. The Null Collective"
                />
              </label>
              <button
                className="primary-button"
                disabled={
                  busy || state.solved.length > 0 || state.hints.length > 0
                }
              >
                Create team <Plus size={15} />
              </button>
            </form>
            <form
              className="panel form-panel"
              onSubmit={(e) => submit(e, 'join')}
            >
              <KeyRound size={27} className="green" />
              <h2>Found your people?</h2>
              <p>Use the invite code shared by your captain.</p>
              <label>
                Invite code
                <input
                  name="invite"
                  required
                  minLength={64}
                  maxLength={64}
                  placeholder="Paste your team’s invite code"
                />
              </label>
              <button
                className="outline-button"
                disabled={
                  busy || state.solved.length > 0 || state.hints.length > 0
                }
              >
                Join team <ArrowRight size={15} />
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
}
export function Guide() {
  return (
    <>
      <div className="guide-banner">
        <BookOpen size={30} />
        <div>
          <span className="eyebrow">THE FIELD GUIDE</span>
          <h2>
            Understand the system.
            <br />
            Then question its assumptions.
          </h2>
        </div>
      </div>
      <div className="guide-grid">
        {[
          [
            '01',
            'Pick an investigation',
            'Choose a discipline and difficulty. Download the evidence or launch a temporary web lab. Read the brief carefully: the required flag format is part of the task.',
          ],
          [
            '02',
            'Follow the evidence',
            'Build a hypothesis, test it, and record what you learn. Clues connect across logs, state, and time. Afterimage unlocks after Packet Whisperer.',
          ],
          [
            '03',
            'Capture what you discovered',
            'Submit CTF{your_answer}. Flags are case-sensitive; surrounding whitespace is ignored. A challenge scores once per solo player or team. Repeated solves do not earn more points.',
          ],
          [
            '04',
            'Use a hint, keep moving',
            'Hints permanently deduct their displayed cost. A team pays only once and shares the hint. Scores can temporarily be negative until you earn solve points.',
          ],
          [
            '05',
            'Choose your crew early',
            'Teams have up to five members. Join before your first correct solve or paid hint. Team membership cannot be changed during this season.',
          ],
          [
            '06',
            'Respect the arena',
            'Only test the provided isolated challenge targets. The platform, runner, other players, and unrelated systems are out of scope. Do not share live flags or attack availability.',
          ],
        ].map(([n, title, text]) => (
          <article className="panel guide-card" key={n}>
            <span>{n}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
      <div className="notice">
        <Shield size={21} />
        <p>
          Tools, including AI, are welcome. The challenge is to explain why your
          solution works. These investigations reward reasoning; they do not
          claim to be impossible for automated agents.
        </p>
      </div>
    </>
  );
}
export function Studio({ state, refresh, signIn }: any) {
  const [rows, setRows] = useState<any[]>([]),
    [audit, setAudit] = useState<any>(null),
    [error, setError] = useState(''),
    [success, setSuccess] = useState(''),
    [creating, setCreating] = useState(false),
    [busy, setBusy] = useState(false),
    [category, setCategory] = useState('Web'),
    [difficulty, setDifficulty] = useState('Medium'),
    [publish, setPublish] = useState('Draft');
  const allowed = ['admin', 'author'].includes(state.user?.role);
  const role = state.user?.role;
  const load = useCallback(async () => {
    if (!allowed) return;
    try {
      setRows((await api('admin/challenges')).rows);
      if (role === 'admin') setAudit(await api('admin/audit'));
    } catch (e: any) {
      setError(e.message);
    }
  }, [allowed, role]);
  useEffect(() => {
    const initial = setTimeout(() => void load(), 0);
    return () => clearTimeout(initial);
  }, [load]);
  async function create(e: any) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const f: any = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await api('admin/challenges', {
        ...f,
        category,
        difficulty,
        points: Number(f.points),
        hintCost: Number(f.hintCost),
        tags: f.tags
          .split(',')
          .map((t: string) => t.trim())
          .filter(Boolean),
        published: publish === 'Published',
      });
      setCreating(false);
      setSuccess('Challenge saved.');
      await load();
      await refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (!state.user)
    return (
      <Empty
        icon={Shield}
        title="Make a challenge worth solving."
        text="Sign in to access the author studio. An organizer must grant author access."
        action={
          <button className="primary-button" onClick={signIn}>
            Sign in <ArrowRight size={15} />
          </button>
        }
      />
    );
  if (!allowed)
    return (
      <section className="panel form-panel bootstrap-panel">
        <Shield className="green" size={30} />
        <h2>Author access required</h2>
        <p>
          Ask your organizer to grant your handle{' '}
          <strong>{state.user.name}</strong> author access. If you own this
          deployment, use the administrator bootstrap token configured on your
          server.
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError('');
            try {
              await api(
                'admin/claim',
                Object.fromEntries(new FormData(e.currentTarget)),
              );
              await refresh();
            } catch (e: any) {
              setError(e.message);
            }
          }}
        >
          <label>
            Administrator bootstrap token
            <input
              name="token"
              type="password"
              required
              minLength={32}
              autoComplete="off"
            />
          </label>
          <button className="outline-button">
            Activate administrator access
          </button>
        </form>
        <ErrorMessage message={error} />
      </section>
    );
  return (
    <>
      <div className="section-heading">
        <div>
          <h2>Build the next breakthrough.</h2>
          <p>Create, publish, and manage evidence-driven challenges.</p>
        </div>
        <button
          className="primary-button"
          onClick={() => setCreating(!creating)}
        >
          <Plus size={15} />
          {creating ? 'Close editor' : 'New challenge'}
        </button>
      </div>
      <ErrorMessage message={error} />
      {success && <output className="success-message">{success}</output>}
      {creating && (
        <form className="panel editor-form" onSubmit={create}>
          <h3>New challenge</h3>
          <div className="form-grid">
            <label>
              Title
              <input name="title" required maxLength={80} />
            </label>
            <label>
              URL slug
              <input
                name="id"
                pattern="[a-z0-9][a-z0-9-]{2,63}"
                required
                placeholder="a-trace-in-time"
              />
            </label>
            <label htmlFor="challenge-category">
              Category
              <Picker
                id="challenge-category"
                label="Category"
                value={category}
                onChange={setCategory}
                options={categories.slice(1)}
              />
            </label>
            <label htmlFor="challenge-difficulty">
              Difficulty
              <Picker
                id="challenge-difficulty"
                label="Difficulty"
                value={difficulty}
                onChange={setDifficulty}
                options={['Easy', 'Medium', 'Hard']}
              />
            </label>
            <label>
              Points
              <input
                name="points"
                type="number"
                min={50}
                max={1000}
                required
                defaultValue={300}
              />
            </label>
            <label>
              Hint penalty
              <input
                name="hintCost"
                type="number"
                min={0}
                max={999}
                required
                defaultValue={30}
              />
            </label>
          </div>
          <label>
            Short description
            <input name="summary" required maxLength={160} />
          </label>
          <label>
            Mission brief and evidence
            <textarea name="description" rows={6} required maxLength={8000} />
          </label>
          <label>
            Expected flag
            <input
              name="flag"
              type="password"
              placeholder="CTF{your_answer}"
              required
              maxLength={245}
              autoComplete="off"
            />
          </label>
          <label>
            Hint
            <textarea name="hint" rows={3} required maxLength={1000} />
          </label>
          <label>
            Tags, separated by commas
            <input name="tags" placeholder="Log analysis, Timeline" />
          </label>
          <label htmlFor="challenge-visibility">
            Visibility
            <Picker
              id="challenge-visibility"
              label="Visibility"
              value={publish}
              onChange={setPublish}
              options={['Draft', 'Published']}
            />
          </label>
          <button className="primary-button" disabled={busy}>
            {busy ? 'Saving…' : 'Save challenge'}
            <ArrowRight size={15} />
          </button>
        </form>
      )}
      <div className="panel table-panel">
        <Table>
          <TableHeader>
            <TableRow>
              {[
                'Challenge',
                'Discipline',
                'Points',
                'Visibility',
                'Action',
              ].map((x) => (
                <TableHead key={x}>{x}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <strong>{c.title}</strong>
                </TableCell>
                <TableCell>{c.category}</TableCell>
                <TableCell>{c.points}</TableCell>
                <TableCell>
                  <span className="status-pill">
                    {c.published ? 'Published' : 'Draft'}
                  </span>
                </TableCell>
                <TableCell>
                  <button
                    className="outline-button"
                    onClick={async () => {
                      try {
                        await api(
                          'admin/publish',
                          { id: c.id, published: !c.published },
                          'PATCH',
                        );
                        await load();
                        await refresh();
                      } catch (e: any) {
                        setError(e.message);
                      }
                    }}
                  >
                    {c.published ? 'Unpublish' : 'Publish'}
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {audit && (
        <>
          <div className="admin-metrics">
            {Object.entries(audit.metrics).map(([k, v]: any) => (
              <div className="panel" key={k}>
                <strong>{v}</strong>
                <span>{k}</span>
              </div>
            ))}
          </div>
          <div className="team-columns">
            <form
              className="panel form-panel"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const f = Object.fromEntries(new FormData(e.currentTarget));
                  await api('admin/role', { ...f, role: 'author' }, 'PATCH');
                  setSuccess('Author access granted.');
                  await load();
                } catch (e: any) {
                  setError(e.message);
                }
              }}
            >
              <h3>Invite another author</h3>
              <label>
                Challenger handle
                <input name="name" required />
              </label>
              <button className="outline-button">Grant author access</button>
            </form>
            <section className="panel">
              <h3>Recent audit events</h3>
              <div className="audit-list">
                {audit.rows.slice(0, 8).map((a: any, i: number) => (
                  <div key={i}>
                    <strong>{a.event}</strong>
                    <small>
                      {a.name || 'System'} ·{' '}
                      {new Date(a.created).toLocaleString()}
                    </small>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </>
  );
}
