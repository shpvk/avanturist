import Image from "next/image";
import { Author } from "./author";
import { ItemIcons } from "./item-icons";
import { VoteBar, VoteValues } from "./vote-bar";
import { commentsLabel } from "../_lib/format";
import type { Build } from "../_lib/types";

/** Feed card. The first card loads its hero art eagerly to keep LCP on the fold. */
export function BuildCard({ build, index, onOpen }: { build: Build; index: number; onOpen: () => void }) {
  return (
    <article className="build-card">
      <div className="hero-section">
        <Image className="hero-image" src={build.heroImage} alt={build.hero} width={256} height={144} loading={index === 0 ? "eager" : "lazy"} unoptimized />
        <div className="hero-copy"><h2>{build.hero}</h2><button className="build-title" type="button" onClick={onOpen} aria-label={`Открыть билд «${build.title}»`}>{build.title}</button><div className="hero-meta"><span className={`role-badge ${build.roleClass}`}>{build.role}</span></div></div>
      </div>
      <div className="items-section">
        <h3>Предметы</h3><ItemIcons items={build.items} />
      </div>
      <div className="author-section">
        <Author build={build} />
        <div className="verdict-block"><span>Вердикт</span><strong className={`verdict ${build.verdictType}`}>{build.verdict}</strong></div>
      </div>
      <div className="votes-section">
        <span>Распределение голосов</span><VoteBar votes={build.votes} /><VoteValues votes={build.votes} />
      </div>
      <div className="card-meta">
        <div className="card-meta-copy"><span className="comments" aria-label={commentsLabel(build.comments.length)}><i aria-hidden="true">•••</i><span aria-hidden="true">{build.comments.length}</span></span><time dateTime={build.dateTime}>{build.date}</time></div>
        <button className="card-open-button" type="button" onClick={onOpen}>Открыть билд <span aria-hidden="true">→</span></button>
      </div>
    </article>
  );
}
