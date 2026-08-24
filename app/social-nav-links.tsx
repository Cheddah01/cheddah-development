import Image from 'next/image';

export default function SocialNavLinks() {
  return (
    <span className="social-nav-links" aria-label="Developer and support links">
      <a
        className="nav-icon-link github-link"
        href="https://github.com/Cheddah01"
        target="_blank"
        rel="noreferrer"
        aria-label="Cheddah01 on GitHub"
        title="GitHub"
      >
        <Image src="/github.svg" alt="" width={22} height={22} aria-hidden="true" />
      </a>
      <a
        className="nav-icon-link kofi-link"
        href="https://ko-fi.com/cheddah01"
        target="_blank"
        rel="noreferrer"
        aria-label="Support Cheddah01 on Ko-fi"
        title="Support on Ko-fi"
      >
        <Image src="/kofi.svg" alt="" width={22} height={22} aria-hidden="true" />
      </a>
    </span>
  );
}
