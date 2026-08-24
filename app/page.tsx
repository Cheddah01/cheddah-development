'use client';

import { useEffect, useState } from 'react';

const WORKER_ORIGIN = 'https://cheddah-plugins-api.colbysthickey.workers.dev';
const ACCENT_TONES = ['gold', 'rose', 'mint', 'aqua', 'blue'] as const;

type PublicPlugin = {
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
  sortOrder: number;
  updatedAt: string;
};

const FALLBACK_PLUGINS: PublicPlugin[] = [
  {
    slug: 'better-baltop',
    name: 'BetterBaltop',
    category: 'Economy',
    summary: 'A fast, polished leaderboard GUI for Vault economy and optional PlayerPoints—cached so menus stay responsive.',
    tags: ['Paper 26.2', 'Vault', 'PlayerPoints'],
    sourceUrl: 'https://github.com/Cheddah01/Better-Baltop',
    downloadUrl: 'https://modrinth.com/plugin/betterbaltop',
    documentationUrl: 'https://docs.cheddah-development.net/plugin-documentaion/better-baltop',
    iconLetter: 'B',
    accentTone: 'gold',
    sortOrder: 10,
    updatedAt: '',
  },
  {
    slug: 'skin-statues',
    name: 'SkinStatues',
    category: 'Creative',
    summary: 'Build towering 3D block statues from any player skin, with modern layers, scaled construction, and safe undo.',
    tags: ['Paper', 'Fabric', 'World editing'],
    sourceUrl: 'https://github.com/Cheddah01/Skin-Statues',
    downloadUrl: 'https://modrinth.com/plugin/skin-statues',
    documentationUrl: 'https://docs.cheddah-development.net/plugin-documentaion/skin-statues',
    iconLetter: 'S',
    accentTone: 'rose',
    sortOrder: 20,
    updatedAt: '',
  },
];

function safeExternalUrl(value: unknown) {
  if (typeof value !== 'string' || !value) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.toString() : null;
  } catch {
    return null;
  }
}

function safeTone(value: unknown) {
  return typeof value === 'string' && ACCENT_TONES.includes(value as (typeof ACCENT_TONES)[number])
    ? value
    : 'blue';
}

