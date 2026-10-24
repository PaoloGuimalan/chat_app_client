export const studioMomentUrl = (returnTo: string) =>
  `/studio/?compose=moment&from=webapp&returnTo=${encodeURIComponent(returnTo)}`;

// Studio is a separately served app: React Router must not claim its path.
export const openStudioMoment = () => {
  window.location.assign(studioMomentUrl(window.location.pathname + window.location.search + window.location.hash));
};
