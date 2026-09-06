import Image from "next/image";
import { DeleteBuildButton } from "./delete-build-button";
import { ItemIcons } from "./item-icons";
import { commentsLabel } from "../_lib/format";
import { splitInventory } from "../_lib/inventory";
import type { Build } from "../_lib/types";

function approvalTone(share: number): string {
  if (share >= 60) return "high";
  return share >= 40 ? "mixed" : "low";
}

function ThumbIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 10.7v8.8H4.6A1.6 1.6 0 0 1 3 17.9v-5.6a1.6 1.6 0 0 1 1.6-1.6H7Z" />
      <path d="m7 10.7 4.2-7a1.4 1.4 0 0 1 2.6.7v4.3h4.4a2 2 0 0 1 1.95 2.45l-1.3 6a2 2 0 0 1-1.95 1.55H7" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 13.5A2.5 2.5 0 0 1 17.5 16H9l-4 3.4V6.5A2.5 2.5 0 0 1 7.5 4h10A2.5 2.5 0 0 1 20 6.5Z" />
    </svg>
  );
}

export function BuildCard({ build, index, onOpen, canDelete = false, onDelete }: { build: Build; index: number; onOpen: () => void; canDelete?: boolean; onDelete?: () => Promise<void> }) {
  const approval = build.votes[0];
  const carried = splitInventory(build.items).main;

  return (
    <article className="build-card">
      <Image className="build-card-art" src={build.heroImage} alt="" width={512} height={288} loading={index === 0 ? "eager" : "lazy"} unoptimized />
      <div className="build-card-body">
        <span className="build-card-hero">{build.hero}</span>
        <h2 className="build-card-title">
          <button type="button" onClick={onOpen} aria-label={`Открыть билд «${build.title}»`}>{build.title}</button>
        </h2>
        <div className="build-card-items"><ItemIcons items={carried} /></div>
        <div className="build-card-footer">
          <span className="build-card-author">{build.author}</span>
          <span className={`build-card-approval ${approvalTone(approval)}`} aria-label={`За ${approval}%`}>
            <span aria-hidden="true">{approval}%</span><ThumbIcon />
          </span>
          <span className="build-card-comments" aria-label={commentsLabel(build.commentCount)}>
            <CommentIcon /><span aria-hidden="true">{build.commentCount}</span>
          </span>
          {canDelete && onDelete && <DeleteBuildButton className="build-card-delete" title={build.title} onDelete={onDelete} />}
        </div>
      </div>
    </article>
  );
}