function parsePublicPlugins(value: unknown): PublicPlugin[] | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const payload = value as { ok?: unknown; plugins?: unknown };
  if (payload.ok !== true || !Array.isArray(payload.plugins)) {
    return null;
  }

  const plugins = payload.plugins.flatMap((entry): PublicPlugin[] => {
    if (!entry || typeof entry !== 'object') {
      return [];
    }

    const plugin = entry as Record<string, unknown>;
    if (
      typeof plugin.slug !== 'string' || !plugin.slug ||
      typeof plugin.name !== 'string' || !plugin.name ||
      typeof plugin.category !== 'string' || !plugin.category ||
      typeof plugin.summary !== 'string' || !plugin.summary ||
      !Array.isArray(plugin.tags) || !plugin.tags.every((tag) => typeof tag === 'string') ||
      typeof plugin.iconLetter !== 'string' || !plugin.iconLetter ||
      typeof plugin.sortOrder !== 'number' || !Number.isFinite(plugin.sortOrder)
    ) {
      return [];
    }

    return [{
      slug: plugin.slug,
      name: plugin.name,
      category: plugin.category,
      summary: plugin.summary,
      tags: plugin.tags,
      sourceUrl: safeExternalUrl(plugin.sourceUrl),
      downloadUrl: safeExternalUrl(plugin.downloadUrl),
      documentationUrl: safeExternalUrl(plugin.documentationUrl),
      iconLetter: plugin.iconLetter.slice(0, 1),
      accentTone: safeTone(plugin.accentTone),
      sortOrder: plugin.sortOrder,
      updatedAt: typeof plugin.updatedAt === 'string' ? plugin.updatedAt : '',
    }];
  });

  if (payload.plugins.length > 0 && plugins.length === 0) {
    return null;
  }

  return plugins.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export default function Home() {
  const [isNight, setIsNight] = useState(false);
  const [plugins, setPlugins] = useState<PublicPlugin[]>(FALLBACK_PLUGINS);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const shouldUseNight = window.localStorage.getItem('cheddah-theme') === 'night';
      document.documentElement.classList.toggle('night', shouldUseNight);
      setIsNight(shouldUseNight);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 7000);

    const loadPlugins = async () => {
      try {
        const response = await fetch(`${WORKER_ORIGIN}/api/plugins`, {
          credentials: 'omit',
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const livePlugins = parsePublicPlugins(await response.json());
        if (livePlugins) {
          setPlugins(livePlugins);
        }
      } catch {
        // Keep the last-known public records when the Worker is temporarily unavailable.
      } finally {
        window.clearTimeout(timeout);
      }
    };

    void loadPlugins();

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = !isNight;
    setIsNight(nextTheme);
    document.documentElement.classList.toggle('night', nextTheme);
    window.localStorage.setItem('cheddah-theme', nextTheme ? 'night' : 'day');
  };

  return (
    <main>
      <div className="sky" aria-hidden="true">
        <div className="night-veil" /><div className="stars" />
        <div className="mc-sun" /><div className="mc-moon" />
        <div className="mc-cloud cloud-one" /><div className="mc-cloud cloud-two" />
        <div className="mc-cloud cloud-three" /><div className="mc-cloud cloud-four" />
      </div>

      <header className="site-header">
        <a className="brand" href="#top" aria-label="Cheddah Development home">
          <span className="brand-block" aria-hidden="true">🧀</span><span>Cheddah Development</span>
        </a>
        <span className="studio-status"><i /> Public plugin studio</span>
        <nav aria-label="Main navigation">
          <a href="#plugins">Plugins</a><a href="#approach">Approach</a><a href="#about">About</a>
          <a href="https://github.com/Cheddah01" target="_blank" rel="noreferrer">GitHub ↗</a>
        </nav>
        <button className="mode-toggle" type="button" onClick={toggleTheme} aria-label="Toggle day and night mode" aria-pressed={isNight}>
          <span aria-hidden="true">{isNight ? '☀️' : '🌙'}</span>
        </button>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">Minecraft plugin development</p>
          <h1>Plugins that feel at home on your server.</h1>
          <p className="hero-lede">Focused public plugins with friendly setup, thoughtful defaults, and the kind of polish players notice without needing a manual.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#plugins">Explore plugins</a>
            <a className="button button-secondary" href="https://github.com/Cheddah01" target="_blank" rel="noreferrer">View GitHub</a>
          </div>
        </div>

        <div className="hero-console" aria-label="Current development focus">
          <span className="hero-card-icon" aria-hidden="true">🧰</span>
          <p className="mini-label">Built for public servers</p>
          <h2>Small setup.<br />Big quality-of-life.</h2>
          <div className="server-details">
            <span>Modern Paper APIs</span><span>Safe optional integrations</span><span>Clear admin experience</span>
          </div>
        </div>
      </section>

      <div className="hero-strip" aria-label="Development stack">
        <span>☕ Java 25</span><span>📄 Paper 26.2</span><span>💬 Adventure</span><span>✨ MiniMessage</span>
      </div>

      <section className="section plugins-section" id="plugins">
        <div className="section-heading">
          <div><p className="section-kicker">Selected work</p><h2>Purpose-built plugins.<br /><span>No kitchen sinks.</span></h2></div>
          <p>Each project starts with one clear server-owner problem and grows only where the player experience benefits.</p>
        </div>

        {plugins.length > 0 ? (
          <div className="plugin-grid">
            {plugins.map((plugin, index) => (
              <article className="plugin-card" key={plugin.slug}>
                <div className="card-topline">
                  <span className="card-index">{String(index + 1).padStart(2, '0')}</span>
                  <span className="card-label">{plugin.category}</span>
                </div>
                <div className="card-title-row">
                  <span className={`plugin-mark mark-${safeTone(plugin.accentTone)}`} aria-hidden="true">
                    {plugin.iconLetter || 'P'}
                  </span>
                  <h3>{plugin.name}</h3>
                </div>
                <p>{plugin.summary}</p>
                <div className="tag-row">{plugin.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                <div className="card-links">
                  {plugin.downloadUrl ? (
                    <a className="card-primary-link" href={plugin.downloadUrl} target="_blank" rel="noreferrer">
                      Download <span>↗</span>
                    </a>
                  ) : null}
                  {plugin.documentationUrl ? (
                    <a href={plugin.documentationUrl} target="_blank" rel="noreferrer">
                      Documentation <span>↗</span>
                    </a>
                  ) : null}
                  {plugin.sourceUrl ? (
                    <a href={plugin.sourceUrl} target="_blank" rel="noreferrer">
                      Source <span>↗</span>
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="plugin-empty-state">
            <span aria-hidden="true">🧰</span>
            <h3>New releases are being prepared.</h3>
            <p>Check back soon for the next public plugin.</p>
          </div>
        )}
      </section>

      <section className="section approach-section" id="approach">
        <div className="approach-copy">
          <p className="section-kicker">The build philosophy</p><h2>Made for real servers,<br /><span>not feature checklists.</span></h2>
          <p>Good plugins should make an administrator’s day easier and disappear into the experience for everyone else.</p>
          <a className="text-link" href="https://github.com/Cheddah01?tab=repositories" target="_blank" rel="noreferrer">Browse all public projects <span>↗</span></a>
        </div>
        <div className="principle-list">
          <article><span>01</span><div><h3>Drop-in sensible</h3><p>Useful from the first restart, with clear configuration when you want to go deeper.</p></div></article>
          <article><span>02</span><div><h3>Safe by default</h3><p>Careful persistence, useful diagnostics, and upgrade behavior that respects existing servers.</p></div></article>
          <article><span>03</span><div><h3>Player-polished</h3><p>Clean messages, intuitive menus, permissions, and feedback that never feels half-finished.</p></div></article>
          <article><span>04</span><div><h3>Focused & maintainable</h3><p>Modern Paper APIs and isolated optional integrations—without unnecessary dependency chains.</p></div></article>
        </div>
      </section>

      <section className="section about-section" id="about">
        <div className="about-orbit" aria-hidden="true">
          <span className="orbit-cube">C</span><span className="orbit-ring ring-one" /><span className="orbit-ring ring-two" />
          <i className="orbit-dot dot-one" /><i className="orbit-dot dot-two" /><i className="orbit-dot dot-three" />
        </div>
        <div className="about-copy">
          <p className="section-kicker">Behind the blocks</p><h2>Independent builds,<br /><span>serious standards.</span></h2>
          <p>Cheddah Development is my home for public Minecraft plugins: practical tools, playful mechanics, and thoughtful server experiences built to be shared.</p>
          <p>Every release is shaped by hands-on server experience and a simple rule: earn the admin’s trust.</p>
          <div className="about-actions">
            <a className="button button-primary" href="https://github.com/Cheddah01" target="_blank" rel="noreferrer">Find me on GitHub <span>↗</span></a>
            <a className="button button-ghost" href="https://modrinth.com/plugin/waveback" target="_blank" rel="noreferrer">Modrinth</a>
          </div>
        </div>
      </section>

      <footer>
        <a className="brand" href="#top" aria-label="Back to the top"><span className="brand-block" aria-hidden="true">🧀</span><span>CHEDDAH<span className="brand-muted">.DEV</span></span></a>
        <p>Independent Minecraft development · Built one block at a time.</p>
        <div><a href="#top">Back to top ↑</a><a href="https://github.com/Cheddah01" target="_blank" rel="noreferrer">GitHub ↗</a></div>
      </footer>
    </main>
  );
}
