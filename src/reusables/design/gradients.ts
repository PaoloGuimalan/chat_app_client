// Deterministic avatar/tile gradients. Kept out of the component files so
// importing the helper doesn't break Fast Refresh (a module may export
// either components or plain values, not both).

const AV_GRADS: [string, string][] = [
  ["#1c7def", "#5aa9ff"],
  ["#20bd7c", "#5be0a8"],
  ["#e69500", "#ffc24d"],
  ["#ff5b6b", "#ff97a1"],
  ["#8b5cf6", "#b794ff"],
  ["#0ea5b7", "#4fd6e6"],
  ["#f0518c", "#ff8fbf"],
  ["#3b6fe0", "#6fa0ff"],
];

export function avHash(id = "") {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Stable two-stop gradient for an id - the same one Avatar falls back to
 * when there is no photo, so non-avatar tiles (e.g. the Contacts group
 * rail) sit in the same visual family.
 *
 * Saturated on purpose: a soft tint reads as washed out against the
 * light-mode background.
 */
export function entityGradient(id = ""): [string, string] {
  return AV_GRADS[avHash(id) % AV_GRADS.length];
}

export { AV_GRADS };
