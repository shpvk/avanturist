import Image from "next/image";
import { itemImage, itemLabel } from "../_lib/build-data";

export function ItemIcons({ items }: { items: Array<string | null> }) {
  return (
    <div className="item-row" aria-label="Build items">
      {items.map((item, index) => (item
        ? <Image
            key={`${item}-${index}`}
            src={itemImage(item)}
            alt={itemLabel(item)}
            title={itemLabel(item)}
            width={88}
            height={64}
            loading="lazy"
            unoptimized
          />
        : <i className="item-empty" key={`empty-${index}`} aria-hidden="true" />
      ))}
    </div>
  );
}
