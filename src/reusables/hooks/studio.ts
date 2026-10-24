export const studioMomentUrl = (returnTo: string) =>
  `/studio/?compose=moment&from=webapp&returnTo=${encodeURIComponent(returnTo)}`;

// Studio is a separately served app: React Router must not claim its path.
export const openStudioMoment = () => {
  window.location.assign(studioMomentUrl(window.location.pathname + window.location.search + window.location.hash));
};

// Same-origin, same-tab receipt written only after Studio confirms publication.
// It contains no credentials and is consumed once after Home authenticates.
export function consumeStudioMomentNotice(entityId: string, now = Date.now()): string | null {
  try {
    const key = 'chatterloop:studio:moment-shared';
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    window.sessionStorage.removeItem(key);
    const notice = JSON.parse(raw);
    return notice.version === 1 && notice.destination === 'webapp' && notice.entityId === entityId &&
      Number.isFinite(notice.createdAt) && now >= notice.createdAt && now - notice.createdAt <= 300000
      ? 'Your Moment is live for 24 hours.' : null;
  } catch { return null; }
}
