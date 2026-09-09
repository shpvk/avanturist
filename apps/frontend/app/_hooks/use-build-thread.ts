"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "./use-auth";
import {
  ApiError,
  CommentRejectedError,
  createComment,
  fetchComments,
  hideComment,
  muteUser,
  restoreComment,
  unmuteUser,
} from "../_lib/api";
import { mapComment } from "../_lib/api-mapping";
import { resolveAvatar } from "../_lib/avatars";
import { createId } from "../_lib/id";
import type { ApiComment, ApiMute, MutePayload } from "../_lib/api-types";
import type { Build, BuildComment } from "../_lib/types";

export type ComposerState =
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "anonymous" }
  | { kind: "unverified" }
  | { kind: "muted"; until: string | null; reason: string | null };

export type ThreadModeration = {
  onHide: (commentId: string) => void;
  onRestore: (commentId: string) => void;
  onMute: (comment: BuildComment) => void;
  onUnmute: (authorId: string) => void;
  pendingId: string | null;
};

export type BuildThread = {
  draft: string;
  composer: ComposerState;
  viewerAvatar: string | null;
  error: string | null;
  moderation: ThreadModeration | null;
  muteTarget: BuildComment | null;
  setDraft: (value: string) => void;
  addComment: (text: string) => void;
  closeMuteDialog: () => void;
  submitMute: (payload: MutePayload) => Promise<void>;
};

type Mute = { until: string | null; reason: string | null };

function rejectionMessage(error: ApiError): string {
  if (error.status === 401) return "Your session expired. Log in again to comment.";
  if (error.status === 403) return "Confirm your email to comment.";
  if (error.status === 404) return "This build has been deleted — there is nowhere to post the comment.";
  if (error.status === 429) return "Too many comments in a row. Wait a minute.";
  return "Could not post the comment. Please try again.";
}

type BuildThreadInput = {
  currentBuild: Build | undefined;
  replaceBuild: (id: string, update: (build: Build) => Build) => void;
  updateComments: (update: (build: Build) => Build) => void;
};

