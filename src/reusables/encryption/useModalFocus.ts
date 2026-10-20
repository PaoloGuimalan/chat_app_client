import { useLayoutEffect, useRef } from 'react';

export function useModalFocus<T extends HTMLElement>(enabled: boolean, cancel: () => void) {
  const root = useRef<T>(null);
  const onCancel = useRef(cancel);
  onCancel.current = cancel;
  useLayoutEffect(() => {
    if (!enabled) return;
    const previous = document.activeElement;
    const controls = () => [...(root.current?.querySelectorAll<HTMLElement>('input:not(:disabled), button:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href]') || [])];
    const handle = (event: KeyboardEvent) => {
      const dialogs = document.querySelectorAll('[aria-modal="true"]');
      const own = root.current?.matches('[aria-modal="true"]') ? root.current : root.current?.querySelector('[aria-modal="true"]');
      if (!own || dialogs[dialogs.length - 1] !== own) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        onCancel.current();
      } else if (event.key === 'Tab') {
        const items = controls(), first = items[0], last = items[items.length - 1];
        if (!first) { event.preventDefault(); return; }
        if (event.shiftKey && (document.activeElement === first || !root.current?.contains(document.activeElement))) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !root.current?.contains(document.activeElement))) {
          event.preventDefault(); first.focus();
        }
      }
    };
    if (!root.current?.contains(document.activeElement)) controls()[0]?.focus();
    document.addEventListener('keydown', handle);
    return () => {
      document.removeEventListener('keydown', handle);
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, [enabled]);
  return root;
}
