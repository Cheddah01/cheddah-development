'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PluginCatalog from './plugin-catalog';

export default function Home() {
  const [isNight, setIsNight] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const shouldUseNight = window.localStorage.getItem('cheddah-theme') === 'night';
      document.documentElement.classList.toggle('night', shouldUseNight);
      setIsNight(shouldUseNight);
    });

    return () => window.cancelAnimationFrame(frame);
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
          <Link href="/plugins/">Plugins</Link><a href="#approach">Approach</a><a href="#about">About</a>
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
            <Link className="button button-primary" href="/plugins/">Explore plugins</Link>
            <a className="button button-secondary" href="https://github.com/Cheddah01" target="_blank" rel="noreferrer">View GitHub</a>
          </div>
        </div>

        <div className="hero-console" aria-label="Cheddah Development release standards">
          <div className="hero-console-top">
            <span className="hero-card-icon" aria-hidden="true">🧰</span>
            <span className="hero-console-badge"><i /> Release standard</span>
          </div>
          <div className="hero-console-heading">
            <p className="mini-label">Built for public servers</p>
            <h2>Small setup.<br /><span>Serious server polish.</span></h2>
            <p>Thoughtful defaults up front, dependable behavior everywhere else.</p>
          </div>
          <div className="server-details">
            <article>
              <span aria-hidden="true">01</span>
              <div><strong>Modern foundations</strong><small>Paper-first APIs and Java 25.</small></div>
            </article>
            <article>
              <span aria-hidden="true">02</span>
              <div><strong>Safe integrations</strong><small>Optional hooks stay optional.</small></div>
            </article>
            <article>
              <span aria-hidden="true">03</span>
              <div><strong>Clear admin experience</strong><small>Useful defaults, messages, and docs.</small></div>
            </article>
          </div>
          <div className="hero-console-footer">
            <span>Public-server ready</span><span>Built by Cheddah</span>
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

        <PluginCatalog compact limit={2} />
        <div className="catalog-more">
          <Link className="button button-secondary" href="/plugins/">View the full plugin catalog <span>→</span></Link>
        </div>
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
