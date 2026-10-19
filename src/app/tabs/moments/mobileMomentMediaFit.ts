/** Match the native viewer: fill similarly shaped screens, preserve other formats. */
export function mobileMomentMediaFit(aspect: number, width: number, height: number): "cover" | "contain" {
  if (aspect <= 0 || width <= 0 || height <= 0) return "contain";
  return Math.abs(aspect / (width / height) - 1) <= 0.25 ? "cover" : "contain";
}
