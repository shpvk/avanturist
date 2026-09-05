"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useDialogA11y } from "../_hooks/use-dialog-a11y";
import { formatMinutes } from "../_lib/format";
import type { MutePayload } from "../_lib/api-types";

/** Совпадает с `@Max` в MuteUserDto: дольше года мут выдаётся бессрочным. */
const maxMuteMinutes = 525_600;
const maxReasonLength = 200;

/** Пресеты — только ускорение. Настоящий срок задаётся полем «другой срок». */
const presets = [
  { id: "1h", label: "1 час", minutes: 60 },
  { id: "6h", label: "6 часов", minutes: 360 },
  { id: "1d", label: "Сутки", minutes: 1_440 },
  { id: "7d", label: "7 дней", minutes: 10_080 },
  { id: "30d", label: "30 дней", minutes: 43_200 },
  { id: "forever", label: "Бессрочно", minutes: null },
] as const;

const units = [
  { id: "minutes", label: "минут", factor: 1 },
  { id: "hours", label: "часов", factor: 60 },
  { id: "days", label: "дней", factor: 1_440 },
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

  /** `null` — бессрочно, `undefined` — введённый срок не годится. */
  const minutes = useMemo<number | null | undefined>(() => {
    if (!isCustom) return presets.find((preset) => preset.id === selected)?.minutes ?? null;

    const value = Number(customValue);
    if (!Number.isInteger(value) || value < 1) return undefined;

    const factor = units.find((unit) => unit.id === customUnit)?.factor ?? 1;
    const total = value * factor;

    return total > maxMuteMinutes ? undefined : total;
  }, [customUnit, customValue, isCustom, selected]);

  /** Длительность, а не дата: точный срок автор увидит в бейдже после мута. */
  const duration = useMemo(() => {
    if (minutes === undefined) return null;
    return minutes === null ? "бессрочно" : `на ${formatMinutes(minutes)}`;
  }, [minutes]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;

    if (minutes === undefined) {
      setError(`Срок — целое число от 1 минуты до года (${maxMuteMinutes} минут). Дольше — это «Бессрочно».`);
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
      setError("Не удалось выдать мут. Попробуйте ещё раз.");
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
            <h2 id="mute-title">Мут для {author}</h2>
            <p id="mute-description">Закрывает только комментарии. Оценивать билды и публиковать сборки автор сможет.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Закрыть форму">×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <fieldset className="mute-durations">
            <legend>Срок</legend>
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
                Другой срок
              </button>
            </div>
          </fieldset>
          {isCustom && (
            <div className="mute-custom">
              <label className="form-field">
                <span>Сколько</span>
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
                <span>Единицы</span>
                <select value={customUnit} onChange={(event) => setCustomUnit(event.target.value as UnitId)}>
                  {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.label}</option>)}
                </select>
              </label>
            </div>
          )}
          <label className="form-field">
            <span>Причина <small>необязательно, её увидит автор</small></span>
            <input
              name="reason"
              type="text"
              maxLength={maxReasonLength}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Например: оскорбления в ветке"
            />
          </label>
          <p className="mute-preview" aria-live="polite">
            {duration ? `Комментарии закроются ${duration}.` : "Укажите срок в пределах года или выберите «Бессрочно»."}
          </p>
          {error && <p className="dialog-error" role="alert">{error}</p>}
          <div className="dialog-actions">
            <button className="cancel-button" type="button" onClick={onClose}>Отмена</button>
            <button className="submit-build-button" type="submit" disabled={isSaving || minutes === undefined}>
              {isSaving ? "Выдаём мут…" : "Замутить"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
