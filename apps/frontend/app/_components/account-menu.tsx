"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SettingsDialog } from "./settings-dialog";
import { SupportDialog } from "./support-dialog";
import { useAuth } from "../_hooks/use-auth";
import { avatarUrl } from "../_lib/avatars";

function AccountBadge({ displayName, picture }: { displayName: string; picture: string | null }) {
  if (picture) {
    return <Image className="account-avatar" src={avatarUrl(picture)} alt="" width={30} height={30} unoptimized />;
  }

  return <span className="account-avatar" aria-hidden="true">{displayName.slice(0, 1).toUpperCase()}</span>;
}

export function AccountMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("mousedown", closeOnOutside);
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("mousedown", closeOnOutside);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  if (!user) {
    return (
      <Link className="profile-button" href="/profile" aria-label="Profile" title="Profile">
        <span className="person-icon" aria-hidden="true" />
      </Link>
    );
  }

  return (
    <div className="account-menu" ref={menuRef}>
      <button
        className="profile-button"
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Account: ${user.displayName}`}
        title={user.displayName}
        onClick={() => setIsOpen((open) => !open)}
      >
        <AccountBadge displayName={user.displayName} picture={user.picture} />
      </button>
      {isOpen && (
        <div className="account-dropdown" role="menu" aria-label="Account menu">
          <div className="account-dropdown-user">
            <AccountBadge displayName={user.displayName} picture={user.picture} />
            <span>
              <strong>{user.displayName}</strong>
              <small>{user.email}</small>
            </span>
          </div>
          <Link role="menuitem" href={`/users/${user.id}`} onClick={() => setIsOpen(false)}>My profile</Link>
          <button role="menuitem" type="button" onClick={() => { setIsOpen(false); setIsSettingsOpen(true); }}>Settings</button>
          <button role="menuitem" type="button" onClick={() => { setIsOpen(false); setIsSupportOpen(true); }}>Support</button>
          <button className="account-dropdown-exit" role="menuitem" type="button" onClick={() => { setIsOpen(false); void logout(); }}>Log out</button>
        </div>
      )}
      {isSettingsOpen && <SettingsDialog onClose={() => setIsSettingsOpen(false)} />}
      {isSupportOpen && <SupportDialog onClose={() => setIsSupportOpen(false)} />}
    </div>
  );
}
