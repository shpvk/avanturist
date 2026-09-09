import Link from "next/link";

const authorEmail = "shpvkcontact@gmail.com";
const authorGithub = "https://github.com/shpvk";

export function LandingFooter() {
  return (
    <footer className="landing-footer">
      <div className="landing-footer-inner">
        <div className="landing-footer-brand">
          <span className="wordmark">build<span>verdict</span></span>
          <p>A forum for Dota 2 builds that look wrong and might be right.</p>
        </div>
        <nav className="landing-footer-nav" aria-label="Product">
          <span className="label">Product</span>
          <Link href="/app">Random build</Link>
          <Link href="/app">All builds</Link>
          <Link href="/register">Create an account</Link>
          <Link href="/login">Log in</Link>
        </nav>
        <nav className="landing-footer-nav" aria-label="Author">
          <span className="label">Author</span>
          <a href={authorGithub} rel="noreferrer noopener" target="_blank">GitHub</a>
          <a href={`mailto:${authorEmail}`}>Email</a>
        </nav>
      </div>
      <div className="landing-disclaimer">
        <p>
          BuildVerdict is a fan project and is not affiliated with, endorsed by or sponsored by Valve
          Corporation. Dota 2, hero names, hero artwork and item icons are trademarks and copyrighted
          works of Valve Corporation.
        </p>
      </div>
    </footer>
  );
}
