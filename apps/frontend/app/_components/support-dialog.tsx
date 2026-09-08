"use client";

import { useDialogA11y } from "../_hooks/use-dialog-a11y";

const supportEmail = "avanturniybuild@gmail.com";
const supportGithub = "https://github.com/shpvk";

export function SupportDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useDialogA11y<HTMLElement>(onClose);

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section
        ref={dialogRef}
        className="settings-dialog support-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-title"
        aria-describedby="support-description"
        tabIndex={-1}
      >
        <div className="dialog-heading">
          <div>
            <h2 id="support-title">Support</h2>
            <p id="support-description">Questions and suggestions.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close support">×</button>
        </div>

        <div className="settings-body">
          <section className="settings-section">
            <h3>Email</h3>
            <p className="settings-hint">
              Questions and suggestions: <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
            </p>
          </section>

          <section className="settings-section">
            <h3>GitHub</h3>
            <p className="settings-hint">
              <a href={supportGithub} target="_blank" rel="noreferrer noopener">{supportGithub}</a>
            </p>
          </section>
        </div>
      </section>
    </div>
  );
}
