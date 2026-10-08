import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider, SignIn, SignUp, useAuth, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { ArrowRight, BookOpen, Check, ChevronRight, CircleAlert, CircleGauge, Clock3, History, Layers3, LockKeyhole, LogIn, LogOut, Network, Radar, ShieldCheck, Target, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useGetAdminAccess, useGetCurrentUser, useHealthCheck, useListTopics, useGetDashboardSummary, getGetCurrentUserQueryKey, getGetAdminAccessQueryKey } from '@workspace/api-client-react';
import type { CurrentUser, TopicSummary } from '@workspace/api-client-react';
import { Link, Redirect, Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { AdminTopicManager } from '@/components/admin-topics';
import { AdminQuestionManager } from '@/components/admin-questions';
import { PracticeWorkspace } from '@/components/practice-workspace';
import { PracticeHistoryPage } from '@/pages/practice-history';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
// publishableKeyFromHost() fabricates a "clerk.<host>" key when no key is given,
// which would hide a missing configuration. Only use it when a key is set.
const configuredClerkKey: string | undefined = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.trim() || undefined;
const clerkPubKey = configuredClerkKey
  ? publishableKeyFromHost(window.location.hostname, configuredClerkKey)
  : undefined;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

// No bypass: without a publishable key the app shows a configuration screen
// instead of crashing or rendering unauthenticated "fake" access.
function MissingClerkConfig() {
  return (
    <main role="alert" style={{ maxWidth: 560, margin: '15vh auto', padding: 24, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Authentication is not configured</h1>
      <p style={{ marginBottom: 12 }}>
        This app uses Clerk for sign-in. Set <code>VITE_CLERK_PUBLISHABLE_KEY</code> for the web app, and
        <code> CLERK_PUBLISHABLE_KEY</code> and <code>CLERK_SECRET_KEY</code> for the API server, then restart.
      </p>
      <p>See <code>docs/development/clerk-setup.md</code>.</p>
    </main>
  );
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#ef744c',
    colorForeground: '#1b2638',
    colorMutedForeground: '#45546a',
    colorDanger: '#b84d35',
    colorBackground: '#fbfaf6',
    colorInput: '#ffffff',
    colorInputForeground: '#1b2638',
    colorNeutral: '#ded8cb',
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    borderRadius: '0.5rem',
  },
};

const navItems = [
  { href: '/', label: 'Overview', icon: CircleGauge, exact: true },
  { href: '/topics', label: 'Topic map', icon: Layers3 },
  { href: '/practice', label: 'Practice', icon: Target, exact: true },
  { href: '/practice/history', label: 'Practice History', icon: History },
  { href: '/admin', label: 'Admin access', icon: ShieldCheck },
];

function isActivePath(location: string, href: string, exact?: boolean) {
  return exact ? location === href : location.startsWith(href);
}

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <Network />
    </span>
  );
}

function AuthPanel() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const currentUserQuery = useGetCurrentUser({
    query: {
      queryKey: getGetCurrentUserQueryKey(),
      enabled: isLoaded && Boolean(isSignedIn),
      retry: false,
    },
  });

  if (!isLoaded) {
    return <div className="auth-panel auth-panel-muted">Checking identity…</div>;
  }

  if (!isSignedIn) {
    return (
      <div className="auth-panel">
        <div className="auth-panel-label">Learning workspace</div>
        <p className="auth-panel-copy">Sign in to keep your study identity connected.</p>
        <Link href="/sign-in" className="auth-panel-action" data-testid="link-sign-in">
          <LogIn size={14} /> Sign in
        </Link>
      </div>
    );
  }

  const currentUser = currentUserQuery.data?.user;
  const displayName =
    currentUser?.displayName ||
    user?.fullName ||
    user?.primaryEmailAddress?.emailAddress ||
    'Signed-in learner';

  return (
    <div className="auth-panel" data-testid="panel-auth-state">
      <div className="auth-panel-label">Signed in</div>
      <div className="auth-panel-user">
        <span className="auth-avatar"><UserRound size={14} /></span>
        <span className="auth-panel-name">{displayName}</span>
      </div>
      <div className="auth-panel-role">{currentUser?.role ?? 'Loading role'}</div>
      <button
        type="button"
        className="auth-panel-action auth-panel-button"
        onClick={() => void signOut({ redirectUrl: `${basePath || ''}/` })}
        data-testid="button-sign-out"
      >
        <LogOut size={14} /> Sign out
      </button>
    </div>
  );
}

function SharedShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const health = useHealthCheck();
  const isHealthy = health.data?.status?.toLowerCase() === 'ok' || health.data?.status?.toLowerCase() === 'healthy';

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <Link href="/" className="brand" data-testid="link-brand-home">
          <BrandMark />
          <span>
            <span className="brand-name">CCNA / foundation</span>
            <span className="brand-sub">signal desk · v0.2</span>
          </span>
        </Link>
        <div className="side-kicker">Learning workspace</div>
        <nav>
          <ul className="nav-list">
            {navItems.map(({ href, label, icon: Icon, exact }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`nav-link ${isActivePath(location, href, exact) ? 'active' : ''}`}
                  data-testid={`link-nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Icon className="nav-icon" />
                  <span>{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <AuthPanel />
        <div className="side-foot">
          <div className="health-panel" data-testid="panel-health-status">
            <div className="health-label"><span>API link</span><span>live</span></div>
            <div className="health-state">
              <span className={`health-dot ${health.isError ? 'down' : ''}`} />
              <span data-testid="status-health">{health.isLoading ? 'Checking service' : isHealthy ? 'Service operational' : 'Awaiting status'}</span>
            </div>
          </div>
          <p className="side-note">A quiet place to close the gaps between now and exam day.</p>
        </div>
      </aside>
      <header className="mobile-top">
        <Link href="/" className="mobile-brand" data-testid="link-mobile-brand">
          <BrandMark />
          <span>CCNA / foundation</span>
        </Link>
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {navItems.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              className={isActivePath(location, href, exact) ? 'active' : ''}
              aria-label={label}
              data-testid={`link-mobile-${label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <Icon />
            </Link>
          ))}
        </nav>
      </header>
      <main className="main-area">{children}</main>
    </div>
  );
}

function PageHeader({ eyebrow, title, lead, action }: { eyebrow: string; title: string; lead: string; action?: ReactNode }) {
  return (
    <header className="page-head reveal">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="page-heading">{title}</h1>
        <p className="page-lead">{lead}</p>
      </div>
      {action}
    </header>
  );
}

