'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';

const WORKER_ORIGIN = 'https://cheddah-plugins-api.colbysthickey.workers.dev';
const SESSION_KEY = 'cheddahPluginSession';
const ACCENT_TONES = ['gold', 'rose', 'mint', 'aqua', 'blue'] as const;

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

type EditorValues = {
  slug: string;
  name: string;
  category: string;
  summary: string;
  tags: string;
  sourceUrl: string;
  downloadUrl: string;
  documentationUrl: string;
  iconLetter: string;
  accentTone: string;
  published: boolean;
  sortOrder: string;
};

type SaveState =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'error'; message: string };

type FieldErrors = Partial<Record<keyof EditorValues, string>>;

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
  return ACCENT_TONES.includes(value as (typeof ACCENT_TONES)[number]) ? value : 'blue';
}

function editorValuesFor(plugin: PluginRecord): EditorValues {
  return {
    slug: plugin.slug,
    name: plugin.name,
    category: plugin.category,
    summary: plugin.summary,
    tags: plugin.tags.join(', '),
    sourceUrl: plugin.sourceUrl ?? '',
    downloadUrl: plugin.downloadUrl ?? '',
    documentationUrl: plugin.documentationUrl ?? '',
    iconLetter: plugin.iconLetter,
    accentTone: safeTone(plugin.accentTone),
    published: plugin.published,
    sortOrder: String(plugin.sortOrder),
  };
}

function newEditorValues(plugins: PluginRecord[]): EditorValues {
  const highestSortOrder = plugins.reduce(
    (highest, plugin) => Math.max(highest, plugin.sortOrder),
    0,
  );

  return {
    slug: '',
    name: '',
    category: '',
    summary: '',
    tags: '',
    sourceUrl: '',
    downloadUrl: '',
    documentationUrl: '',
    iconLetter: 'P',
    accentTone: 'blue',
    published: false,
    sortOrder: String(Math.min(highestSortOrder + 10, 9999)),
  };
}

