import { useCallback, useSyncExternalStore } from "react";

// A post's comment box and reaction palettes share one session preference.
// Acting identities have separate keys; no preference is sent for ordinary posts.
const choices = new Map<string, boolean>();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function useCommunityInteractionIdentity(actor: string, postId: string) {
  const key = `${actor}:${postId}`;
  const getSnapshot = useCallback(() => choices.get(key) ?? false, [key]);
  const anonymous = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const setAnonymous = useCallback((value: boolean) => {
    choices.set(key, value);
    listeners.forEach(listener => listener());
  }, [key]);
  return [anonymous, setAnonymous] as const;
}
