import Image from "next/image";
import type { Build } from "../_lib/types";

export function Author({ build }: { build: Build }) {
  return (
    <div className="author-row">
      <Image src={build.avatar} alt="" width={42} height={42} loading="lazy" unoptimized />
      <div><strong>{build.author}</strong><span>Репутация: {build.reputation} <b>▲</b></span></div>
    </div>
  );
}