function LoadingTopics() {
  return (
    <div className="loading-grid" aria-label="Loading topics" data-testid="loading-topics">
      {[1, 2, 3].map((item) => (
        <div className="loading-card" key={item}>
          <div className="skeleton" style={{ height: 11, width: '24%' }} />
          <div className="skeleton" style={{ height: 18, width: '74%', marginTop: 25 }} />
          <div className="skeleton" style={{ height: 29, width: '100%', marginTop: 13 }} />
          <div className="skeleton" style={{ height: 6, width: '100%', marginTop: 19 }} />
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message, onRetry, testId }: { message: string; onRetry: () => void; testId: string }) {
  return (
    <div className="error-card" data-testid={testId}>
      <CircleAlert size={26} color="var(--signal)" aria-hidden="true" />
      <h2 className="error-title">The signal dropped</h2>
      <p className="error-copy">{message}</p>
      <button className="button-quiet" onClick={onRetry} data-testid="button-retry">
        <Radar size={15} /> Retry connection
      </button>
    </div>
  );
}

function EmptyState({ title, copy, href, action }: { title: string; copy: string; href?: string; action?: string }) {
  return (
    <div className="empty-card" data-testid="empty-state">
      <Target size={26} color="var(--teal)" aria-hidden="true" />
      <h2 className="empty-title">{title}</h2>
      <p className="empty-copy">{copy}</p>
      {href && action ? <Link href={href} className="button-quiet" data-testid="link-empty-action">{action}<ArrowRight size={15} /></Link> : null}
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, value || 0));
  return (
    <div className="progress-track" aria-label={`${Math.round(safeValue)} percent complete`} data-testid="progress-track">
      <div className="progress-value" style={{ width: `${safeValue}%` }} />
    </div>
  );
}

function TopicCard({ topic, index }: { topic: TopicSummary; index: number }) {
  return (
    <article id={topic.slug} className="topic-card" data-testid={`card-topic-${topic.id}`}>
      <div className="topic-top">
        <span className="topic-index">{String(index + 1).padStart(2, '0')} / 10</span>
        <span className="topic-accuracy">{topic.attemptedCount > 0 ? `${Math.round(topic.accuracy)}% accuracy` : 'Not started'}</span>
      </div>
      <h3 className="topic-name">{topic.name}</h3>
      <p className="topic-description">{topic.description}</p>
      <Link href={`/practice?topicId=${encodeURIComponent(topic.id)}`} className="topic-practice-link" data-testid={`link-practice-topic-${topic.id}`}>
        Start practice <ArrowRight size={13} />
      </Link>
      <div className="topic-bottom">
        <div className="topic-stats">
          <span><span className="topic-stat-strong">{topic.attemptedCount}</span> / {topic.questionCount} attempted</span>
          <span>{Math.round(topic.progressPercent)}%</span>
        </div>
        <ProgressBar value={topic.progressPercent} />
      </div>
    </article>
  );
}

function Metric({ label, value, detail, icon: Icon }: { label: string; value: string | number; detail: string; icon: LucideIcon }) {
  return (
    <div className="quick-row" data-testid={`metric-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <span className="quick-label"><Icon size={13} style={{ verticalAlign: '-2px', marginRight: 7 }} />{label}</span>
      <span className="quick-value">{value} <small style={{ color: 'var(--ink-soft)', font: '10px var(--app-font-sans)' }}>{detail}</small></span>
    </div>
  );
}

function Dashboard() {
  const summaryQuery = useGetDashboardSummary();
  const topicsQuery = useListTopics();
  const summary = summaryQuery.data;
  const topics = topicsQuery.data ?? [];
  const focus = summary?.focusTopic;

  return (
    <div className="page-wrap">
      <PageHeader
        eyebrow="Monday · foundation track"
        title="See the next right move."
        lead="Your foundation workspace keeps the path narrow: one focus, a clear signal, and just enough context to make the next session count."
        action={<Link href="/practice" className="button-primary" data-testid="link-start-practice"><Target size={15} /> Start practice <ArrowRight size={15} /></Link>}
      />
      {summaryQuery.isLoading ? (
        <div className="dashboard-grid" data-testid="loading-dashboard">
          <div className="summary-banner"><div className="skeleton" style={{ width: 120, height: 11, background: '#334255' }} /><div className="skeleton" style={{ width: '72%', height: 34, marginTop: 26, background: '#334255' }} /></div>
          <div className="streak-card"><div className="skeleton" style={{ width: 90, height: 11 }} /><div className="skeleton" style={{ width: 120, height: 62, marginTop: 25 }} /></div>
        </div>
      ) : summaryQuery.isError ? (
        <ErrorState message="We could not load your study summary. Your topic data may still be available below." onRetry={() => summaryQuery.refetch()} testId="error-dashboard" />
      ) : summary ? (
        <>
          <section className="dashboard-grid reveal reveal-1" aria-label="Learning summary">
            <div className="summary-banner" data-testid="panel-dashboard-summary">
              <div className="summary-kicker">Current learning signal</div>
              <h2 className="summary-title">You have <em>{summary.questionsAttempted}</em> of {summary.totalQuestions} questions in the field.</h2>
              <div className="summary-meta">
                <div className="summary-meta-item"><span className="summary-meta-label">Overall accuracy</span><span className="summary-meta-value">{Math.round(summary.overallAccuracy)}%</span></div>
                <div className="summary-meta-item"><span className="summary-meta-label">Topics mapped</span><span className="summary-meta-value">{summary.totalTopics}</span></div>
                <div className="summary-meta-item"><span className="summary-meta-label">Study time</span><span className="summary-meta-value">{summary.studyMinutes} min</span></div>
              </div>
            </div>
            <div className="streak-card" data-testid="panel-study-streak">
              <div className="card-kicker">Consistency signal</div>
              <div className="streak-number">{summary.streakDays}</div>
              <div className="streak-caption">{summary.streakDays === 1 ? 'day in a row' : 'days in a row'} with a study session.</div>
              <div className="streak-foot"><span className="card-kicker">This week</span><span className="mini-bars" aria-hidden="true">{[9, 14, 11, 20, 16, 21, 13].map((height, index) => <i key={index} style={{ height }} />)}</span></div>
            </div>
          </section>
          <div className="section-head reveal reveal-2">
            <h2 className="section-title">Your active focus</h2>
            <Link href="/topics" className="section-link" data-testid="link-view-all-topics">View topic map <ChevronRight size={14} /></Link>
          </div>
          {focus ? (
            <section className="focus-layout reveal reveal-2">
              <div className="focus-card" data-testid="panel-focus-topic">
                <div className="focus-copy">
                  <div className="focus-label">Recommended next</div>
                  <h3 className="focus-name">{focus.name}</h3>
                  <p className="focus-desc">{focus.description}</p>
                </div>
                <div className="focus-progress"><div className="progress-label"><span>Progress</span><span>{Math.round(focus.progressPercent)}%</span></div><ProgressBar value={focus.progressPercent} /></div>
              </div>
              <div className="quick-card">
                <Metric label="Questions" value={focus.attemptedCount} detail={`/ ${focus.questionCount}`} icon={BookOpen} />
                <Metric label="Accuracy" value={`${Math.round(focus.accuracy)}%`} detail="correct" icon={Check} />
                <Metric label="Avg. time" value={`${Math.round(focus.averageDurationSeconds)}s`} detail="per question" icon={Clock3} />
              </div>
            </section>
          ) : (
            <EmptyState title="No focus topic yet" copy="Once your topic catalog is ready, the next best place to spend study time will appear here." href="/topics" action="Open topic map" />
          )}
          <div className="section-head reveal reveal-3">
            <h2 className="section-title">Active topics</h2>
            <span className="filter-note">{topics.length ? `${topics.length} mapped` : 'Awaiting catalog'}</span>
          </div>
          {topicsQuery.isLoading ? <LoadingTopics /> : topicsQuery.isError ? <ErrorState message="The topic map could not be loaded." onRetry={() => topicsQuery.refetch()} testId="error-dashboard-topics" /> : topics.length ? <div className="topic-grid reveal reveal-3">{topics.slice(0, 6).map((topic, index) => <TopicCard key={topic.id} topic={topic} index={index} />)}</div> : <EmptyState title="Your map is quiet" copy="No active topics have been added to the foundation catalog yet." href="/practice" action="Open practice" />}
        </>
      ) : (
        <EmptyState title="No summary to show" copy="Your dashboard will populate as soon as the foundation service returns a learning summary." href="/topics" action="Browse topics" />
      )}
    </div>
  );
}

function TopicsPage() {
  const query = useListTopics();
  const topics = query.data ?? [];
  const sortedTopics = [...topics].sort((a, b) => a.displayOrder - b.displayOrder);
  return (
    <div className="page-wrap">
      <PageHeader eyebrow="Curriculum / active catalog" title="Topic map" lead="A complete view of the foundation track. Start with the lowest signal, or return to a topic you want to make automatic." action={<div className="status-chip"><span className="health-dot" /> {topics.length} active topics</div>} />
      <div className="header-rule" />
      {query.isLoading ? <LoadingTopics /> : query.isError ? <ErrorState message="We could not reach the active topic catalog." onRetry={() => query.refetch()} testId="error-topics" /> : sortedTopics.length ? (
        <>
          <div className="topics-toolbar"><span className="catalog-count">{String(sortedTopics.length).padStart(2, '0')} TOPICS · FOUNDATION SCOPE</span><span className="filter-note">Progress is saved to your workspace</span></div>
          <div className="topic-grid" data-testid="grid-topics">{sortedTopics.map((topic, index) => <TopicCard key={topic.id} topic={topic} index={index} />)}</div>
        </>
      ) : <EmptyState title="No active topics" copy="The foundation catalog has not been seeded yet. Check back when topics are available." />}
    </div>
  );
}

function PracticePage() {
  const { isLoaded, isSignedIn } = useAuth();
  return (
    <div className="page-wrap">
      <PageHeader eyebrow="Practice / foundation mode" title="Practice with a clean signal." lead="Bring one question into focus. Choose deliberately, submit for server-checked feedback, then move on when you are ready." />
      <div className="practice-frame">
        <section className="practice-hero reveal reveal-1">
          <div className="eyebrow" style={{ color: '#f5916f' }}>Recall / in sequence</div>
          <h2>Make the concept answer back.</h2>
          <p>Work through active CCNA topics one prompt at a time. The question stays neutral until you submit; the answer service returns the result and explanation.</p>
          <a href="#practice-session" className="button-primary" data-testid="link-enter-practice"><Target size={15} /> Choose a topic <ArrowRight size={15} /></a>
        </section>
        <div className="practice-info reveal reveal-2">
          <div className="practice-info-card"><div className="practice-info-number">01</div><div className="practice-info-title">Select a domain</div><p className="practice-info-copy">Stay with one active topic long enough to retrieve what you know.</p></div>
          <div className="practice-info-card"><div className="practice-info-number">02</div><div className="practice-info-title">Commit an answer</div><p className="practice-info-copy">No correctness hints appear before the answer is checked.</p></div>
          <div className="practice-info-card"><div className="practice-info-number">03</div><div className="practice-info-title">Read the reasoning</div><p className="practice-info-copy">Use the server-returned explanation to close the loop.</p></div>
        </div>
        <div id="practice-session"><PracticeWorkspace isAuthLoaded={isLoaded} isSignedIn={Boolean(isSignedIn)} /></div>
      </div>
    </div>
  );
}

function SignInPage() {
  return (
    <div className="auth-page">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        appearance={clerkAppearance}
      />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="auth-page">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        appearance={clerkAppearance}
      />
    </div>
  );
}

function AdminPage() {
  const [location] = useLocation();
  const questionsPage = location === '/admin/questions';
  const { isLoaded, isSignedIn } = useAuth();
  const currentUserQuery = useGetCurrentUser({
    query: {
      queryKey: getGetCurrentUserQueryKey(),
      enabled: isLoaded && Boolean(isSignedIn),
      retry: false,
    },
  });
  const currentUser = currentUserQuery.data?.user;
  const adminAccessQuery = useGetAdminAccess({
    query: {
      queryKey: getGetAdminAccessQueryKey(),
      enabled: currentUser?.role === 'ADMIN',
      retry: false,
    },
  });

  if (!isLoaded || (isSignedIn && currentUserQuery.isLoading)) {
    return (
      <div className="page-wrap">
        <PageHeader eyebrow="Boundary / restricted surface" title="Checking access." lead="The server is verifying your authentication and application role before showing this surface." />
        <div className="empty-card" data-testid="loading-admin-access"><div className="skeleton" style={{ height: 14, width: 180, margin: '0 auto' }} /></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="page-wrap">
        <PageHeader eyebrow="Boundary / sign in required" title="Admin tools are restricted." lead="Sign in first. The server will verify your application role before granting access." />
        <section className="admin-boundary">
          <div className="admin-message reveal reveal-1">
            <LockKeyhole color="var(--signal)" size={23} />
            <h2>Authentication required.</h2>
            <p>This route does not grant access by itself. Sign in through Clerk, then return here for a server-side authorization check.</p>
            <Link href="/sign-in" className="button-primary" data-testid="link-admin-sign-in"><LogIn size={15} /> Sign in</Link>
          </div>
          <div className="boundary-mark reveal reveal-2" aria-label="Admin tools placeholder" data-testid="panel-admin-placeholder">
            <div className="boundary-diagram" aria-hidden="true"><span className="orbit-dot one" /><span className="orbit-dot two" /><span className="orbit-dot three" /><div className="boundary-circle"><div className="boundary-core"><LockKeyhole /></div></div></div>
          </div>
        </section>
      </div>
    );
  }

  if (currentUserQuery.isError || !currentUser) {
    return (
      <div className="page-wrap">
        <PageHeader eyebrow="Boundary / session issue" title="We could not verify your account." lead="Your Clerk session may have expired, or the local user bridge could not be loaded." />
        <div className="error-card" data-testid="error-admin-session"><CircleAlert size={26} color="var(--signal)" aria-hidden="true" /><h2 className="error-title">Session verification failed</h2><p className="error-copy">Sign out and sign in again to retry the server-side check.</p></div>
      </div>
    );
  }

  if (currentUser.role !== 'ADMIN') {
    return (
      <div className="page-wrap">
        <PageHeader eyebrow="Boundary / forbidden" title="This surface is for administrators." lead="Your account is authenticated, but it does not have the ADMIN role in the application database." />
        <section className="admin-boundary">
          <div className="admin-message reveal reveal-1">
            <ShieldCheck color="var(--signal)" size={23} />
            <h2>Access denied.</h2>
            <p>Frontend route visibility is not the security control. The API also rejects this account with HTTP 403 when it calls the admin boundary.</p>
            <Link href="/" className="button-primary" data-testid="link-return-dashboard"><ArrowRight size={15} style={{ transform: 'rotate(180deg)' }} /> Return to overview</Link>
          </div>
          <div className="boundary-mark reveal reveal-2" aria-label="Forbidden admin tools placeholder" data-testid="panel-admin-forbidden">
            <div className="boundary-diagram" aria-hidden="true"><span className="orbit-dot one" /><span className="orbit-dot two" /><span className="orbit-dot three" /><div className="boundary-circle"><div className="boundary-core"><LockKeyhole /></div></div></div>
          </div>
        </section>
      </div>
    );
  }

  if (adminAccessQuery.isLoading) {
    return (
      <div className="page-wrap">
        <PageHeader eyebrow="Boundary / restricted surface" title="Checking administrator access." lead="The server is confirming the ADMIN policy for this authenticated account." />
        <div className="empty-card" data-testid="loading-admin-policy"><div className="skeleton" style={{ height: 14, width: 220, margin: '0 auto' }} /></div>
      </div>
    );
  }

  if (adminAccessQuery.isError) {
    return (
      <div className="page-wrap">
        <PageHeader eyebrow="Boundary / authorization error" title="The server did not grant admin access." lead="The UI does not assume that a role label is enough; it also checks the protected API boundary." />
        <div className="error-card" data-testid="error-admin-policy"><CircleAlert size={26} color="var(--signal)" aria-hidden="true" /><h2 className="error-title">Authorization check failed</h2><p className="error-copy">Try again after confirming your account is active.</p><button className="button-quiet" onClick={() => void adminAccessQuery.refetch()} data-testid="button-retry-admin"><Radar size={15} /> Retry access check</button></div>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <PageHeader
        eyebrow={questionsPage ? 'Admin / question management' : 'Admin / topic management'}
        title={questionsPage ? 'Manage questions.' : 'Manage topics.'}
        lead={questionsPage
          ? 'Create, edit, filter and disable single-answer multiple-choice questions. The server verifies every action.'
          : 'Create, edit and disable curriculum topics. Every action is re-checked by the server-side ADMIN policy.'}
        action={questionsPage
          ? <Link href="/admin" className="button-primary" data-testid="link-admin-topics">Manage topics <ArrowRight size={15} /></Link>
          : <Link href="/admin/questions" className="button-primary" data-testid="link-admin-questions">Manage questions <ArrowRight size={15} /></Link>}
      />
      {questionsPage ? <AdminQuestionManager /> : <AdminTopicManager />}

    </div>
  );
}

function NotFound() {
  return (
    <div className="route-not-found">
      <div>
        <div className="eyebrow">404 / route not found</div>
        <h1>That path is not in the map.</h1>
        <p>Return to the learning workspace and pick a known route.</p>
        <Link href="/" className="button-primary" data-testid="link-not-found-home"><ArrowRight size={15} style={{ transform: 'rotate(180deg)' }} /> Back to overview</Link>
      </div>
    </div>
  );
}

function Router() {
  const [location, setLocation] = useLocation();
  const stripBase = (to: string) => (basePath && to.startsWith(basePath) ? to.slice(basePath.length) || '/' : to);
  return (
    <ClerkProvider
      publishableKey={clerkPubKey!}
      proxyUrl={clerkProxyUrl || undefined}
      appearance={clerkAppearance}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
    <ErrorBoundary resetKey={location}>
      <Switch>
        <Route path="/sign-in/*?"><SignInPage /></Route>
        <Route path="/sign-up/*?"><SignUpPage /></Route>
        <Route path="/"><SharedShell><Dashboard /></SharedShell></Route>
        <Route path="/topics"><SharedShell><TopicsPage /></SharedShell></Route>
        <Route path="/practice/history"><SharedShell><PracticeHistoryPage /></SharedShell></Route>
        <Route path="/practice"><SharedShell><PracticePage /></SharedShell></Route>
        <Route path="/admin/questions"><SharedShell><AdminPage /></SharedShell></Route>
        <Route path="/admin"><SharedShell><AdminPage /></SharedShell></Route>
        <Route><NotFound /></Route>
      </Switch>
    </ErrorBoundary>
    </ClerkProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          {clerkPubKey ? <Router /> : <MissingClerkConfig />}
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
