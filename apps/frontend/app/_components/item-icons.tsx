import Image from "next/image";
import { itemLabel } from "../_lib/build-data";

/** The six item slots of a build; `inventory` switches to the larger stage layout. */
export function ItemIcons({ items, inventory = false }: { items: string[]; inventory?: boolean }) {
  return (
    <div className={`item-row${inventory ? " inventory" : ""}`} aria-label="Предметы сборки">
      {items.map((item, index) => (
        <Image
          key={`${item}-${index}`}
          src={`/assets/items/${item}.png`}
          alt={itemLabel(item)}
          title={itemLabel(item)}
          width={88}
          height={64}
          loading="lazy"
          unoptimized
        />
      ))}
    </div>
  );
}
