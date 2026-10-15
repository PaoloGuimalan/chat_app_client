import { useContext, useEffect, useRef, useState } from "react";
import { UNSAFE_NavigationContext, useLocation, createPath } from "react-router-dom";
import { plainText } from "../notes/noteSession";
export function useWritingHistory<T extends { content: string }>(initial: T, restored?: T) {
  const [value, setValue] = useState(restored || initial);
  const bodyKey = (content: string) => plainText(content) ? content : "";
  const restoredBody = restored && bodyKey(restored.content) !== bodyKey(initial.content);
  const history = useRef(restoredBody ? [initial.content, restored!.content] : [initial.content]);
  const index = useRef(restoredBody ? 1 : 0);
  const latest = useRef(value);
  latest.current = value;
  const key = (item: T) => {
    if (item && typeof item === "object" && "content" in item && typeof item.content === "string") return JSON.stringify({ ...item, content: plainText(item.content) ? item.content : "" });
    return JSON.stringify(item);
  };
  const change = (next: T) => {
    if (JSON.stringify(next) === JSON.stringify(latest.current)) return;
    if (bodyKey(next.content) !== bodyKey(latest.current.content)) {
      history.current = [...history.current.slice(0, index.current + 1), next.content];
      index.current++;
    }
    latest.current = next;
    setValue(next);
  };
  return { value, change, dirty: key(value) !== key(initial), canUndo: index.current > 0, canRedo: index.current < history.current.length - 1,
    undo: () => { if (index.current) { const next = { ...latest.current, content: history.current[--index.current] }; latest.current = next; setValue(next); } },
    redo: () => { if (index.current < history.current.length - 1) { const next = { ...latest.current, content: history.current[++index.current] }; latest.current = next; setValue(next); } } };
}

export function useUnsavedWarning(dirty: boolean) {
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
}

/** BrowserRouter's navigator is shared by the shell and the editor. */
export function useConfirmNavigation(isDirty: () => boolean, saving: boolean, onDiscard: () => void) {
  const { navigator } = useContext(UNSAFE_NavigationContext);
  const location = useLocation();
  const current = useRef({ isDirty, saving, onDiscard, path: createPath(location) });
  current.current = { isDirty, saving, onDiscard, path: createPath(location) };
  useEffect(() => {
    const push = navigator.push;
    const replace = navigator.replace;
    const allow = (to: Parameters<typeof push>[0]) => {
      const destination = typeof to === "string" ? to : createPath(to);
      if (destination === current.current.path) return true;
      if (!current.current.isDirty()) return true;
      if (current.current.saving) return false;
      if (!window.confirm("Discard this unsaved diary entry?")) return false;
      current.current.onDiscard();
      return true;
    };
    navigator.push = (...args) => { if (allow(args[0])) push.apply(navigator, args); };
    navigator.replace = (...args) => { if (allow(args[0])) replace.apply(navigator, args); };
    return () => { navigator.push = push; navigator.replace = replace; };
  }, [navigator]);
}

