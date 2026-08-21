"use client";

import Image from "next/image";
import { useMemo } from "react";
import type { FormEvent } from "react";
import { collapsedCommentCount } from "../_lib/build-data";
import { commentsLabel } from "../_lib/format";
import type { BuildComment } from "../_lib/types";

const maxCommentLength = 500;

type BuildCommentsProps = {
  buildId: string;
  comments: BuildComment[];
  expanded: boolean;
  draft: string;
  onToggleExpanded: () => void;
  onExpand: () => void;
  onDraftChange: (value: string) => void;
  onSubmit: (text: string) => void;
};

/** Comment thread under the random build: collapsed list, toggle and composer. */
export function BuildComments({
  buildId,
  comments,
  expanded,
  draft,
  onToggleExpanded,
  onExpand,
  onDraftChange,
  onSubmit,
}: BuildCommentsProps) {
  const visibleComments = useMemo(
    () => (expanded ? comments : comments.slice(0, collapsedCommentCount)),
    [comments, expanded],
  );
  const hiddenCommentCount = comments.length - visibleComments.length;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onSubmit(text);
  };

  return (
    <section className="build-comments" aria-label="Комментарии к билду">
      <div className="build-comments-head">
        <span className="section-label">Комментарии</span>
        <div className="build-comments-tools">
          <span className="random-comment-count"><i aria-hidden="true">•••</i>{commentsLabel(comments.length)}</span>
          {comments.length > collapsedCommentCount && (
            <button
              className="comments-toggle"
              type="button"
              aria-expanded={expanded}
              aria-controls={`comment-list-${buildId}`}
              onClick={onToggleExpanded}
            >
              {expanded ? "Свернуть" : `Показать все (${comments.length})`}
              <span aria-hidden="true">{expanded ? "▲" : "▼"}</span>
            </button>
          )}
        </div>
      </div>
      <ol id={`comment-list-${buildId}`} className="comment-list" aria-live="polite">
        {visibleComments.map((comment) => (
          <li className="comment-item" key={comment.id}>
            <Image src={comment.avatar} alt="" width={36} height={36} loading="lazy" unoptimized />
            <div>
              <div className="comment-item-head"><strong>{comment.author}</strong><span>{comment.date}</span></div>
              <p>{comment.text}</p>
            </div>
          </li>
        ))}
        {comments.length === 0 && <li className="comment-empty">Комментариев пока нет — напишите первый.</li>}
      </ol>
      {hiddenCommentCount > 0 && (
        <button className="comments-more" type="button" onClick={onExpand}>
          Ещё {commentsLabel(hiddenCommentCount)}
        </button>
      )}
      <form className="comment-composer" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor={`comment-${buildId}`}>Комментарий к билду</label>
        <textarea id={`comment-${buildId}`} value={draft} onChange={(event) => onDraftChange(event.target.value)} maxLength={maxCommentLength} rows={2} placeholder="Что думаете об этой сборке?" />
        <div className="comment-composer-footer"><span>{draft.length}{`/${maxCommentLength}`}</span><button type="submit" disabled={!draft.trim()}>Отправить</button></div>
      </form>
    </section>
  );
}
