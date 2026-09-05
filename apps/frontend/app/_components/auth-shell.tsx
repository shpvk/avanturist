import Link from "next/link";

/** Общая рамка страниц входа: карточка по центру и ссылка домой. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link className="auth-home" href="/">BuildVerdict</Link>
        <h1 className="auth-title">{title}</h1>
        {subtitle ? <p className="auth-subtitle">{subtitle}</p> : null}
        {children}
        {footer ? <p className="auth-footer">{footer}</p> : null}
      </section>
    </main>
  );
}
