"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { DragEvent, FormEvent } from "react";
import { BuildInventoryEditor, startItemDrag } from "./build-inventory-editor";
import { itemOptions } from "../_lib/build-data";
import { addItem, canAdd, clearSlot, dedicatedSlot, emptySlots, fromSlots, placeInSlot } from "../_lib/inventory";
import type { Slots } from "../_lib/inventory";
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
  const isUnique = dedicatedSlot(item.id) !== null;

  const handleDragStart = (event: DragEvent) => {
    if (isDisabled) return event.preventDefault();
    startItemDrag(event.dataTransfer, item.id, null);
  };

  return (
    <button
      className={isSelected ? "selected" : ""}
      type="button"
      draggable={!isDisabled}
      onDragStart={handleDragStart}
      onClick={() => onPick(item.id)}
      aria-pressed={isUnique ? isSelected : undefined}
      aria-label={`${isUnique && isSelected ? "Remove" : "Add"} the item ${item.name}`}
      title={item.cost > 0 ? `${item.name} — ${item.cost}` : item.name}
      disabled={isDisabled}
    >
      <Image src={item.image} alt="" width={88} height={64} loading="lazy" unoptimized />
    </button>
  );
}

export function AddBuildDialog({ heroes, onClose, onSubmit }: AddBuildDialogProps) {
  const [slots, setSlots] = useState<Slots>(emptySlots);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<ShopTab>("upgrades");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const dialogRef = useDialogA11y<HTMLElement>(onClose);

  const isSearching = query.trim() !== "";
  const found = useMemo(() => searchShop(itemOptions, query), [query]);
  const sections = useMemo(() => shopSections(itemOptions, tab), [tab]);

  const selectedItems = fromSlots(slots);

  const pickItem = (item: string) => {
    setError(null);
    setSlots((current) => {
      const dedicated = dedicatedSlot(item);
      if (dedicated !== null && current[dedicated] === item) return clearSlot(current, dedicated);
      return addItem(current, item);
    });
  };

  const placeAt = (item: string, slot: number, from: number | null) => {
    setError(null);
    setSlots((current) => placeInSlot(current, item, slot, from));
  };

  const removeAt = (slot: number) => {
    setError(null);
    setSlots((current) => clearSlot(current, slot));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;

    const formData = new FormData(event.currentTarget);
    const heroId = String(formData.get("hero") ?? "");
    const title = String(formData.get("title") ?? "").trim();

    if (!heroes.some((hero) => hero.id === heroId)) return setError("Pick a hero.");
    if (title.length < minTitleLength) return setError(`The name must be at least ${minTitleLength} characters long.`);
    if (selectedItems.length === 0) return setError("Pick at least one item.");

    setIsSaving(true);
    setError(null);
    try {
      await onSubmit({ heroId, title, items: selectedItems });
    } catch {
      setError("Could not save the build. Please try again.");
      setIsSaving(false);
    }
  };

  const renderItem = (item: DotaItem) => (
    <ShopItem
      key={item.id}
      item={item}
      isSelected={selectedItems.includes(item.id)}
      isDisabled={!canAdd(slots, item.id)}
      onPick={pickItem}
    />
  );

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} className="add-build-dialog" role="dialog" aria-modal="true" aria-labelledby="add-build-title" aria-describedby="add-build-description" tabIndex={-1}>
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">New build</span>
            <h2 id="add-build-title">Add a build</h2>
            <p id="add-build-description">Drag items from the shop into the inventory, or just click them.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close the form">×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="add-build-columns">
            <div className="add-build-side">
              <label className="form-field"><span>Hero</span><select name="hero" defaultValue={heroes[0]?.id} required>{heroes.map((hero) => <option key={hero.id} value={hero.id}>{hero.hero}</option>)}</select></label>
              <label className="form-field"><span>Name</span><input name="title" type="text" minLength={minTitleLength} maxLength={maxTitleLength} placeholder="Give the build a name" required onChange={() => setError(null)} /></label>
              <div className="build-preview">
                <span className="section-label">The build</span>
                <BuildInventoryEditor slots={slots} onDropItem={placeAt} onClear={removeAt} />
                <p className="build-preview-hint">{selectedItems.length > 0 ? "Click an item to remove it." : "The inventory is empty — drag items in here."}</p>
              </div>
            </div>

            <fieldset className="item-shop">
              <legend>Shop</legend>
              <div className="item-shop-search">
                <span className="search-icon" aria-hidden="true" />
                <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") event.preventDefault(); }} placeholder="Search items" aria-label="Search items" />
              </div>
              <div className="item-shop-tabs" role="tablist" aria-label="Shop shelves">
                {shopTabs.map((option) => (
                  <button key={option.value} className={option.value === tab && !isSearching ? "selected" : ""} type="button" role="tab" aria-selected={option.value === tab && !isSearching} onClick={() => { setTab(option.value); setQuery(""); }}>{option.label}</button>
                ))}
              </div>
              <div className="item-shop-shelves">
                {isSearching ? (
                  found.length > 0
                    ? <div className="item-shop-shelf"><div className="item-shop-grid">{found.map(renderItem)}</div></div>
                    : <p className="item-picker-empty">Nothing found — try a different name.</p>
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
            <button className="cancel-button" type="button" onClick={onClose}>Cancel</button>
            <button className="submit-build-button" type="submit" disabled={selectedItems.length === 0 || isSaving}>Add build</button>
          </div>
        </form>
      </section>
    </div>
  );
}
