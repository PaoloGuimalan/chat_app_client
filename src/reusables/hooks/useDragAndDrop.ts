/**
 * useDragAndDrop
 *
 * Wires native HTML5 drag-and-drop events onto a target element and resolves
 * dropped files as a plain File[] via onFiles - no external DnD library.
 *
 * Uses a counter ref (not a boolean) to track drag-enter/leave, since a
 * dragleave fires every time the pointer crosses into a child element, not
 * just when it leaves the target itself - without the counter, isDragging
 * flickers off while dragging over nested children.
 */

import { useCallback, useRef, useState } from "react";

interface UseDragAndDropOptions {
  onFiles: (files: File[]) => void;
  /** Same semantics as <input accept>, e.g. "image/*" or "image/*,video/*" */
  accept?: string;
  disabled?: boolean;
}

function matchesAccept(file: File, accept?: string): boolean {
  if (!accept) return true;
  return accept.split(",").some((pattern) => {
    const trimmed = pattern.trim();
    if (!trimmed) return true;
    if (trimmed.endsWith("/*")) return file.type.startsWith(trimmed.slice(0, -1));
    return file.type === trimmed;
  });
}

export function useDragAndDrop({ onFiles, accept, disabled }: UseDragAndDropOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);

  const onDragEnter = useCallback(
    (e: React.DragEvent) => {
      if (disabled) return;
      if (!e.dataTransfer?.types?.includes("Files")) return;
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current += 1;
      setIsDragging(true);
    },
    [disabled],
  );

  const onDragOver = useCallback(
    (e: React.DragEvent) => {
      if (disabled) return;
      // Required for onDrop to fire at all per the HTML5 DnD spec.
      e.preventDefault();
      e.stopPropagation();
    },
    [disabled],
  );

  const onDragLeave = useCallback(
    (e: React.DragEvent) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
      if (dragCounterRef.current === 0) setIsDragging(false);
    },
    [disabled],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragging(false);

      const files = Array.from(e.dataTransfer?.files ?? []).filter((file) =>
        matchesAccept(file, accept),
      );
      if (files.length > 0) onFiles(files);
    },
    [disabled, accept, onFiles],
  );

  return {
    isDragging,
    dragHandlers: { onDragEnter, onDragOver, onDragLeave, onDrop },
  };
}
