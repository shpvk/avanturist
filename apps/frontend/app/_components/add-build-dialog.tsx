"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { DragEvent, FormEvent } from "react";
import { BuildInventoryEditor, itemDragType } from "./build-inventory-editor";
import { itemOptions, maxItemsPerBuild } from "../_lib/build-data";
import { dropItem, inventorySize, placeItem } from "../_lib/inventory";
import { searchShop, shopSections, shopTabs } from "../_lib/shop-order";
import type { ShopTab } from "../_lib/shop-order";
import { useDialogA11y } from "../_hooks/use-dialog-a11y";
import type { CreateBuildPayload } from "../_lib/api-types";
import type { DotaItem } from "../_lib/dota-items";
import type { HeroOption } from "../_lib/types";

const minTitleLength = 3;
const maxTitleLength = 80;

type AddBuildDialogProps = {
  heroes: HeroOption[];
  onClose: () => void;
  onSubmit: (payload: CreateBuildPayload) => Promise<void>;
};

type ShopItemProps = {
  item: DotaItem;
  isSelected: boolean;
  isDisabled: boolean;
  onPick: (item: string) => void;
};

function ShopItem({ item, isSelected, isDisabled, onPick }: ShopItemProps) {
  const handleDragStart = (event: DragEvent) => {
    if (isDisabled) return event.preventDefault();
    event.dataTransfer.setData(itemDragType, item.id);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <button
      className={isSelected ? "selected" : ""}
      type="button"
      draggable={!isDisabled}
      onDragStart={handleDragStart}
      onClick={() => onPick(item.id)}
      aria-pressed={isSelected}
      aria-label={`${isSelected ? "Убрать" : "Добавить"} предмет ${item.name}`}
      title={item.cost > 0 ? `${item.name} — ${item.cost}` : item.name}
      disabled={isDisabled}
    >
      <Image src={item.image} alt="" width={88} height={64} loading="lazy" unoptimized />
    </button>
  );
}

export function AddBuildDialog({ heroes, onClose, onSubmit }: AddBuildDialogProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<ShopTab>("basics");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const dialogRef = useDialogA11y<HTMLElement>(onClose);

  const isSearching = query.trim() !== "";
  const found = useMemo(() => searchShop(itemOptions, query), [query]);
  const sections = useMemo(() => shopSections(itemOptions, tab), [tab]);

  const taken = inventorySize(selectedItems);
  const isFull = taken >= maxItemsPerBuild;

  const pickItem = (item: string) => {
    setError(null);
    setSelectedItems((current) => {
      if (current.includes(item)) return dropItem(current, item);
      return inventorySize(current) < maxItemsPerBuild ? [...current, item] : current;
    });
  };

  const placeAt = (item: string, slot: number) => {
    setError(null);
    setSelectedItems((current) => {
      if (!current.includes(item) && inventorySize(current) >= maxItemsPerBuild) return current;
      return placeItem(current, item, slot);
    });
  };

  const removeItem = (item: string) => {
    setError(null);
    setSelectedItems((current) => dropItem(current, item));
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

  const renderItem = (item: DotaItem) => (
    <ShopItem
      key={item.id}
      item={item}
      isSelected={selectedItems.includes(item.id)}
      isDisabled={isFull && !selectedItems.includes(item.id)}
      onPick={pickItem}
    />
  );

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} className="add-build-dialog" role="dialog" aria-modal="true" aria-labelledby="add-build-title" aria-describedby="add-build-description" tabIndex={-1}>
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">Новая сборка</span>
            <h2 id="add-build-title">Добавить билд</h2>
            <p id="add-build-description">Перетащите предметы из магазина в инвентарь или нажмите на них.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Закрыть форму">×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="add-build-columns">
            <div className="add-build-side">
              <label className="form-field"><span>Герой</span><select name="hero" defaultValue={heroes[0]?.id} required>{heroes.map((hero) => <option key={hero.id} value={hero.id}>{hero.hero}</option>)}</select></label>
              <label className="form-field"><span>Название</span><input name="title" type="text" minLength={minTitleLength} maxLength={maxTitleLength} placeholder="Придумайте название сборки" required onChange={() => setError(null)} /></label>
              <div className="build-preview">
                <span className="section-label">Сборка</span>
                <BuildInventoryEditor items={selectedItems} onDropItem={placeAt} onRemove={removeItem} />
                <p className="build-preview-hint">{taken > 0 ? "Нажмите на предмет, чтобы убрать его." : "Инвентарь пуст — перетащите сюда предметы."}</p>
              </div>
            </div>

            <fieldset className="item-shop">
              <legend>Магазин</legend>
              <div className="item-shop-search">
                <span className="search-icon" aria-hidden="true" />
                <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") event.preventDefault(); }} placeholder="Поиск предмета" aria-label="Поиск предмета" />
              </div>
              <div className="item-shop-tabs" role="tablist" aria-label="Полки магазина">
                {shopTabs.map((option) => (
                  <button key={option.value} className={option.value === tab && !isSearching ? "selected" : ""} type="button" role="tab" aria-selected={option.value === tab && !isSearching} onClick={() => { setTab(option.value); setQuery(""); }}>{option.label}</button>
                ))}
              </div>
              <div className="item-shop-shelves">
                {isSearching ? (
                  found.length > 0
                    ? <div className="item-shop-shelf"><div className="item-shop-grid">{found.map(renderItem)}</div></div>
                    : <p className="item-picker-empty">Ничего не нашлось — попробуйте другое название.</p>
                ) : sections.map((section) => (
                  <div className="item-shop-shelf" key={section.key}>
                    <span className="section-label">{section.label}</span>
                    <div className="item-shop-grid">{section.items.map(renderItem)}</div>
                  </div>
                ))}
              </div>
            </fieldset>
          </div>
          {error && <p className="sr-only" role="alert">{error}</p>}
          <div className="dialog-actions">
            <span>{taken}{`/${maxItemsPerBuild} предметов`}</span>
            <button className="cancel-button" type="button" onClick={onClose}>Отмена</button>
            <button className="submit-build-button" type="submit" disabled={selectedItems.length === 0 || isSaving}>Добавить билд</button>
          </div>
        </form>
      </section>
    </div>
  );
}
