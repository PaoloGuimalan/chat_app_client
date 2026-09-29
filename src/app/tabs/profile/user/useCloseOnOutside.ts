import { RefObject, useEffect } from "react";

/**
 * Calls [onClose] when a press lands outside [ref] while [open] - for the
 * profile photo and cover photo menus, so one left open closes as soon as
 * you click anywhere else.
 */
export function useCloseOnOutside(
  ref: RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void,
) {
  useEffect(() => {
    if (!open) return;
    const handle = (e: PointerEvent) => {
      const box = ref.current;
      if (box && !box.contains(e.target as Node)) onClose();
    };
    document.addEventListener("pointerdown", handle);
    return () => document.removeEventListener("pointerdown", handle);
  }, [open, ref, onClose]);
}
