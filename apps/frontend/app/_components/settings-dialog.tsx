"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { PasswordField } from "./password-field";
import { useAuth } from "../_hooks/use-auth";
import { useDialogA11y } from "../_hooks/use-dialog-a11y";
import { avatarUrl } from "../_lib/avatars";
import { changeEmail, changePassword, removeAvatar, updateDisplayName, uploadAvatar } from "../_lib/auth-api";

const maxDisplayNameLength = 40;

type SectionState = {
  isBusy: boolean;
  error: string | null;
  note: string | null;
};

const idleSection: SectionState = { isBusy: false, error: null, note: null };

async function run(
  setState: (state: SectionState) => void,
  action: () => Promise<string>,
): Promise<void> {
  setState({ isBusy: true, error: null, note: null });

  try {
    setState({ isBusy: false, error: null, note: await action() });
  } catch (cause) {
    setState({
      isBusy: false,
      error: cause instanceof Error ? cause.message : "Could not save the changes.",
      note: null,
    });
  }
}

function SectionStatus({ state }: { state: SectionState }) {
  if (state.error) return <p className="settings-error" role="alert">{state.error}</p>;
  if (state.note) return <p className="settings-note" role="status">{state.note}</p>;

  return null;
}

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const { user, setUser } = useAuth();
  const dialogRef = useDialogA11y<HTMLElement>(onClose);
  const fileRef = useRef<HTMLInputElement>(null);

  const [avatarState, setAvatarState] = useState(idleSection);
  const [nameState, setNameState] = useState(idleSection);
  const [emailState, setEmailState] = useState(idleSection);
  const [passwordState, setPasswordState] = useState(idleSection);

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [email, setEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");

  if (!user) return null;

  const pickFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    void run(setAvatarState, async () => {
      const picture = await uploadAvatar(file);
      setUser({ ...user, picture });

      return "Avatar updated.";
    });
  };

  const dropAvatar = () =>
    void run(setAvatarState, async () => {
      await removeAvatar();
      setUser({ ...user, picture: null });

      return "Avatar removed.";
    });

  const saveDisplayName = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    void run(setNameState, async () => {
      setUser(await updateDisplayName(displayName.trim()));

      return "Display name updated.";
    });
  };

  const saveEmail = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    void run(setEmailState, async () => {
      const response = await changeEmail({ email: email.trim(), currentPassword: emailPassword });
      setUser(response.user);
      setEmail("");
      setEmailPassword("");

      return response.verificationEmailSent
        ? `Email changed. A confirmation message has been sent to ${response.user.email}.`
        : "Email changed, but the confirmation message could not be sent — request it again later.";
    });
  };

  const savePassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    void run(setPasswordState, async () => {
      setUser(await changePassword({ currentPassword, password, passwordRepeat }));
      setCurrentPassword("");
      setPassword("");
      setPasswordRepeat("");

      return "Password updated. Other devices have been signed out.";
    });
  };

  const isNameDirty = displayName.trim() !== user.displayName && displayName.trim().length >= 2;

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section
        ref={dialogRef}
        className="settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        aria-describedby="settings-description"
        tabIndex={-1}
      >
        <div className="dialog-heading">
          <div>
            <h2 id="settings-title">Settings</h2>
            <p id="settings-description">Your display name, avatar, email and password.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close settings">×</button>
        </div>

        <div className="settings-body">
          <section className="settings-section">
            <h3>Avatar</h3>
            <div className="settings-avatar">
              {user.picture
                ? <Image className="settings-avatar-preview" src={avatarUrl(user.picture)} alt="" width={72} height={72} unoptimized />
                : <span className="settings-avatar-preview settings-avatar-empty" aria-hidden="true">{user.displayName.slice(0, 1).toUpperCase()}</span>}
              <div className="settings-avatar-actions">
                <input ref={fileRef} className="settings-file" type="file" accept="image/png,image/jpeg,image/webp" onChange={pickFile} />
                <button className="auth-submit" type="button" disabled={avatarState.isBusy} onClick={() => fileRef.current?.click()}>
                  {avatarState.isBusy ? "Uploading…" : "Upload"}
                </button>
                {user.picture && (
                  <button className="cancel-button" type="button" disabled={avatarState.isBusy} onClick={dropAvatar}>Remove</button>
                )}
                <p className="settings-hint">PNG, JPEG or WebP, up to 2 MB.</p>
              </div>
            </div>
            <SectionStatus state={avatarState} />
          </section>

          <form className="settings-section" onSubmit={saveDisplayName} noValidate>
            <h3>Display name</h3>
            <label className="auth-field" htmlFor="settings-name">
              <span className="auth-label">How others see you</span>
              <span className="auth-input-wrap">
                <input
                  id="settings-name"
                  type="text"
                  value={displayName}
                  maxLength={maxDisplayNameLength}
                  autoComplete="nickname"
                  required
                  onChange={(event) => setDisplayName(event.target.value)}
                />
              </span>
            </label>
            <SectionStatus state={nameState} />
            <button className="auth-submit" type="submit" disabled={nameState.isBusy || !isNameDirty}>
              {nameState.isBusy ? "Saving…" : "Save name"}
            </button>
          </form>

          <form className="settings-section" onSubmit={saveEmail} noValidate>
            <h3>Email</h3>
            <p className="settings-hint">Current: <strong>{user.email}</strong>{user.isVerified ? "" : " — not confirmed"}</p>
            <label className="auth-field" htmlFor="settings-email">
              <span className="auth-label">New email</span>
              <span className="auth-input-wrap">
                <input
                  id="settings-email"
                  type="email"
                  value={email}
                  autoComplete="email"
                  required
                  onChange={(event) => setEmail(event.target.value)}
                />
              </span>
            </label>
            <PasswordField
              id="settings-email-password"
              label="Current password"
              value={emailPassword}
              autoComplete="current-password"
              onChange={setEmailPassword}
            />
            <p className="settings-hint">A confirmation message goes to the new address. Until you confirm it, commenting and publishing builds stay closed.</p>
            <SectionStatus state={emailState} />
            <button className="auth-submit" type="submit" disabled={emailState.isBusy || !email.trim() || !emailPassword}>
              {emailState.isBusy ? "Changing email…" : "Change email"}
            </button>
          </form>

          <form className="settings-section" onSubmit={savePassword} noValidate>
            <h3>Password</h3>
            <PasswordField
              id="settings-current-password"
              label="Current password"
              value={currentPassword}
              autoComplete="current-password"
              onChange={setCurrentPassword}
            />
            <PasswordField
              id="settings-new-password"
              label="New password"
              value={password}
              autoComplete="new-password"
              onChange={setPassword}
            />
            <PasswordField
              id="settings-repeat-password"
              label="Repeat the new password"
              value={passwordRepeat}
              autoComplete="new-password"
              onChange={setPasswordRepeat}
            />
            <SectionStatus state={passwordState} />
            <button
              className="auth-submit"
              type="submit"
              disabled={passwordState.isBusy || !currentPassword || password.length < 8 || password !== passwordRepeat}
            >
              {passwordState.isBusy ? "Changing password…" : "Change password"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
