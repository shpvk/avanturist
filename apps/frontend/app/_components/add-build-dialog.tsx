"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { itemCategoryOptions, itemImage, itemLabel, itemOptions, maxItemsPerBuild } from "../_lib/build-data";
import { filterItems } from "../_lib/item-filter";
import { useDialogA11y } from "../_hooks/use-dialog-a11y";
import type { CreateBuildPayload } from "../_lib/api-types";
import type { HeroOption, ItemFilter } from "../_lib/types";

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
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ItemFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const dialogRef = useDialogA11y<HTMLElement>(onClose);

  // The catalog is the whole Dota shop, so the grid only ever renders the current slice.
  const visibleItems = useMemo(() => filterItems(itemOptions, { query, category }), [query, category]);

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
          <fieldset className="item-picker">
            <legend>Предметы <small>от 1 до {maxItemsPerBuild}</small></legend>
            <div className="item-picker-filters">
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") event.preventDefault(); }} placeholder="Поиск предмета" aria-label="Поиск предмета" />
              <div className="item-categories" role="group" aria-label="Категории предметов">{itemCategoryOptions.map((option) => (
                <button key={option.value} className={option.value === category ? "selected" : ""} type="button" aria-pressed={option.value === category} onClick={() => setCategory(option.value)}>{option.label}</button>
              ))}</div>
            </div>
            {selectedItems.length > 0 && (
              // Chosen items stay in reach even after the search moves their icon out of the grid.
              <ul className="item-picker-selected">{selectedItems.map((item) => (
                <li key={item}><button type="button" onClick={() => toggleItem(item)} aria-label={`Убрать предмет ${itemLabel(item)}`}><Image src={itemImage(item)} alt="" width={88} height={64} unoptimized />{itemLabel(item)}<span aria-hidden="true">×</span></button></li>
              ))}</ul>
            )}
            <div className="item-picker-grid">{visibleItems.map((item) => {
              const selected = selectedItems.includes(item.id);
              const limitReached = selectedItems.length >= maxItemsPerBuild && !selected;
              return <button key={item.id} className={selected ? "selected" : ""} type="button" onClick={() => toggleItem(item.id)} aria-pressed={selected} aria-label={`${selected ? "Убрать" : "Выбрать"} предмет ${item.name}`} title={item.name} disabled={limitReached}><Image src={item.image} alt="" width={88} height={64} loading="lazy" unoptimized /></button>;
            })}</div>
            {visibleItems.length === 0 && <p className="item-picker-empty">Ничего не нашлось — попробуйте другое название.</p>}
          </fieldset>
          {error && <p className="sr-only" role="alert">{error}</p>}
          <div className="dialog-actions"><span>{selectedItems.length}{`/${maxItemsPerBuild} предметов`}</span><button className="cancel-button" type="button" onClick={onClose}>Отмена</button><button className="submit-build-button" type="submit" disabled={selectedItems.length === 0 || isSaving}>Добавить билд</button></div>
        </form>
      </section>
    </div>
  );
}
