import { RefObject, useEffect, useState } from "react";

// Pages opt into design-system scoping via ".cl-redesign" (or the legacy
// ".App") wrapper - font-size rescaling, scrollbar styling, and some
// theme overrides only apply inside it. Portaling straight to
// document.body escapes that scope entirely, which is why plain
// document.body portals broke modal styling. Walking up from an anchor
// still inside the original render tree finds the current page's actual
// wrapper, while still escaping any local stacking-context trap deeper in
// the tree (e.g. a transformed ancestor a few levels up from the trigger).
const SCOPE_SELECTOR = ".cl-redesign, .App";

export function useScopedPortalRoot(
  anchorRef: RefObject<HTMLElement | null>,
): HTMLElement | null {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const scoped = anchorRef.current?.closest(
      SCOPE_SELECTOR,
    ) as HTMLElement | null;
    setPortalRoot(scoped ?? document.body);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return portalRoot;
}
