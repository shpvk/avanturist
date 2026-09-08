import Link from "next/link";

export function LandingHeader() {
  return (
    <header className="topbar landing-topbar">
      <div className="topbar-inner">
        <Link className="wordmark" href="/" aria-label="BuildVerdict — home">
          build<span>verdict</span>
        </Link>
        <nav className="header-nav" aria-label="Landing sections">
          <a className="header-nav-item" href="#premise">Premise</a>
          <a className="header-nav-item" href="#how">How it works</a>
          <a className="header-nav-item" href="#rules">Rules</a>
          <a className="header-nav-item" href="#faq">FAQ</a>
        </nav>
        <div className="header-actions">
          <Link className="primary-button" href="/app">Open the app</Link>
        </div>
      </div>
    </header>
  );
}