export function useBuildThread({ currentBuild, replaceBuild, updateComments }: BuildThreadInput): BuildThread {
  const { user, isLoading } = useAuth();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [muteTarget, setMuteTarget] = useState<BuildComment | null>(null);
  const [rejectedMute, setRejectedMute] = useState<{ userId: string; mute: Mute } | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const buildId = currentBuild?.id;
  const isModerator = user?.role === "ADMIN";

  useEffect(() => {
    if (!buildId) return;

    let cancelled = false;

    fetchComments(buildId)
      .then((comments: ApiComment[]) => {
        if (cancelled) return;
        const mapped = comments.map((comment) => mapComment(comment));
        replaceBuild(buildId, (previous) => ({ ...previous, comments: mapped, commentCount: mapped.length }));
      })
      .catch(() => {
      });

    return () => {
      cancelled = true;
    };
  }, [buildId, isModerator, replaceBuild]);

  const activeMute = useMemo<Mute | null>(() => {
    const fromServer = rejectedMute && rejectedMute.userId === user?.id ? rejectedMute.mute : null;
    const mute = user?.muted ? { until: user.mutedUntil, reason: user.muteReason } : fromServer;
    if (!mute) return null;
    if (mute.until && new Date(mute.until).getTime() <= now) return null;
    return mute;
  }, [user, rejectedMute, now]);

  useEffect(() => {
    if (!activeMute?.until) return;

    const delay = new Date(activeMute.until).getTime() - Date.now();
    const timer = window.setTimeout(() => setNow(Date.now()), Math.max(delay, 0) + 1000);

    return () => window.clearTimeout(timer);
  }, [activeMute]);

  const composer = useMemo<ComposerState>(() => {
    if (isLoading) return { kind: "loading" };
    if (!user) return { kind: "anonymous" };
    if (!user.isVerified) return { kind: "unverified" };
    if (activeMute) return { kind: "muted", until: activeMute.until, reason: activeMute.reason };
    return { kind: "ready" };
  }, [activeMute, isLoading, user]);

  const setDraft = useCallback((value: string) => {
    if (!buildId) return;
    setDrafts((current) => ({ ...current, [buildId]: value }));
  }, [buildId]);

  const addComment = useCallback((text: string) => {
    if (!buildId || !user) return;

    const optimistic: BuildComment = {
      id: createId(`${buildId}-comment`),
      author: user.displayName,
      authorId: user.id,
      avatar: resolveAvatar(user.picture, user.displayName),
      date: "just now",
      text,
    };

    replaceBuild(buildId, (previous) => ({
      ...previous,
      comments: [...previous.comments, optimistic],
      commentCount: previous.commentCount + 1,
    }));
    setDrafts((current) => ({ ...current, [buildId]: "" }));
    setError(null);

    createComment(buildId, { text })
      .then((created) => {
        replaceBuild(buildId, (previous) => ({
          ...previous,
          comments: previous.comments.map((comment) => (comment.id === optimistic.id ? mapComment(created) : comment)),
        }));
      })
      .catch((cause: unknown) => {
        if (!(cause instanceof ApiError)) return;

        replaceBuild(buildId, (previous) => ({
          ...previous,
          comments: previous.comments.filter((comment) => comment.id !== optimistic.id),
          commentCount: Math.max(previous.commentCount - 1, 0),
        }));
        setDrafts((current) => ({ ...current, [buildId]: text }));

        if (cause instanceof CommentRejectedError && cause.mute) {
          setRejectedMute({ userId: user.id, mute: cause.mute });
          return;
        }

        setError(rejectionMessage(cause));
      });
  }, [buildId, replaceBuild, user]);

  const applyComment = useCallback((updated: ApiComment) => {
    replaceBuild(updated.buildId, (previous) => ({
      ...previous,
      comments: previous.comments.map((comment) => (comment.id === updated.id ? mapComment(updated) : comment)),
    }));
  }, [replaceBuild]);

  const runModeration = useCallback(async (
    commentId: string,
    action: () => Promise<ApiComment>,
    failure: string,
  ) => {
    setPendingId(commentId);
    setError(null);
    try {
      applyComment(await action());
    } catch {
      setError(failure);
    } finally {
      setPendingId(null);
    }
  }, [applyComment]);

  const applyMute = useCallback((authorId: string, mute: ApiMute) => {
    updateComments((build) => ({
      ...build,
      comments: build.comments.map((comment) => (comment.authorId === authorId
        ? { ...comment, authorMuted: mute.muted, authorMutedUntil: mute.mutedUntil }
        : comment)),
    }));
  }, [updateComments]);

  const submitMute = useCallback(async (payload: MutePayload) => {
    const authorId = muteTarget?.authorId;
    if (!authorId) return;

    applyMute(authorId, await muteUser(authorId, payload));
    setMuteTarget(null);
  }, [applyMute, muteTarget]);

  const unmute = useCallback(async (authorId: string) => {
    setError(null);
    try {
      applyMute(authorId, await unmuteUser(authorId));
    } catch {
      setError("Could not lift the mute. Please try again.");
    }
  }, [applyMute]);

  const moderation = useMemo<ThreadModeration | null>(() => {
    if (!isModerator) return null;

    return {
      pendingId,
      onHide: (commentId) => void runModeration(commentId, () => hideComment(commentId), "Could not hide the comment."),
      onRestore: (commentId) => void runModeration(commentId, () => restoreComment(commentId), "Could not restore the comment."),
      onMute: setMuteTarget,
      onUnmute: (authorId) => void unmute(authorId),
    };
  }, [isModerator, pendingId, runModeration, unmute]);

  return {
    draft: buildId ? (drafts[buildId] ?? "") : "",
    composer,
    viewerAvatar: user ? resolveAvatar(user.picture, user.displayName) : null,
    error,
    moderation,
    muteTarget,
    setDraft,
    addComment,
    closeMuteDialog: () => setMuteTarget(null),
    submitMute,
  };
}
