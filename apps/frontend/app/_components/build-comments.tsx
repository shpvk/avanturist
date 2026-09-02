"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import type { FormEvent } from "react";
import { HideIcon, MuteIcon, RestoreIcon, UnmuteIcon } from "./moderation-icons";
import { collapsedCommentCount } from "../_lib/build-data";
import { formatMuteDeadline } from "../_lib/api-mapping";
import { commentsLabel } from "../_lib/format";
import type { ComposerState, ThreadModeration } from "../_hooks/use-build-thread";
import type { BuildComment } from "../_lib/types";

const maxCommentLength = 500;

type BuildCommentsProps = {
  buildId: string;
  comments: BuildComment[];
  expanded: boolean;
  draft: string;
  /** Открыт ли композер, и если нет — почему. */
  composer: ComposerState;
  /** Действия админа; у остальных — `null`, и ветка выглядит как обычно. */
  moderation: ThreadModeration | null;
  error: string | null;
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
  composer,
  moderation,
  error,
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

  const composerBusy = composer.kind === "loading";

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
          <CommentRow key={comment.id} comment={comment} moderation={moderation} />
        ))}
        {comments.length === 0 && <li className="comment-empty">Комментариев пока нет — напишите первый.</li>}
      </ol>
      {hiddenCommentCount > 0 && (
        <button className="comments-more" type="button" onClick={onExpand}>
          Ещё {commentsLabel(hiddenCommentCount)}
        </button>
      )}
      {composer.kind === "ready" || composerBusy ? (
        <form className="comment-composer" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor={`comment-${buildId}`}>Комментарий к билду</label>
          <textarea
            id={`comment-${buildId}`}
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            maxLength={maxCommentLength}
            rows={2}
            placeholder="Что думаете об этой сборке?"
            disabled={composerBusy}
          />
          <div className="comment-composer-footer">
            <span>{draft.length}{`/${maxCommentLength}`}</span>
            <button type="submit" disabled={composerBusy || !draft.trim()}>Отправить</button>
          </div>
        </form>
      ) : (
        <ComposerNotice state={composer} />
      )}
      {error && <p className="comment-error" role="alert">{error}</p>}
    </section>
  );
}

function CommentRow({ comment, moderation }: { comment: BuildComment; moderation: ThreadModeration | null }) {
  const busy = moderation?.pendingId === comment.id;
  // У демо-комментариев автора в базе нет, мутить некого.
  const authorId = comment.authorId;

  return (
    <li className={`comment-item${comment.hidden ? " hidden" : ""}`}>
      <Image src={comment.avatar} alt="" width={36} height={36} loading="lazy" unoptimized />
      <div>
        <div className="comment-item-head">
          <strong>{comment.author}</strong>
          {moderation && comment.authorMuted && (
            <span className="mute-badge">в муте {formatMuteDeadline(comment.authorMutedUntil ?? null)}</span>
          )}
          <span>{comment.date}</span>
        </div>
        <p>{comment.text}</p>
        {moderation && (
          <div className="comment-moderation">
            {comment.hidden ? (
              <>
                <span className="comment-hidden-note">Скрыт модератором — виден только вам</span>
                <button type="button" disabled={busy} onClick={() => moderation.onRestore(comment.id)}>
                  <RestoreIcon />Вернуть
                </button>
              </>
            ) : (
              <button className="destructive" type="button" disabled={busy} onClick={() => moderation.onHide(comment.id)}>
                <HideIcon />Скрыть
              </button>
            )}
            {authorId && (comment.authorMuted ? (
              <button type="button" disabled={busy} onClick={() => moderation.onUnmute(authorId)}>
                <UnmuteIcon />Снять мут
              </button>
            ) : (
              <button type="button" disabled={busy} onClick={() => moderation.onMute(comment)}>
                <MuteIcon />Замутить
              </button>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}

/** Композер закрыт: объясняем чем именно и что с этим делать. */
function ComposerNotice({ state }: { state: ComposerState }) {
  if (state.kind === "anonymous") {
    return (
      <p className="comment-notice">
        Чтобы обсуждать сборки, <Link href="/login">войдите в аккаунт</Link>. Оценивать билды можно и без входа.
      </p>
    );
  }

  if (state.kind === "unverified") {
    return (
      <p className="comment-notice">
        Подтвердите почту по ссылке из письма — после этого откроются комментарии и публикация сборок.
      </p>
    );
  }

  if (state.kind === "muted") {
    return (
      <div className="comment-notice muted">
        <strong>Комментарии закрыты {formatMuteDeadline(state.until)}</strong>
        {state.reason && <span>Причина: {state.reason}</span>}
        <span>Оценивать билды и публиковать свои сборки по-прежнему можно.</span>
      </div>
    );
  }

  return null;
}
