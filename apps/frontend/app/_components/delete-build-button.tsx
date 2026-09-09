"use client";

import { useEffect, useRef, useState } from "react";

type DeleteBuildButtonProps = {
  title: string;
  className?: string;
  onDelete: () => Promise<void> | void;
};

export function DeleteBuildButton({ title, className, onDelete }: DeleteBuildButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isConfirming) confirmRef.current?.focus();
  }, [isConfirming]);

  const handleDelete = async () => {
    setIsBusy(true);
    try {
      await onDelete();
    } finally {
      setIsBusy(false);
      setIsConfirming(false);
    }
  };

  if (!isConfirming) {
    return (
      <button
        className={`delete-build ${className ?? ""}`.trim()}
        type="button"
        onClick={() => setIsConfirming(true)}
        aria-label={`Delete the build “${title}”`}
      >
        Delete
      </button>
    );
  }

  return (
    <span className={`delete-build-confirm ${className ?? ""}`.trim()} role="group" aria-label={`Delete the build “${title}”?`}>
      <span aria-hidden="true">Delete?</span>
      <button ref={confirmRef} className="destructive" type="button" disabled={isBusy} onClick={() => void handleDelete()}>
        {isBusy ? "Deleting…" : "Yes"}
      </button>
      <button type="button" disabled={isBusy} onClick={() => setIsConfirming(false)}>No</button>
    </span>
  );
}
