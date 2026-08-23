"use client";

import Image from "next/image";
import { useState } from "react";
import type { FormEvent } from "react";
import { itemLabel, itemOptions, maxItemsPerBuild } from "../_lib/build-data";
import { useDialogA11y } from "../_hooks/use-dialog-a11y";
import type { CreateBuildPayload } from "../_lib/api-types";
import type { HeroOption } from "../_lib/types";

/** Mirrors CreateBuildDto on the API: @Length(3, 80) on the title. */
const minTitleLength = 3;
const maxTitleLength = 80;

type AddBuildDialogProps = {
  heroes: HeroOption[];
  onClose: () => void;
  onSubmit: (payload: Omit<CreateBuildPayload, "author">) => Promise<void>;
};

export function AddBuildDialog({ heroes, onClose, onSubmit }: AddBuildDialogProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const dialogRef = useDialogA11y<HTMLElement>(onClose);

  const toggleItem = (item: string) => {
    setError(null);
    setSelectedItems((current) => {
      if (current.includes(item)) return current.filter((value) => value !== item);
      return current.length < maxItemsPerBuild ? [...current, item] : current;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;

    const formData = new FormData(event.currentTarget);
    const heroId = String(formData.get("hero") ?? "");
    const title = String(formData.get("title") ?? "").trim();

    if (!heroes.some((hero) => hero.id === heroId)) return setError("Выберите героя.");
    if (title.length < minTitleLength) return setError(`Название должно быть не короче ${minTitleLength} символов.`);
    if (selectedItems.length === 0) return setError("Выберите хотя бы один предмет.");

    setIsSaving(true);
    setError(null);
    try {
      await onSubmit({ heroId, title, items: selectedItems });
    } catch {
      setError("Не удалось сохранить билд. Попробуйте ещё раз.");
      setIsSaving(false);
    }
  };

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} className="add-build-dialog" role="dialog" aria-modal="true" aria-labelledby="add-build-title" aria-describedby="add-build-description" tabIndex={-1}>
        <div className="dialog-heading"><div><span className="eyebrow">Новая сборка</span><h2 id="add-build-title">Добавить билд</h2><p id="add-build-description">Придумайте название и выберите предметы.</p></div><button type="button" onClick={onClose} aria-label="Закрыть форму">×</button></div>
        <form onSubmit={handleSubmit}>
          <label className="form-field"><span>Герой</span><select name="hero" defaultValue={heroes[0]?.id} required>{heroes.map((hero) => <option key={hero.id} value={hero.id}>{hero.hero}</option>)}</select></label>
          <label className="form-field"><span>Название</span><input name="title" type="text" minLength={minTitleLength} maxLength={maxTitleLength} placeholder="Придумайте название сборки" required onChange={() => setError(null)} /></label>
          <fieldset className="item-picker"><legend>Предметы <small>от 1 до {maxItemsPerBuild}</small></legend><div>{itemOptions.map((item) => {
            const selected = selectedItems.includes(item);
            const limitReached = selectedItems.length >= maxItemsPerBuild && !selected;
            return <button key={item} className={selected ? "selected" : ""} type="button" onClick={() => toggleItem(item)} aria-pressed={selected} aria-label={`${selected ? "Убрать" : "Выбрать"} предмет ${itemLabel(item)}`} disabled={limitReached}><Image src={`/assets/items/${item}.png`} alt="" width={88} height={64} unoptimized /></button>;
          })}</div></fieldset>
          {error && <p className="sr-only" role="alert">{error}</p>}
          <div className="dialog-actions"><span>{selectedItems.length}{`/${maxItemsPerBuild} предметов`}</span><button className="cancel-button" type="button" onClick={onClose}>Отмена</button><button className="submit-build-button" type="submit" disabled={selectedItems.length === 0 || isSaving}>Добавить билд</button></div>
        </form>
      </section>
    </div>
  );
}
