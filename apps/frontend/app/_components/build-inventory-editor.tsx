"use client";

import Image from "next/image";
import { useState } from "react";
import type { DragEvent } from "react";
import { itemImage, itemLabel } from "../_lib/build-data";
import {
  backpackSlotCount,
  blessingId,
  canPlace,
  mainSlotCount,
  neutralSlotIndex,
  scepterSlotIndex,
  shardId,
  shardSlotIndex,
  type Slots,
} from "../_lib/inventory";

const itemTypePrefix = "application/x-dota-item/";
const slotTypePrefix = "application/x-dota-slot/";

export function startItemDrag(dataTransfer: DataTransfer, item: string, from: number | null) {
  dataTransfer.setData(`${itemTypePrefix}${item}`, item);
  if (from !== null) dataTransfer.setData(`${slotTypePrefix}${from}`, String(from));
  dataTransfer.effectAllowed = "move";
}

function readItemDrag(types: readonly string[]) {
  const item = types.find((type) => type.startsWith(itemTypePrefix))?.slice(itemTypePrefix.length);
  if (!item) return null;
  const from = types.find((type) => type.startsWith(slotTypePrefix))?.slice(slotTypePrefix.length);
  return { item, from: from === undefined ? null : Number(from) };
}

const slotPlaceholder: Record<string, string> = { scepter: blessingId, shard: shardId };

type SlotProps = {
  item: string | null;
  kind: string;
  slot: number;
  isTarget: boolean;
  onDropItem: (item: string, slot: number, from: number | null) => void;
  onClear: (slot: number) => void;
  onDragStateChange: (slot: number | null) => void;
};

function EditableSlot({ item, kind, slot, isTarget, onDropItem, onClear, onDragStateChange }: SlotProps) {
  const dragged = (event: DragEvent) => {
    const drag = readItemDrag(event.dataTransfer.types);
    return drag && canPlace(drag.item, slot) ? drag : null;
  };

  const accept = (event: DragEvent) => {
    const drag = dragged(event);
    if (!drag) return;
    event.preventDefault();
    onDragStateChange(null);
    onDropItem(drag.item, slot, drag.from);
  };

  const allow = (event: DragEvent) => {
    if (!dragged(event)) return;
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
      title={`${label} — click to remove`}
      aria-label={`Remove the item ${label}`}
      onClick={() => onClear(slot)}
      onDragStart={(event) => startItemDrag(event.dataTransfer, item, slot)}
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
  slots: Slots;
  onDropItem: (item: string, slot: number, from: number | null) => void;
  onClear: (slot: number) => void;
};

export function BuildInventoryEditor({ slots, onDropItem, onClear }: BuildInventoryEditorProps) {
  const [target, setTarget] = useState<number | null>(null);

  const renderSlot = (slot: number, kind: string) => (
    <EditableSlot
      key={`${kind}-${slot}`}
      item={slots[slot]}
      kind={kind}
      slot={slot}
      isTarget={target === slot}
      onDropItem={onDropItem}
      onClear={onClear}
      onDragStateChange={setTarget}
    />
  );

  return (
    <div className="dota-stage build-inventory-editor">
      <div className="dota-inventory-grid" role="group" aria-label="The build">
        <div className="inventory-column aghanims">
          {renderSlot(scepterSlotIndex, "scepter")}
          {renderSlot(shardSlotIndex, "shard")}
        </div>
        <div className="inventory-main">
          {Array.from({ length: mainSlotCount }, (_, index) => renderSlot(index, "main"))}
          {Array.from({ length: backpackSlotCount }, (_, index) => renderSlot(mainSlotCount + index, "backpack"))}
        </div>
        <div className="inventory-column">{renderSlot(neutralSlotIndex, "neutral")}</div>
      </div>
    </div>
  );
}
