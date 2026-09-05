import Image from "next/image";
import { itemImage, itemLabel } from "../_lib/build-data";
import { splitInventory } from "../_lib/inventory";

/** An empty scepter or shard slot still shows what belongs there, faded out. */
const slotPlaceholder: Record<string, string> = { scepter: "ultimate_scepter", shard: "aghanims_shard" };

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

/** The build as a Dota inventory: the neutral, the six carried items, the scepter and the shard. */
export function InventoryPanel({ items }: { items: string[] }) {
  const { main, scepter, shard, neutral } = splitInventory(items);

  return (
    <div className="dota-inventory-grid" role="group" aria-label="Предметы сборки">
      <div className="inventory-column"><InventorySlot item={neutral} kind="neutral" /></div>
      <div className="inventory-main">
        {main.map((item, index) => <InventorySlot key={`${item ?? "empty"}-${index}`} item={item} kind="main" />)}
      </div>
      <div className="inventory-column">
        <InventorySlot item={scepter} kind="scepter" />
        <InventorySlot item={shard} kind="shard" />
      </div>
    </div>
  );
}
