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
  supportUrl: string | null;
  iconLetter: string;
  accentTone: string;
  sortOrder: number;
  updatedAt: string;
};

const COZY_CLAIMS_PLUGIN: PublicPlugin = {
  slug: 'cozy-claims',
  name: 'CozyClaims',
  category: 'Protection',
  summary: 'A polished, menu-driven land protection system with visual claiming, member roles, configurable rules, and native persistence.',
  tags: ['Paper 26.2', 'Java 25', '$8.99'],
  sourceUrl: null,
  downloadUrl: null,
  documentationUrl: 'https://docs.cheddah-development.net/plugin-documentaion/cozy-claims',
  supportUrl: 'https://github.com/Cheddah01/CozyClaims-Issues/issues',
  iconLetter: 'C',
  accentTone: 'mint',
  sortOrder: 5,
  updatedAt: '',
};

const FALLBACK_PLUGINS: PublicPlugin[] = [
  COZY_CLAIMS_PLUGIN,
  {
    slug: 'better-baltop',
    name: 'BetterBaltop',
    category: 'Economy',
    summary: 'A fast, polished leaderboard GUI for Vault economy and optional PlayerPoints—cached so menus stay responsive.',
    tags: ['Paper 26.2', 'Vault', 'PlayerPoints'],
    sourceUrl: 'https://github.com/Cheddah01/Better-Baltop',
    downloadUrl: 'https://modrinth.com/plugin/betterbaltop',
    documentationUrl: 'https://docs.cheddah-development.net/plugin-documentaion/better-baltop',
    supportUrl: null,
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
    supportUrl: null,
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
      supportUrl: safeExternalUrl(plugin.supportUrl),
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

function includeLocalPlugins(plugins: PublicPlugin[]) {
  const slugs = new Set(plugins.map((plugin) => plugin.slug));
  const localPlugins = [COZY_CLAIMS_PLUGIN].filter((plugin) => !slugs.has(plugin.slug));

  return [...plugins, ...localPlugins]
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

export default function PluginCatalog({ compact = false, limit }: { compact?: boolean; limit?: number }) {
  const [plugins, setPlugins] = useState<PublicPlugin[]>(FALLBACK_PLUGINS);

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
          setPlugins(includeLocalPlugins(livePlugins));
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

  const visiblePlugins = typeof limit === 'number' ? plugins.slice(0, limit) : plugins;

  if (visiblePlugins.length === 0) {
    return (
      <div className="plugin-empty-state">
        <span aria-hidden="true">🧰</span>
        <h3>New releases are being prepared.</h3>
        <p>Check back soon for the next public plugin.</p>
      </div>
    );
  }

  return (
    <div className={`plugin-grid${compact ? ' plugin-grid-compact' : ''}`}>
      {visiblePlugins.map((plugin, index) => (
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
            {plugin.supportUrl ? (
              <a href={plugin.supportUrl} target="_blank" rel="noreferrer">
                Support <span>↗</span>
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
  );
}
