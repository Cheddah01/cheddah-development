'use client';

import { useEffect } from 'react';

const plugins = [
  {
    name: 'WaveBack', mark: 'W', tone: 'mint', label: 'Community', featured: true,
    description: 'Turn “welcome back” into a real server moment with custom joins, greeting rewards, leaderboards, and anti-farming controls.',
    tags: ['Paper', 'Rewards', 'MiniMessage'], github: 'https://github.com/Cheddah01/WaveBack', download: 'https://modrinth.com/plugin/waveback',
  },
  {
    name: 'BetterBaltop', mark: 'B', tone: 'gold', label: 'Economy',
    description: 'A fast, polished leaderboard GUI for Vault economy and optional PlayerPoints—cached so menus stay responsive.',
    tags: ['Paper 26.2', 'Vault', 'PlayerPoints'], github: 'https://github.com/Cheddah01/Better-Baltop',
  },
  {
    name: 'CozyDisplays', mark: 'D', tone: 'aqua', label: 'World tools',
    description: 'Create, position, style, animate, and safely manage vanilla display entities without a heavyweight hologram suite.',
    tags: ['Paper', 'Displays', 'Admin UX'], github: 'https://github.com/Cheddah01/CozyDisplays',
  },
  {
    name: 'SkinStatues', mark: 'S', tone: 'rose', label: 'Creative',
    description: 'Build towering 3D block statues from any player skin, with modern layers, scaled construction, and safe undo.',
    tags: ['Paper', 'Fabric', 'World editing'], github: 'https://github.com/Cheddah01/Skin-Statues',
  },
  {
    name: 'CozyRaces', mark: 'R', tone: 'blue', label: 'Minigame',
    description: 'A complete boat-racing system with in-game course setup, queues, voting, timing, leaderboards, and rewards.',
    tags: ['Paper', 'Racing', 'Leaderboards'], github: 'https://github.com/Cheddah01/CozyRacesPlugin',
  },
] as const;

export default function Home() {
  useEffect(() => {
    const updatePointer = (event: PointerEvent) => {
      document.documentElement.style.setProperty('--pointer-x', `${event.clientX}px`);
      document.documentElement.style.setProperty('--pointer-y', `${event.clientY}px`);
    };
    window.addEventListener('pointermove', updatePointer, { passive: true });
    return () => window.removeEventListener('pointermove', updatePointer);
  }, []);

  return (
    <main>
      <div className="world" aria-hidden="true">
        <div className="pointer-glow" /><div className="world-grid" /><div className="sky-noise" />
        <div className="voxel voxel-one"><i /></div><div className="voxel voxel-two"><i /></div><div className="voxel voxel-three"><i /></div>
      </div>

      <header className="site-header">
        <a className="brand" href="#top" aria-label="Cheddah Development home">
          <span className="brand-block" aria-hidden="true">C</span><span>CHEDDAH<span className="brand-muted">.DEV</span></span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#plugins">Plugins</a><a href="#approach">Approach</a><a href="#about">About</a>
          <a href="https://github.com/Cheddah01" target="_blank" rel="noreferrer">GitHub ↗</a>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span /> Independent Minecraft development</p>
          <h1>Plugins built for the servers <em>players remember.</em></h1>
          <p className="hero-lede">Focused Minecraft plugins with clean setup, sensible defaults, and the polish server owners should expect.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#plugins">Explore the plugins <span>↓</span></a>
            <a className="button button-ghost" href="https://github.com/Cheddah01" target="_blank" rel="noreferrer">View source</a>
          </div>
        </div>

        <div className="hero-console" aria-label="Development principles">
          <div className="console-bar">
            <span><i className="dot dot-red" /><i className="dot dot-yellow" /><i className="dot dot-green" /></span><span>cheddah@paper</span><span>•••</span>
          </div>
          <div className="console-body">
            <p><span className="prompt">$</span> server inspect --quality</p>
            <p className="console-line"><span className="check">✓</span> Strong defaults</p>
            <p className="console-line"><span className="check">✓</span> Safe upgrades</p>
            <p className="console-line"><span className="check">✓</span> Polished player UX</p>
            <p className="console-line"><span className="check">✓</span> Built for modern Paper</p>
            <p className="console-ready"><span className="pulse" /> READY TO SHIP</p>
          </div>
        </div>
      </section>

      <div className="hero-strip" aria-label="Development stack">
        <span>Paper</span><i /><span>Java</span><i /><span>Adventure</span><i /><span>MiniMessage</span><i /><span>Built for public servers</span>
      </div>

      <section className="section plugins-section" id="plugins">
        <div className="section-heading">
          <div><p className="section-kicker">{'// Selected work'}</p><h2>Purpose-built plugins.<br /><span>No kitchen sinks.</span></h2></div>
          <p>Each project starts with one clear server-owner problem and grows only where the player experience benefits.</p>
        </div>

        <div className="plugin-grid">
          {plugins.map((plugin, index) => (
            <article className={`plugin-card ${index === 0 ? 'plugin-featured' : ''}`} key={plugin.name}>
              <div className="card-topline"><span className="card-index">0{index + 1}</span><span className="card-label">{plugin.label}</span></div>
              <div className="card-title-row"><span className={`plugin-mark mark-${plugin.tone}`} aria-hidden="true">{plugin.mark}</span><h3>{plugin.name}</h3></div>
              <p>{plugin.description}</p>
              <div className="tag-row">{plugin.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
              <div className="card-links">
                {'download' in plugin && plugin.download ? <a className="card-primary-link" href={plugin.download} target="_blank" rel="noreferrer">Get on Modrinth <span>↗</span></a> : null}
                <a href={plugin.github} target="_blank" rel="noreferrer">Source & details <span>↗</span></a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section approach-section" id="approach">
        <div className="approach-copy">
          <p className="section-kicker">{'// The build philosophy'}</p><h2>Made for real servers,<br /><span>not feature checklists.</span></h2>
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
          <p className="section-kicker">{'// Behind the blocks'}</p><h2>Independent builds,<br /><span>serious standards.</span></h2>
          <p>Cheddah Development is my home for public Minecraft plugins: practical tools, playful mechanics, and thoughtful server experiences built to be shared.</p>
          <p>Every release is shaped by hands-on server experience and a simple rule: earn the admin’s trust.</p>
          <div className="about-actions">
            <a className="button button-primary" href="https://github.com/Cheddah01" target="_blank" rel="noreferrer">Find me on GitHub <span>↗</span></a>
            <a className="button button-ghost" href="https://modrinth.com/plugin/waveback" target="_blank" rel="noreferrer">Modrinth</a>
          </div>
        </div>
      </section>

      <footer>
        <a className="brand" href="#top"><span className="brand-block" aria-hidden="true">C</span><span>CHEDDAH<span className="brand-muted">.DEV</span></span></a>
        <p>Independent Minecraft development · Built one block at a time.</p>
        <div><a href="#top">Back to top ↑</a><a href="https://github.com/Cheddah01" target="_blank" rel="noreferrer">GitHub ↗</a></div>
      </footer>
    </main>
  );
}
