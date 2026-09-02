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
import { authorAvatar, mapComment } from "../_lib/api-mapping";
import { createId } from "../_lib/id";
import type { ApiComment, ApiMute, MutePayload } from "../_lib/api-types";
import type { Build, BuildComment } from "../_lib/types";

/** Почему композер закрыт — и закрыт ли вообще. */
export type ComposerState =
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "anonymous" }
  | { kind: "unverified" }
  | { kind: "muted"; until: string | null; reason: string | null };

/** Действия модератора. Обычному пользователю сюда приходит `null`. */
export type ThreadModeration = {
  onHide: (commentId: string) => void;
  onRestore: (commentId: string) => void;
  onMute: (comment: BuildComment) => void;
  onUnmute: (authorId: string) => void;
  /** Комментарий, по которому сейчас идёт запрос: его кнопки заблокированы. */
  pendingId: string | null;
};

export type BuildThread = {
  draft: string;
  expanded: boolean;
  composer: ComposerState;
  error: string | null;
  moderation: ThreadModeration | null;
  /** Автор, для которого открыт диалог мута. */
  muteTarget: BuildComment | null;
  setDraft: (value: string) => void;
  setExpanded: (expanded: boolean) => void;
  addComment: (text: string) => void;
  closeMuteDialog: () => void;
  submitMute: (payload: MutePayload) => Promise<void>;
};

type Mute = { until: string | null; reason: string | null };

function rejectionMessage(error: ApiError): string {
  if (error.status === 401) return "Сессия истекла. Войдите заново, чтобы комментировать.";
  if (error.status === 403) return "Подтвердите почту, чтобы комментировать.";
  if (error.status === 404) return "Билд уже удалён — комментарий отправить некуда.";
  if (error.status === 429) return "Слишком много комментариев подряд. Подождите минуту.";
  return "Не удалось отправить комментарий. Попробуйте ещё раз.";
}

type BuildThreadInput = {
  currentBuild: Build | undefined;
  replaceBuild: (id: string, update: (build: Build) => Build) => void;
  updateComments: (update: (build: Build) => Build) => void;
};

/**
 * Обсуждение под билдом: черновик, отправка и — для админа — модерация ветки.
 * Комментарии живут внутри билда, поэтому все записи идут через `replaceBuild`.
 */
export function useBuildThread({ currentBuild, replaceBuild, updateComments }: BuildThreadInput): BuildThread {
  const { user, isLoading } = useAuth();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [muteTarget, setMuteTarget] = useState<BuildComment | null>(null);
  /**
   * Мут, о котором сказал отказ сервера: профиль в памяти о нём ещё не знает.
   * Хранится вместе с владельцем, поэтому после смены аккаунта отпадает сам.
   */
  const [rejectedMute, setRejectedMute] = useState<{ userId: string; mute: Mute } | null>(null);
  /** Тикает один раз — в момент, когда истекает собственный мут. */
  const [now, setNow] = useState(() => Date.now());

  const buildId = currentBuild?.id;
  const isModerator = user?.role === "ADMIN";

  /**
   * Лента отдаёт только живые комментарии. Админу ветка нужна целиком, вместе
   * со скрытыми, поэтому для него она перечитывается отдельным запросом.
   */
  useEffect(() => {
    if (!isModerator || !buildId) return;

    let cancelled = false;

    fetchComments(buildId)
      .then((comments: ApiComment[]) => {
        if (cancelled) return;
        const mapped = comments.map((comment) => mapComment(comment));
        replaceBuild(buildId, (previous) => ({ ...previous, comments: mapped }));
      })
      .catch(() => {
        // API недоступен: в ветке остаётся то, что уже пришло с лентой.
      });

    return () => {
      cancelled = true;
    };
  }, [buildId, isModerator, replaceBuild]);

  const activeMute = useMemo<Mute | null>(() => {
    const fromServer = rejectedMute && rejectedMute.userId === user?.id ? rejectedMute.mute : null;
    const mute = user?.muted ? { until: user.mutedUntil, reason: user.muteReason } : fromServer;
    if (!mute) return null;
    // Срок мог истечь прямо в открытой вкладке: тогда комментарии снова открыты.
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
      avatar: authorAvatar(user.displayName),
      date: "только что",
      text,
    };

    replaceBuild(buildId, (previous) => ({ ...previous, comments: [...previous.comments, optimistic] }));
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
        // Недоступный API комментарий не отменяет: демо-режим продолжает работать.
        if (!(cause instanceof ApiError)) return;

        // Отказ сервера — другое дело: снимаем комментарий и возвращаем текст в поле.
        replaceBuild(buildId, (previous) => ({
          ...previous,
          comments: previous.comments.filter((comment) => comment.id !== optimistic.id),
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

  /** Мут глобальный, поэтому метка обновляется у всех комментариев автора. */
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
      setError("Не удалось снять мут. Попробуйте ещё раз.");
    }
  }, [applyMute]);

  const moderation = useMemo<ThreadModeration | null>(() => {
    if (!isModerator) return null;

    return {
      pendingId,
      onHide: (commentId) => void runModeration(commentId, () => hideComment(commentId), "Не удалось скрыть комментарий."),
      onRestore: (commentId) => void runModeration(commentId, () => restoreComment(commentId), "Не удалось вернуть комментарий."),
      onMute: setMuteTarget,
      onUnmute: (authorId) => void unmute(authorId),
    };
  }, [isModerator, pendingId, runModeration, unmute]);

  return {
    draft: buildId ? (drafts[buildId] ?? "") : "",
    expanded: expandedId !== null && expandedId === buildId,
    composer,
    error,
    moderation,
    muteTarget,
    setDraft,
    setExpanded: (expanded: boolean) => setExpandedId(expanded && buildId ? buildId : null),
    addComment,
    closeMuteDialog: () => setMuteTarget(null),
    submitMute,
  };
}
