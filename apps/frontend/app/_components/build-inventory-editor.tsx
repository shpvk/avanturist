"use client";

import Image from "next/image";
import { useState } from "react";
import type { DragEvent } from "react";
import { itemImage, itemLabel } from "../_lib/build-data";
import { mainSlotCount, splitInventory } from "../_lib/inventory";

export const itemDragType = "application/x-dota-item";

const slotPlaceholder: Record<string, string> = { scepter: "ultimate_scepter", shard: "aghanims_shard" };

type SlotProps = {
  item: string | null;
  kind: string;
  slot: number;
  isTarget: boolean;
  onDropItem: (item: string, slot: number) => void;
  onRemove: (item: string) => void;
  onDragStateChange: (slot: number | null) => void;
};

function EditableSlot({ item, kind, slot, isTarget, onDropItem, onRemove, onDragStateChange }: SlotProps) {
  const accept = (event: DragEvent) => {
    const dragged = event.dataTransfer.getData(itemDragType);
    if (!dragged) return;
    event.preventDefault();
    onDragStateChange(null);
    onDropItem(dragged, slot);
  };

  const allow = (event: DragEvent) => {
    if (!event.dataTransfer.types.includes(itemDragType)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    onDragStateChange(slot);
  };

  const className = `inventory-slot ${kind}${item ? "" : " empty"}${isTarget ? " drop-target" : ""}`;

  if (!item) {
    const placeholder = slotPlaceholder[kind];
    return (
      <div className={className} onDragOver={allow} onDragLeave={() => onDragStateChange(null)} onDrop={accept}>
        {placeholder && <Image className="slot-placeholder" src={itemImage(placeholder)} alt="" width={88} height={64} loading="lazy" unoptimized />}
      </div>
    );
  }

  const label = itemLabel(item);

  return (
    <button
      className={className}
      type="button"
      draggable
      title={`${label} — нажмите, чтобы убрать`}
      aria-label={`Убрать предмет ${label}`}
      onClick={() => onRemove(item)}
      onDragStart={(event) => {
        event.dataTransfer.setData(itemDragType, item);
        event.dataTransfer.effectAllowed = "move";
      }}
      onDragEnd={() => onDragStateChange(null)}
      onDragOver={allow}
      onDragLeave={() => onDragStateChange(null)}
      onDrop={accept}
    >
      <Image src={itemImage(item)} alt="" width={88} height={64} loading="lazy" unoptimized />
    </button>
  );
}

type BuildInventoryEditorProps = {
  items: string[];
  onDropItem: (item: string, slot: number) => void;
  onRemove: (item: string) => void;
};

export function BuildInventoryEditor({ items, onDropItem, onRemove }: BuildInventoryEditorProps) {
  const [target, setTarget] = useState<number | null>(null);
  const { main, backpack, scepter, shard, neutral } = splitInventory(items);
  const tail = main.length + backpack.length;

  const slotProps = { isTarget: false, onDropItem, onRemove, onDragStateChange: setTarget };

  return (
    <div className="dota-stage build-inventory-editor">
      <div className="dota-inventory-grid" role="group" aria-label="Сборка">
        <div className="inventory-column aghanims">
          <EditableSlot {...slotProps} item={scepter} kind="scepter" slot={tail} isTarget={target === tail} />
          <EditableSlot {...slotProps} item={shard} kind="shard" slot={tail} isTarget={false} />
        </div>
        <div className="inventory-main">
          {main.map((item, index) => (
            <EditableSlot {...slotProps} key={`main-${index}`} item={item} kind="main" slot={index} isTarget={target === index} />
          ))}
          {backpack.map((item, index) => (
            <EditableSlot
              {...slotProps}
              key={`backpack-${index}`}
              item={item}
              kind="backpack"
              slot={mainSlotCount + index}
              isTarget={target === mainSlotCount + index}
            />
          ))}
        </div>
        <div className="inventory-column">
          <EditableSlot {...slotProps} item={neutral} kind="neutral" slot={tail} isTarget={false} />
        </div>
      </div>
    </div>
  );
}
