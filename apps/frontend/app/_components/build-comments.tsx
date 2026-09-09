"use client";

import Image from "next/image";
import Link from "next/link";
import type { FormEvent } from "react";
import { HideIcon, MuteIcon, RestoreIcon, UnmuteIcon } from "./moderation-icons";
import { formatMuteDeadline } from "../_lib/api-mapping";
import { commentsLabel } from "../_lib/format";
import type { ComposerState, ThreadModeration } from "../_hooks/use-build-thread";
import type { BuildComment } from "../_lib/types";

const maxCommentLength = 500;

type BuildCommentsProps = {
  buildId: string;
  comments: BuildComment[];
  count: number;
  draft: string;
  viewerAvatar: string | null;
  composer: ComposerState;
  moderation: ThreadModeration | null;
  error: string | null;
  onDraftChange: (value: string) => void;
  onSubmit: (text: string) => void;
};

export function BuildComments({
  buildId,
  comments,
  count,
  draft,
  viewerAvatar,
  composer,
  moderation,
  error,
  onDraftChange,
  onSubmit,
}: BuildCommentsProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onSubmit(text);
  };

  const composerBusy = composer.kind === "loading";

  return (
    <section className="build-comments" aria-label="Comments on this build">
      <div className="build-comments-head">
        <span className="section-label">Comments</span>
        <div className="build-comments-tools">
          <span className="random-comment-count"><i aria-hidden="true">•••</i>{commentsLabel(count)}</span>
        </div>
      </div>
      {composer.kind === "ready" || composerBusy ? (
        <form className="comment-composer" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor={`comment-${buildId}`}>Your comment on this build</label>
          {viewerAvatar
            ? <Image className="composer-avatar" src={viewerAvatar} alt="" width={64} height={64} unoptimized />
            : <span className="composer-avatar" aria-hidden="true" />}
          <textarea
            id={`comment-${buildId}`}
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            maxLength={maxCommentLength}
            rows={2}
            placeholder="What do you make of this build?"
            disabled={composerBusy}
          />
          <div className="comment-composer-footer">
            <span>{draft.length}{`/${maxCommentLength}`}</span>
            <button type="submit" disabled={composerBusy || !draft.trim()}>Post</button>
          </div>
        </form>
      ) : (
        <ComposerNotice state={composer} />
      )}
      {error && <p className="comment-error" role="alert">{error}</p>}
      <ol id={`comment-list-${buildId}`} className="comment-list" aria-live="polite">
        {comments.map((comment) => (
          <CommentRow key={comment.id} comment={comment} moderation={moderation} />
        ))}
        {comments.length === 0 && <li className="comment-empty">No comments yet — write the first one.</li>}
      </ol>
    </section>
  );
}

function CommentRow({ comment, moderation }: { comment: BuildComment; moderation: ThreadModeration | null }) {
  const busy = moderation?.pendingId === comment.id;
  const authorId = comment.authorId;

  return (
    <li className={`comment-item${comment.hidden ? " hidden" : ""}`}>
      <Image src={comment.avatar} alt="" width={36} height={36} loading="lazy" unoptimized />
      <div>
        <div className="comment-item-head">
          <strong>{comment.author}</strong>
          {moderation && comment.authorMuted && (
            <span className="mute-badge">muted {formatMuteDeadline(comment.authorMutedUntil ?? null)}</span>
          )}
          <span>{comment.date}</span>
        </div>
        <p>{comment.text}</p>
        {moderation && (
          <div className="comment-moderation">
            {comment.hidden ? (
              <>
                <span className="comment-hidden-note">Hidden by a moderator — only you can see it</span>
                <button type="button" disabled={busy} onClick={() => moderation.onRestore(comment.id)}>
                  <RestoreIcon />Restore
                </button>
              </>
            ) : (
              <button className="destructive" type="button" disabled={busy} onClick={() => moderation.onHide(comment.id)}>
                <HideIcon />Hide
              </button>
            )}
            {authorId && (comment.authorMuted ? (
              <button type="button" disabled={busy} onClick={() => moderation.onUnmute(authorId)}>
                <UnmuteIcon />Unmute
              </button>
            ) : (
              <button type="button" disabled={busy} onClick={() => moderation.onMute(comment)}>
                <MuteIcon />Mute
              </button>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}

function ComposerNotice({ state }: { state: ComposerState }) {
  if (state.kind === "anonymous") {
    return (
      <p className="comment-notice">
        To join the discussion, <Link href="/login">log in</Link>. Voting on builds works without an account.
      </p>
    );
  }

  if (state.kind === "unverified") {
    return (
      <p className="comment-notice">
        Confirm your email using the link we sent — commenting and publishing open up after that.{" "}
        <Link href="/auth/check-email">Send the message again</Link>.
      </p>
    );
  }

  if (state.kind === "muted") {
    return (
      <div className="comment-notice muted">
        <strong>Commenting is closed {formatMuteDeadline(state.until)}</strong>
        {state.reason && <span>Reason: {state.reason}</span>}
        <span>You can still vote on builds and publish your own.</span>
      </div>
    );
  }

  return null;
}
