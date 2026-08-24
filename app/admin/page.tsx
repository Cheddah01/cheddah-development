'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

const WORKER_ORIGIN = 'https://cheddah-plugins-api.colbysthickey.workers.dev';
const SESSION_KEY = 'cheddahPluginSession';

type AdminUser = {
  username: string;
  displayName: string;
  isAdmin: boolean;
};

type PluginRecord = {
  id: number;
  slug: string;
  name: string;
  category: string;
  summary: string;
  tags: string[];
  sourceUrl: string | null;
  downloadUrl: string | null;
  documentationUrl: string | null;
  iconLetter: string;
  accentTone: string;
  published: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type AuthState =
  | { kind: 'checking' }
  | { kind: 'logged-out' }
  | { kind: 'authenticated'; user: AdminUser }
  | { kind: 'expired' }
  | { kind: 'denied' }
  | { kind: 'unavailable' };

type PluginState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'loaded'; plugins: PluginRecord[] }
  | { kind: 'error' };

function isReasonableSession(value: string) {
  return value.length >= 40 && value.length <= 4096 && value.includes('.');
}

function safeExternalUrl(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function safeTone(value: string) {
  return ['gold', 'rose', 'mint', 'aqua', 'blue'].includes(value) ? value : 'blue';
}

function formatUpdatedAt(value: string) {
  if (!value) {
    return 'Update time unavailable';
  }

  const normalized = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`;
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return 'Update time unavailable';
  }

  return `Updated ${new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)}`;
}

function ResourceLink({ label, url }: { label: string; url: string | null }) {
  const safeUrl = safeExternalUrl(url);

  if (!safeUrl) {
    return <span className="admin-resource missing">{label} missing</span>;
  }

  return (
    <a className="admin-resource linked" href={safeUrl} target="_blank" rel="noreferrer">
      {label} <span aria-hidden="true">↗</span>
    </a>
  );
}

export default function AdminPage() {
  const [auth, setAuth] = useState<AuthState>({ kind: 'checking' });
  const [pluginState, setPluginState] = useState<PluginState>({ kind: 'idle' });
  const [isNight, setIsNight] = useState(false);

  const loadPlugins = useCallback(async (token: string) => {
    setPluginState({ kind: 'loading' });

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 7000);

    try {
      const response = await fetch(`${WORKER_ORIGIN}/api/admin/plugins`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'omit',
        signal: controller.signal,
      });

      if (response.status === 401 || response.status === 403) {
        window.sessionStorage.removeItem(SESSION_KEY);
        setPluginState({ kind: 'idle' });
        setAuth({ kind: response.status === 403 ? 'denied' : 'expired' });
        return;
      }

      if (!response.ok) {
        setPluginState({ kind: 'error' });
        return;
      }

      const payload = await response.json() as {
        ok?: boolean;
        plugins?: PluginRecord[];
      };

      if (payload.ok !== true || !Array.isArray(payload.plugins)) {
        setPluginState({ kind: 'error' });
        return;
      }

      setPluginState({
        kind: 'loaded',
        plugins: payload.plugins.filter((plugin) => (
          plugin &&
          Number.isSafeInteger(plugin.id) &&
          typeof plugin.slug === 'string' &&
          typeof plugin.name === 'string' &&
          typeof plugin.category === 'string' &&
          typeof plugin.summary === 'string' &&
          Array.isArray(plugin.tags)
        )),
      });
    } catch {
      setPluginState({ kind: 'error' });
    } finally {
      window.clearTimeout(timeout);
    }
  }, []);

  const verifySession = useCallback(async (token: string) => {
    setAuth({ kind: 'checking' });

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 7000);

    try {
      const response = await fetch(`${WORKER_ORIGIN}/api/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'omit',
        signal: controller.signal,
      });

      if (response.status === 401 || response.status === 403) {
        window.sessionStorage.removeItem(SESSION_KEY);
        setAuth({ kind: response.status === 403 ? 'denied' : 'expired' });
        return;
      }

      if (!response.ok) {
        setAuth({ kind: 'unavailable' });
        return;
      }

      const payload = await response.json() as {
        authenticated?: boolean;
        user?: Partial<AdminUser>;
      };

      if (
        payload.authenticated !== true ||
        payload.user?.isAdmin !== true ||
        typeof payload.user.username !== 'string' ||
        typeof payload.user.displayName !== 'string'
      ) {
        window.sessionStorage.removeItem(SESSION_KEY);
        setAuth({ kind: 'expired' });
        return;
      }

      setAuth({
        kind: 'authenticated',
        user: {
          username: payload.user.username,
          displayName: payload.user.displayName,
          isAdmin: true,
        },
      });
      void loadPlugins(token);
    } catch {
      setAuth({ kind: 'unavailable' });
    } finally {
      window.clearTimeout(timeout);
    }
  }, [loadPlugins]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const shouldUseNight = window.localStorage.getItem('cheddah-theme') === 'night';
      document.documentElement.classList.toggle('night', shouldUseNight);
      setIsNight(shouldUseNight);

      const fragment = new URLSearchParams(window.location.hash.slice(1));
      const returnedSession = fragment.get('session');
      const loginResult = fragment.get('login');

      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }

      if (returnedSession && isReasonableSession(returnedSession)) {
        window.sessionStorage.setItem(SESSION_KEY, returnedSession);
        void verifySession(returnedSession);
        return;
      }

      const storedSession = window.sessionStorage.getItem(SESSION_KEY);

      if (storedSession && isReasonableSession(storedSession)) {
        void verifySession(storedSession);
        return;
      }

      window.sessionStorage.removeItem(SESSION_KEY);

      if (loginResult === 'denied') {
        setAuth({ kind: 'denied' });
      } else if (loginResult === 'failed' || loginResult === 'cancelled') {
        setAuth({ kind: 'expired' });
      } else {
        setAuth({ kind: 'logged-out' });
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [verifySession]);

  const retry = () => {
    const token = window.sessionStorage.getItem(SESSION_KEY);

    if (token && isReasonableSession(token)) {
      void verifySession(token);
    } else {
      setAuth({ kind: 'logged-out' });
    }
  };

  const refreshPlugins = () => {
    const token = window.sessionStorage.getItem(SESSION_KEY);

    if (token && isReasonableSession(token)) {
      void loadPlugins(token);
    } else {
      setPluginState({ kind: 'idle' });
      setAuth({ kind: 'expired' });
    }
  };

  const logout = () => {
    window.sessionStorage.removeItem(SESSION_KEY);
    setPluginState({ kind: 'idle' });
    setAuth({ kind: 'logged-out' });
  };

  const toggleTheme = () => {
    const nextTheme = !isNight;
    setIsNight(nextTheme);
    document.documentElement.classList.toggle('night', nextTheme);
    window.localStorage.setItem('cheddah-theme', nextTheme ? 'night' : 'day');
  };

  return (
    <main className="admin-page">
      <div className="sky" aria-hidden="true">
        <div className="night-veil" /><div className="stars" />
        <div className="mc-sun" /><div className="mc-moon" />
        <div className="mc-cloud cloud-one" /><div className="mc-cloud cloud-two" />
        <div className="mc-cloud cloud-three" /><div className="mc-cloud cloud-four" />
      </div>

      <header className="site-header admin-header">
        <Link className="brand" href="/" aria-label="Cheddah Development home">
          <span className="brand-block" aria-hidden="true">🧀</span>
          <span>Cheddah Development</span>
        </Link>
        <span className="studio-status"><i /> Private workspace</span>
        <nav aria-label="Admin navigation">
          <Link href="/">Back to website</Link>
        </nav>
        <button
          className="mode-toggle"
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle day and night mode"
          aria-pressed={isNight}
        >
          <span aria-hidden="true">{isNight ? '☀️' : '🌙'}</span>
        </button>
      </header>

      <section className="admin-shell">
        <div className="admin-intro">
          <p className="eyebrow">Private plugin workspace</p>
          <h1>Plugin control panel.</h1>
          <p>Manage the information that appears on your public portfolio without editing the website by hand.</p>
        </div>

        <div className="admin-auth-card" aria-live="polite">
          {auth.kind === 'checking' ? (
            <div className="admin-state">
              <span className="admin-state-icon admin-spinner" aria-hidden="true" />
              <p className="mini-label">Checking session</p>
              <h2>Opening your workspace…</h2>
              <p>Confirming your Discord administrator access.</p>
            </div>
          ) : null}

          {auth.kind === 'logged-out' ? (
            <div className="admin-state">
              <span className="admin-state-icon" aria-hidden="true">🔐</span>
              <p className="mini-label">Administrator sign-in</p>
              <h2>Sign in to continue.</h2>
              <p>Only Discord accounts on the server-side administrator list can enter this workspace.</p>
              <a className="button button-primary admin-login" href={`${WORKER_ORIGIN}/auth/discord`}>
                Sign in with Discord
              </a>
            </div>
          ) : null}

          {auth.kind === 'expired' ? (
            <div className="admin-state">
              <span className="admin-state-icon" aria-hidden="true">⌛</span>
              <p className="mini-label">Session ended</p>
              <h2>Please sign in again.</h2>
              <p>Your session expired, was cancelled, or could not be verified.</p>
              <a className="button button-primary admin-login" href={`${WORKER_ORIGIN}/auth/discord`}>
                Sign in with Discord
              </a>
            </div>
          ) : null}

          {auth.kind === 'denied' ? (
            <div className="admin-state">
              <span className="admin-state-icon" aria-hidden="true">🛡️</span>
              <p className="mini-label">Access denied</p>
              <h2>This account is not an administrator.</h2>
              <p>The Worker rejected this Discord account before creating a session.</p>
              <Link className="button button-secondary admin-login" href="/">Return to website</Link>
            </div>
          ) : null}

          {auth.kind === 'unavailable' ? (
            <div className="admin-state">
              <span className="admin-state-icon" aria-hidden="true">🌧️</span>
              <p className="mini-label">Temporarily unavailable</p>
              <h2>Your session could not be checked.</h2>
              <p>The saved session has been kept. Try again when the connection is ready.</p>
              <button className="button button-primary admin-login" type="button" onClick={retry}>
                Retry
              </button>
            </div>
          ) : null}

          {auth.kind === 'authenticated' ? (
            <div className="admin-dashboard-shell">
              <div className="admin-userbar">
                <div>
                  <p className="mini-label">Signed in securely</p>
                  <h2>Welcome, {auth.user.displayName}.</h2>
                  <p>@{auth.user.username} · Administrator</p>
                </div>
                <button className="admin-logout" type="button" onClick={logout}>Log out</button>
              </div>

              <div className="admin-record-heading">
                <div>
                  <p className="mini-label">Live D1 records</p>
                  <h3>
                    {pluginState.kind === 'loaded'
                      ? `${pluginState.plugins.length} plugins connected`
                      : 'Loading plugin records'}
                  </h3>
                </div>
                <button
                  className="admin-refresh"
                  type="button"
                  onClick={refreshPlugins}
                  disabled={pluginState.kind === 'loading'}
                >
                  {pluginState.kind === 'loading' ? 'Loading…' : 'Refresh'}
                </button>
              </div>

              {pluginState.kind === 'loading' || pluginState.kind === 'idle' ? (
                <div className="admin-record-loading">
                  <span className="admin-spinner" aria-hidden="true" />
                  <p>Loading the private plugin records…</p>
                </div>
              ) : null}

              {pluginState.kind === 'error' ? (
                <div className="admin-record-error">
                  <span aria-hidden="true">🌧️</span>
                  <div>
                    <h3>Plugin records could not be loaded.</h3>
                    <p>Your signed-in session is still valid.</p>
                  </div>
                  <button type="button" onClick={refreshPlugins}>Retry</button>
                </div>
              ) : null}

              {pluginState.kind === 'loaded' && pluginState.plugins.length === 0 ? (
                <div className="admin-record-empty">
                  <span aria-hidden="true">📦</span>
                  <h3>No plugin records found.</h3>
                  <p>Add a record in D1 before continuing.</p>
                </div>
              ) : null}

              {pluginState.kind === 'loaded' && pluginState.plugins.length > 0 ? (
                <div className="admin-record-list">
                  {pluginState.plugins.map((plugin) => (
                    <article className="admin-plugin-record" key={plugin.id}>
                      <div className="admin-plugin-record-top">
                        <span className={`plugin-mark mark-${safeTone(plugin.accentTone)}`} aria-hidden="true">
                          {plugin.iconLetter.slice(0, 1) || 'P'}
                        </span>
                        <div className="admin-plugin-record-title">
                          <span className={`admin-publish-state ${plugin.published ? 'published' : 'draft'}`}>
                            {plugin.published ? 'Published' : 'Hidden'}
                          </span>
                          <h3>{plugin.name}</h3>
                          <p>{plugin.category} · {plugin.slug}</p>
                        </div>
                        <span className="admin-sort-order">#{plugin.sortOrder}</span>
                      </div>

                      <p className="admin-plugin-summary">{plugin.summary}</p>

                      <div className="tag-row">
                        {plugin.tags.map((tag) => <span key={tag}>{tag}</span>)}
                      </div>

                      <div className="admin-resource-row">
                        <ResourceLink label="Source" url={plugin.sourceUrl} />
                        <ResourceLink label="Download" url={plugin.downloadUrl} />
                        <ResourceLink label="Documentation" url={plugin.documentationUrl} />
                      </div>

                      <div className="admin-plugin-record-footer">
                        <span>{formatUpdatedAt(plugin.updatedAt)}</span>
                        <span>Read-only checkpoint</span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}

              <div className="admin-next-step">
                <span aria-hidden="true">🧰</span>
                <div>
                  <p className="mini-label">Private data connected</p>
                  <h3>Editing comes next.</h3>
                  <p>First we are confirming that only your verified Discord session can retrieve these records.</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
