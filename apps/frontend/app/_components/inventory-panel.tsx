import Image from "next/image";
import { itemImage, itemLabel } from "../_lib/build-data";
import { blessingId, shardId, splitInventory } from "../_lib/inventory";

const slotPlaceholder: Record<string, string> = { scepter: blessingId, shard: shardId };

function InventorySlot({ item, kind }: { item: string | null; kind: string }) {
  if (!item) {
    const placeholder = slotPlaceholder[kind];
    return (
      <div className={`inventory-slot ${kind} empty`} aria-hidden="true">
        {placeholder && <Image className="slot-placeholder" src={itemImage(placeholder)} alt="" width={88} height={64} loading="lazy" unoptimized />}
      </div>
    );
  }

  return (
    <div className={`inventory-slot ${kind}`}>
      <Image src={itemImage(item)} alt={itemLabel(item)} title={itemLabel(item)} width={88} height={64} loading="lazy" unoptimized />
    </div>
  );
}

export function InventoryPanel({ items }: { items: string[] }) {
  const { main, backpack, scepter, shard, neutral } = splitInventory(items);

  return (
    <div className="dota-inventory-grid" role="group" aria-label="Build items">
      <div className="inventory-column aghanims">
        <InventorySlot item={scepter} kind="scepter" />
        <InventorySlot item={shard} kind="shard" />
      </div>
      <div className="inventory-main">
        {main.map((item, index) => <InventorySlot key={`main-${item ?? "empty"}-${index}`} item={item} kind="main" />)}
        {backpack.map((item, index) => <InventorySlot key={`backpack-${item ?? "empty"}-${index}`} item={item} kind="backpack" />)}
      </div>
      <div className="inventory-column"><InventorySlot item={neutral} kind="neutral" /></div>
    </div>
  );
}