function normalizedTags(value: string) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function isValidOptionalHttpsUrl(value: string) {
  if (!value.trim()) {
    return true;
  }

  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

function validateEditor(values: EditorValues) {
  const errors: FieldErrors = {};
  const tags = normalizedTags(values.tags);
  const sortOrder = Number(values.sortOrder);

  if (!values.slug.trim()) errors.slug = 'Enter a plugin slug.';
  else if (values.slug.trim().length > 80) errors.slug = 'Use 80 characters or fewer.';
  else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug.trim())) {
    errors.slug = 'Use lowercase letters, numbers, and single hyphens only.';
  }

  if (!values.name.trim()) errors.name = 'Enter a plugin name.';
  else if (values.name.trim().length > 80) errors.name = 'Use 80 characters or fewer.';

  if (!values.category.trim()) errors.category = 'Enter a category.';
  else if (values.category.trim().length > 80) errors.category = 'Use 80 characters or fewer.';

  if (!values.summary.trim()) errors.summary = 'Enter a short summary.';
  else if (values.summary.trim().length > 500) errors.summary = 'Use 500 characters or fewer.';

  if (tags.length > 8) errors.tags = 'Use no more than 8 tags.';
  else if (tags.some((tag) => tag.length > 40)) errors.tags = 'Each tag must be 40 characters or fewer.';

  if (!isValidOptionalHttpsUrl(values.sourceUrl)) errors.sourceUrl = 'Use a complete https:// link.';
  if (!isValidOptionalHttpsUrl(values.downloadUrl)) errors.downloadUrl = 'Use a complete https:// link.';
  if (!isValidOptionalHttpsUrl(values.documentationUrl)) errors.documentationUrl = 'Use a complete https:// link.';

  if (!/^[a-z0-9]$/i.test(values.iconLetter.trim())) errors.iconLetter = 'Use one letter or number.';
  if (!ACCENT_TONES.includes(values.accentTone as (typeof ACCENT_TONES)[number])) errors.accentTone = 'Choose a valid accent.';
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 9999) errors.sortOrder = 'Use a whole number from 0 to 9999.';

  return errors;
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
  const [editingPlugin, setEditingPlugin] = useState<PluginRecord | null>(null);
  const [isCreatingPlugin, setIsCreatingPlugin] = useState(false);
  const [editorValues, setEditorValues] = useState<EditorValues | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saveState, setSaveState] = useState<SaveState>({ kind: 'idle' });
  const [saveNotice, setSaveNotice] = useState('');
  const editTriggerRef = useRef<HTMLButtonElement | null>(null);

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

  const closeEditor = useCallback(() => {
    if (saveState.kind === 'saving') {
      return;
    }

    setEditingPlugin(null);
    setIsCreatingPlugin(false);
    setEditorValues(null);
    setFieldErrors({});
    setSaveState({ kind: 'idle' });
    window.requestAnimationFrame(() => editTriggerRef.current?.focus());
  }, [saveState.kind]);

  useEffect(() => {
    if (!editingPlugin && !isCreatingPlugin) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeEditor();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeEditor, editingPlugin, isCreatingPlugin]);

  const openEditor = (plugin: PluginRecord, trigger: HTMLButtonElement) => {
    editTriggerRef.current = trigger;
    setIsCreatingPlugin(false);
    setEditingPlugin(plugin);
    setEditorValues(editorValuesFor(plugin));
    setFieldErrors({});
    setSaveState({ kind: 'idle' });
    setSaveNotice('');
  };

  const openCreator = (plugins: PluginRecord[], trigger: HTMLButtonElement) => {
    editTriggerRef.current = trigger;
    setEditingPlugin(null);
    setIsCreatingPlugin(true);
    setEditorValues(newEditorValues(plugins));
    setFieldErrors({});
    setSaveState({ kind: 'idle' });
    setSaveNotice('');
  };

  const updateEditorValue = <Key extends keyof EditorValues>(key: Key, value: EditorValues[Key]) => {
    setEditorValues((current) => current ? { ...current, [key]: value } : current);
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
    if (saveState.kind === 'error') setSaveState({ kind: 'idle' });
  };

  const savePlugin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if ((!editingPlugin && !isCreatingPlugin) || !editorValues || saveState.kind === 'saving') {
      return;
    }

    const errors = validateEditor(editorValues);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSaveState({ kind: 'error', message: 'Check the highlighted fields and try again.' });
      return;
    }

    const token = window.sessionStorage.getItem(SESSION_KEY);
    if (!token || !isReasonableSession(token)) {
      setEditingPlugin(null);
      setIsCreatingPlugin(false);
      setEditorValues(null);
      setAuth({ kind: 'expired' });
      return;
    }

    setFieldErrors({});
    setSaveState({ kind: 'saving' });

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(
        isCreatingPlugin
          ? `${WORKER_ORIGIN}/api/admin/plugins`
          : `${WORKER_ORIGIN}/api/admin/plugins/${editingPlugin!.id}`,
        {
        method: isCreatingPlugin ? 'POST' : 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
        signal: controller.signal,
        body: JSON.stringify({
          ...(isCreatingPlugin ? { slug: editorValues.slug.trim() } : {}),
          name: editorValues.name.trim(),
          category: editorValues.category.trim(),
          summary: editorValues.summary.trim(),
          tags: normalizedTags(editorValues.tags),
          sourceUrl: editorValues.sourceUrl.trim() || null,
          downloadUrl: editorValues.downloadUrl.trim() || null,
          documentationUrl: editorValues.documentationUrl.trim() || null,
          iconLetter: editorValues.iconLetter.trim(),
          accentTone: editorValues.accentTone,
          published: editorValues.published,
          sortOrder: Number(editorValues.sortOrder),
        }),
      });

      if (response.status === 401 || response.status === 403) {
        window.sessionStorage.removeItem(SESSION_KEY);
        setEditingPlugin(null);
        setIsCreatingPlugin(false);
        setEditorValues(null);
        setPluginState({ kind: 'idle' });
        setAuth({ kind: response.status === 403 ? 'denied' : 'expired' });
        return;
      }

      if (!isCreatingPlugin && response.status === 404) {
        setEditingPlugin(null);
        setEditorValues(null);
        setSaveState({ kind: 'idle' });
        setSaveNotice('That record changed or was removed. The list has been refreshed.');
        void loadPlugins(token);
        return;
      }

      const payload = await response.json().catch(() => null) as {
        ok?: boolean;
        plugin?: PluginRecord;
        error?: string;
        fields?: Record<string, string>;
      } | null;

      if (response.status === 400 || response.status === 409) {
        const workerErrors: FieldErrors = {};
        if (payload?.fields && typeof payload.fields === 'object') {
          for (const [key, value] of Object.entries(payload.fields)) {
            if (key in editorValues && typeof value === 'string') {
              workerErrors[key as keyof EditorValues] = value;
            }
          }
        }
        setFieldErrors(workerErrors);
        setSaveState({ kind: 'error', message: payload?.error || 'Check the highlighted fields and try again.' });
        return;
      }

      if (!response.ok || payload?.ok !== true || !payload.plugin) {
        const message = response.status === 413
          ? 'This update is too large.'
          : response.status === 415
            ? 'The update format was rejected.'
            : 'The plugin could not be saved. Please try again.';
        setSaveState({ kind: 'error', message });
        return;
      }

      const savedPlugin = payload.plugin;
      setPluginState((current) => current.kind === 'loaded'
        ? {
            kind: 'loaded',
            plugins: (isCreatingPlugin
              ? [...current.plugins, savedPlugin]
              : current.plugins.map((plugin) => plugin.id === savedPlugin.id ? savedPlugin : plugin))
              .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
          }
        : current);
      setSaveNotice(
        isCreatingPlugin
          ? `${savedPlugin.name} was created in the plugin database.`
          : `${savedPlugin.name} was saved to the plugin database.`,
      );
      setEditingPlugin(null);
      setIsCreatingPlugin(false);
      setEditorValues(null);
      setSaveState({ kind: 'idle' });
      window.requestAnimationFrame(() => editTriggerRef.current?.focus());
    } catch {
      setSaveState({ kind: 'error', message: 'The connection timed out. Your changes were not confirmed—please try again.' });
    } finally {
      window.clearTimeout(timeout);
    }
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
                <div className="admin-record-actions">
                  {pluginState.kind === 'loaded' ? (
                    <button
                      className="admin-create-button"
                      type="button"
                      onClick={(event) => openCreator(pluginState.plugins, event.currentTarget)}
                    >
                      <span aria-hidden="true">＋</span> New plugin
                    </button>
                  ) : null}
                  <button
                    className="admin-refresh"
                    type="button"
                    onClick={refreshPlugins}
                    disabled={pluginState.kind === 'loading'}
                  >
                    {pluginState.kind === 'loading' ? 'Loading…' : 'Refresh'}
                  </button>
                </div>
              </div>

              <p className="admin-save-notice" aria-live="polite">
                {saveNotice}
              </p>

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
                  <p>Use New plugin to create your first record.</p>
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
                        <button
                          className="admin-edit-button"
                          type="button"
                          onClick={(event) => openEditor(plugin, event.currentTarget)}
                        >
                          Edit plugin
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}

              <div className="admin-next-step">
                <span aria-hidden="true">✅</span>
                <div>
                  <p className="mini-label">Live catalog connected</p>
                  <h3>Changes publish from D1.</h3>
                  <p>Published records appear on the public plugin catalog automatically.</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {(editingPlugin || isCreatingPlugin) && editorValues ? (
        <div
          className="admin-editor-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEditor();
          }}
        >
          <section
            className="admin-editor"
            role="dialog"
            aria-modal="true"
            aria-labelledby="plugin-editor-title"
            aria-describedby="plugin-editor-description"
          >
            <div className="admin-editor-heading">
              <div>
                <p className="mini-label">
                  {isCreatingPlugin ? 'New catalog record' : `Editing ${editingPlugin!.slug}`}
                </p>
                <h2 id="plugin-editor-title">
                  {isCreatingPlugin ? 'Create a plugin' : `Update ${editingPlugin!.name}`}
                </h2>
                <p id="plugin-editor-description">
                  {isCreatingPlugin
                    ? 'Create it privately first, then publish it whenever the listing is ready.'
                    : 'Save changes directly to the private plugin database.'}
                </p>
              </div>
              <button
                className="admin-editor-close"
                type="button"
                onClick={closeEditor}
                disabled={saveState.kind === 'saving'}
                aria-label="Close plugin editor"
              >
                ×
              </button>
            </div>

            <form className="admin-editor-form" onSubmit={savePlugin} noValidate>
              <div className="admin-form-grid">
                {isCreatingPlugin ? (
                  <label className="admin-field admin-field-wide">
                    <span>Slug</span>
                    <input
                      autoFocus
                      value={editorValues.slug}
                      onChange={(event) => updateEditorValue(
                        'slug',
                        event.target.value.toLowerCase().replace(/\s+/g, '-'),
                      )}
                      maxLength={80}
                      placeholder="my-plugin"
                      aria-invalid={Boolean(fieldErrors.slug)}
                    />
                    <em>Permanent URL-safe identifier, such as better-baltop.</em>
                    {fieldErrors.slug ? <small>{fieldErrors.slug}</small> : null}
                  </label>
                ) : null}

                <label className="admin-field">
                  <span>Name</span>
                  <input
                    autoFocus={!isCreatingPlugin}
                    value={editorValues.name}
                    onChange={(event) => updateEditorValue('name', event.target.value)}
                    maxLength={80}
                    aria-invalid={Boolean(fieldErrors.name)}
                  />
                  {fieldErrors.name ? <small>{fieldErrors.name}</small> : null}
                </label>

                <label className="admin-field">
                  <span>Category</span>
                  <input
                    value={editorValues.category}
                    onChange={(event) => updateEditorValue('category', event.target.value)}
                    maxLength={80}
                    aria-invalid={Boolean(fieldErrors.category)}
                  />
                  {fieldErrors.category ? <small>{fieldErrors.category}</small> : null}
                </label>

                <label className="admin-field admin-field-wide">
                  <span>Summary</span>
                  <textarea
                    value={editorValues.summary}
                    onChange={(event) => updateEditorValue('summary', event.target.value)}
                    maxLength={500}
                    rows={4}
                    aria-invalid={Boolean(fieldErrors.summary)}
                  />
                  <em>{editorValues.summary.trim().length}/500</em>
                  {fieldErrors.summary ? <small>{fieldErrors.summary}</small> : null}
                </label>

                <label className="admin-field admin-field-wide">
                  <span>Tags</span>
                  <input
                    value={editorValues.tags}
                    onChange={(event) => updateEditorValue('tags', event.target.value)}
                    placeholder="Paper, MiniMessage, Leaderboards"
                    aria-invalid={Boolean(fieldErrors.tags)}
                  />
                  <em>Separate up to 8 tags with commas.</em>
                  {fieldErrors.tags ? <small>{fieldErrors.tags}</small> : null}
                </label>

                <label className="admin-field admin-field-wide">
                  <span>Source link</span>
                  <input
                    type="url"
                    inputMode="url"
                    value={editorValues.sourceUrl}
                    onChange={(event) => updateEditorValue('sourceUrl', event.target.value)}
                    placeholder="https://github.com/…"
                    aria-invalid={Boolean(fieldErrors.sourceUrl)}
                  />
                  {fieldErrors.sourceUrl ? <small>{fieldErrors.sourceUrl}</small> : null}
                </label>

                <label className="admin-field admin-field-wide">
                  <span>Download link</span>
                  <input
                    type="url"
                    inputMode="url"
                    value={editorValues.downloadUrl}
                    onChange={(event) => updateEditorValue('downloadUrl', event.target.value)}
                    placeholder="https://…"
                    aria-invalid={Boolean(fieldErrors.downloadUrl)}
                  />
                  {fieldErrors.downloadUrl ? <small>{fieldErrors.downloadUrl}</small> : null}
                </label>

                <label className="admin-field admin-field-wide">
                  <span>Documentation link</span>
                  <input
                    type="url"
                    inputMode="url"
                    value={editorValues.documentationUrl}
                    onChange={(event) => updateEditorValue('documentationUrl', event.target.value)}
                    placeholder="https://…"
                    aria-invalid={Boolean(fieldErrors.documentationUrl)}
                  />
                  {fieldErrors.documentationUrl ? <small>{fieldErrors.documentationUrl}</small> : null}
                </label>

                <label className="admin-field">
                  <span>Icon letter</span>
                  <input
                    value={editorValues.iconLetter}
                    onChange={(event) => updateEditorValue('iconLetter', event.target.value.slice(0, 1))}
                    maxLength={1}
                    aria-invalid={Boolean(fieldErrors.iconLetter)}
                  />
                  {fieldErrors.iconLetter ? <small>{fieldErrors.iconLetter}</small> : null}
                </label>

                <label className="admin-field">
                  <span>Accent color</span>
                  <select
                    value={editorValues.accentTone}
                    onChange={(event) => updateEditorValue('accentTone', event.target.value)}
                    aria-invalid={Boolean(fieldErrors.accentTone)}
                  >
                    {ACCENT_TONES.map((tone) => (
                      <option key={tone} value={tone}>{tone.charAt(0).toUpperCase() + tone.slice(1)}</option>
                    ))}
                  </select>
                  {fieldErrors.accentTone ? <small>{fieldErrors.accentTone}</small> : null}
                </label>

                <label className="admin-field">
                  <span>Sort order</span>
                  <input
                    type="number"
                    min="0"
                    max="9999"
                    step="1"
                    value={editorValues.sortOrder}
                    onChange={(event) => updateEditorValue('sortOrder', event.target.value)}
                    aria-invalid={Boolean(fieldErrors.sortOrder)}
                  />
                  {fieldErrors.sortOrder ? <small>{fieldErrors.sortOrder}</small> : null}
                </label>

                <label className="admin-publish-toggle">
                  <input
                    type="checkbox"
                    checked={editorValues.published}
                    onChange={(event) => updateEditorValue('published', event.target.checked)}
                  />
                  <span>
                    <strong>Published</strong>
                    <small>Show this plugin when the public site is connected.</small>
                  </span>
                </label>
              </div>

              {saveState.kind === 'error' ? (
                <p className="admin-save-error" role="alert">{saveState.message}</p>
              ) : null}

              <div className="admin-editor-actions">
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={closeEditor}
                  disabled={saveState.kind === 'saving'}
                >
                  Cancel
                </button>
                <button className="button button-primary" type="submit" disabled={saveState.kind === 'saving'}>
                  {saveState.kind === 'saving'
                    ? (isCreatingPlugin ? 'Creating…' : 'Saving…')
                    : (isCreatingPlugin ? 'Create plugin' : 'Save plugin')}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}
