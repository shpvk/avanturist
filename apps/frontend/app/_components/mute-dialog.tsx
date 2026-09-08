"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useDialogA11y } from "../_hooks/use-dialog-a11y";
import { formatMinutes } from "../_lib/format";
import type { MutePayload } from "../_lib/api-types";

const maxMuteMinutes = 525_600;
const maxReasonLength = 200;

const presets = [
  { id: "1h", label: "1 hour", minutes: 60 },
  { id: "6h", label: "6 hours", minutes: 360 },
  { id: "1d", label: "1 day", minutes: 1_440 },
  { id: "7d", label: "7 days", minutes: 10_080 },
  { id: "30d", label: "30 days", minutes: 43_200 },
  { id: "forever", label: "Indefinite", minutes: null },
] as const;

const units = [
  { id: "minutes", label: "minutes", factor: 1 },
  { id: "hours", label: "hours", factor: 60 },
  { id: "days", label: "days", factor: 1_440 },
] as const;

type UnitId = (typeof units)[number]["id"];

type MuteDialogProps = {
  author: string;
  onClose: () => void;
  onSubmit: (payload: MutePayload) => Promise<void>;
};

export function MuteDialog({ author, onClose, onSubmit }: MuteDialogProps) {
  const [selected, setSelected] = useState<string>("1d");
  const [customValue, setCustomValue] = useState("12");
  const [customUnit, setCustomUnit] = useState<UnitId>("hours");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const dialogRef = useDialogA11y<HTMLElement>(onClose);

  const isCustom = selected === "custom";

  const minutes = useMemo<number | null | undefined>(() => {
    if (!isCustom) return presets.find((preset) => preset.id === selected)?.minutes ?? null;

    const value = Number(customValue);
    if (!Number.isInteger(value) || value < 1) return undefined;

    const factor = units.find((unit) => unit.id === customUnit)?.factor ?? 1;
    const total = value * factor;

    return total > maxMuteMinutes ? undefined : total;
  }, [customUnit, customValue, isCustom, selected]);

  const duration = useMemo(() => {
    if (minutes === undefined) return null;
    return minutes === null ? "indefinitely" : `for ${formatMinutes(minutes)}`;
  }, [minutes]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;

    if (minutes === undefined) {
      setError(`The duration must be a whole number between 1 minute and a year (${maxMuteMinutes} minutes). Anything longer is “Indefinite”.`);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSubmit({
        minutes: minutes ?? undefined,
        reason: reason.trim() || undefined,
      });
    } catch {
      setError("Could not apply the mute. Please try again.");
      setIsSaving(false);
    }
  };

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section
        ref={dialogRef}
        className="mute-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mute-title"
        aria-describedby="mute-description"
        tabIndex={-1}
      >
        <div className="dialog-heading">
          <div>
            <h2 id="mute-title">Mute {author}</h2>
            <p id="mute-description">This closes commenting only. The author can still vote on builds and publish their own.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close the form">×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <fieldset className="mute-durations">
            <legend>Duration</legend>
            <div>
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  className={selected === preset.id ? "selected" : ""}
                  type="button"
                  aria-pressed={selected === preset.id}
                  onClick={() => { setSelected(preset.id); setError(null); }}
                >
                  {preset.label}
                </button>
              ))}
              <button
                className={isCustom ? "selected" : ""}
                type="button"
                aria-pressed={isCustom}
                onClick={() => { setSelected("custom"); setError(null); }}
              >
                Custom duration
              </button>
            </div>
          </fieldset>
          {isCustom && (
            <div className="mute-custom">
              <label className="form-field">
                <span>How long</span>
                <input
                  name="custom-value"
                  type="number"
                  min={1}
                  max={maxMuteMinutes}
                  step={1}
                  value={customValue}
                  onChange={(event) => { setCustomValue(event.target.value); setError(null); }}
                />
              </label>
              <label className="form-field">
                <span>Units</span>
                <select value={customUnit} onChange={(event) => setCustomUnit(event.target.value as UnitId)}>
                  {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.label}</option>)}
                </select>
              </label>
            </div>
          )}
          <label className="form-field">
            <span>Reason <small>optional, the author will see it</small></span>
            <input
              name="reason"
              type="text"
              maxLength={maxReasonLength}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="For example: insults in the thread"
            />
          </label>
          <p className="mute-preview" aria-live="polite">
            {duration ? `Commenting will be closed ${duration}.` : "Set a duration within a year or choose “Indefinite”."}
          </p>
          {error && <p className="dialog-error" role="alert">{error}</p>}
          <div className="dialog-actions">
            <button className="cancel-button" type="button" onClick={onClose}>Cancel</button>
            <button className="submit-build-button" type="submit" disabled={isSaving || minutes === undefined}>
              {isSaving ? "Applying mute…" : "Mute"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
