'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PluginCatalog from '../plugin-catalog';

export default function PluginsPage() {
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
    <main className="plugin-page">
      <div className="sky" aria-hidden="true">
        <div className="night-veil" /><div className="stars" />
        <div className="mc-sun" /><div className="mc-moon" />
        <div className="mc-cloud cloud-one" /><div className="mc-cloud cloud-two" />
        <div className="mc-cloud cloud-three" /><div className="mc-cloud cloud-four" />
      </div>

      <header className="site-header">
        <Link className="brand" href="/" aria-label="Cheddah Development home">
          <span className="brand-block" aria-hidden="true">🧀</span><span>Cheddah Development</span>
        </Link>
        <span className="studio-status"><i /> Public plugin studio</span>
        <nav aria-label="Main navigation">
          <Link href="/">Home</Link>
          <Link href="/plugins/" aria-current="page">Plugins</Link>
          <Link href="/#approach">Approach</Link>
          <Link href="/#about">About</Link>
          <a href="https://github.com/Cheddah01" target="_blank" rel="noreferrer">GitHub ↗</a>
        </nav>
        <button className="mode-toggle" type="button" onClick={toggleTheme} aria-label="Toggle day and night mode" aria-pressed={isNight}>
          <span aria-hidden="true">{isNight ? '☀️' : '🌙'}</span>
        </button>
      </header>

      <section className="plugin-page-hero" id="top">
        <div>
          <p className="eyebrow">Public plugin catalog</p>
          <h1>Built for servers that care about the details.</h1>
          <p>Focused Minecraft plugins with clear setup, safe defaults, and polished experiences for administrators and players.</p>
        </div>
        <aside className="plugin-page-note" aria-label="Plugin development standards">
          <span aria-hidden="true">⛏️</span>
          <p className="mini-label">Every public release</p>
          <h2>Ready to install.<br />Ready to trust.</h2>
          <ul>
            <li>Modern Paper support</li>
            <li>Clear documentation</li>
            <li>Direct downloads</li>
          </ul>
        </aside>
      </section>

      <section className="section plugin-page-catalog" aria-labelledby="catalog-title">
        <div className="section-heading">
          <div>
            <p className="section-kicker">All public releases</p>
            <h2 id="catalog-title">Choose a plugin.<br /><span>Make the server better.</span></h2>
          </div>
          <p>Each plugin solves one clear server-owner problem without turning setup into another project.</p>
        </div>

        <PluginCatalog />
      </section>

      <section className="section plugin-page-cta">
        <div>
          <p className="section-kicker">Follow development</p>
          <h2>Want to see what ships next?</h2>
          <p>Source code, development activity, and public releases all live on GitHub.</p>
        </div>
        <a className="button button-primary" href="https://github.com/Cheddah01" target="_blank" rel="noreferrer">
          Visit GitHub <span>↗</span>
        </a>
      </section>

      <footer>
        <Link className="brand" href="/" aria-label="Cheddah Development home">
          <span className="brand-block" aria-hidden="true">🧀</span><span>CHEDDAH<span className="brand-muted">.DEV</span></span>
        </Link>
        <p>Independent Minecraft development · Built one block at a time.</p>
        <div><a href="#top">Back to top ↑</a><Link href="/">Home</Link></div>
      </footer>
    </main>
  );
}
