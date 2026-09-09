"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AccountMenu } from "./account-menu";
import { useAuth } from "../_hooks/use-auth";
import { VerificationBanner } from "./verification-banner";
import type { View } from "../_lib/types";

type SiteHeaderProps = {
  view?: View;
  onViewChange?: (view: View) => void;
  onAddBuild?: () => void;
};

export function SiteHeader({ view, onViewChange, onAddBuild }: SiteHeaderProps) {
  const { user } = useAuth();

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <HeaderControl className="wordmark" href="/app" onClick={onViewChange && (() => onViewChange("random"))} label="BuildVerdict — home">
            build<span>verdict</span>
          </HeaderControl>
          <nav className="header-nav" aria-label="Main sections">
            <HeaderControl
              className={`header-nav-item${view === "all" ? " active" : ""}`}
              href="/app"
              onClick={onViewChange && (() => onViewChange("all"))}
              label="All builds"
              pressed={onViewChange ? view === "all" : undefined}
            >
              Builds
            </HeaderControl>
            {user && (
              <HeaderControl className="header-nav-item" href="/app?add=1" onClick={onAddBuild}>
                Add build
              </HeaderControl>
            )}
          </nav>
          <div className="header-actions">
            <AccountMenu />
          </div>
        </div>
      </header>
      <VerificationBanner />
    </>
  );
}

type HeaderControlProps = {
  className: string;
  href: string;
  onClick?: (() => void) | false;
  label?: string;
  pressed?: boolean;
  children: ReactNode;
};

function HeaderControl({ className, href, onClick, label, pressed, children }: HeaderControlProps) {
  if (onClick) {
    return (
      <button className={className} type="button" aria-label={label} aria-pressed={pressed} onClick={onClick}>
        {children}
      </button>
    );
  }

  return (
    <Link className={className} href={href} aria-label={label}>
      {children}
    </Link>
  );
}
