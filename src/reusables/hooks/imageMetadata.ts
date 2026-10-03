// Removing what a photo says about where, when and with what it was taken -
// EXIF (GPS position, time, camera, serial numbers), XMP, IPTC and comments -
// before it is uploaded.
//
// Nothing is re-encoded: only metadata blocks are dropped, and the image data
// is copied byte for byte, so quality and size are untouched. The one thing
// kept is the ORIENTATION, which says how to turn the picture upright (phones
// store portrait photos sideways and rely on it). It is written back as a
// minimal EXIF block holding that single value.
//
// JPEG, PNG and WebP. Anything else, or a file that doesn't parse as what it
// claims, is uploaded exactly as it was.
//
// Mirrors chatterloop_app's lib/core/media/image_metadata.dart; the two
// should stay in step.

/** "Exif\0\0" - what opens an EXIF block inside a JPEG. */
const EXIF_HEADER = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00];

const startsWith = (bytes: Uint8Array, at: number, prefix: number[]) =>
  prefix.every((b, i) => bytes[at + i] === b);

const ascii = (text: string) => Array.from(text, (c) => c.charCodeAt(0));

/**
 * The orientation (1-8) recorded in a TIFF structure - the body of every
 * EXIF block - or null when it has none.
 */
const readOrientation = (tiff: Uint8Array): number | null => {
  if (tiff.length < 8) return null;
  const little = tiff[0] === 0x49 && tiff[1] === 0x49; // "II"
  if (!little && !(tiff[0] === 0x4d && tiff[1] === 0x4d)) return null; // "MM"
  const view = new DataView(tiff.buffer, tiff.byteOffset, tiff.byteLength);
  const ifd = view.getUint32(4, little);
  if (ifd + 2 > tiff.length) return null;
  const count = view.getUint16(ifd, little);
  for (let i = 0; i < count; i++) {
    const entry = ifd + 2 + i * 12;
    if (entry + 12 > tiff.length) return null;
    if (view.getUint16(entry, little) === 0x0112) {
      const value = view.getUint16(entry + 8, little);
      return value >= 1 && value <= 8 ? value : null;
    }
  }
  return null;
};

/** A TIFF structure holding nothing but `orientation`. */
const orientationTiff = (orientation: number) =>
  new Uint8Array([
    0x4d, 0x4d, 0x00, 0x2a, // "MM", 42: big-endian TIFF
    0x00, 0x00, 0x00, 0x08, // the one IFD starts right after this header
    0x00, 0x01, // one entry:
    0x01, 0x12, 0x00, 0x03, // Orientation, SHORT
    0x00, 0x00, 0x00, 0x01, // one value
    0x00, orientation, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, // no further IFD
  ]);

/** Worth writing back: 1 means "already upright", the same as having none. */
const keepsOrientation = (orientation: number | null): orientation is number =>
  orientation !== null && orientation !== 1;

const concat = (parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
};

// ---- JPEG ----

/**
 * Keeps the segments the picture needs to decode and look right - JFIF, the
 * colour profile (APP2 ICC_PROFILE), Adobe's colour-transform flag (APP14) and
 * every non-APP segment - and drops all other APPn segments and comments.
 * Anything after the end-of-image marker goes too: phone cameras append
 * extra data there (motion-photo clips, secondary images, vendor trailers).
 */
const stripJpeg = (bytes: Uint8Array): Uint8Array | null => {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  const kept: Uint8Array[] = [];
  let orientation: number | null = null;
  let changed = false;
  let insertAt = 1; // after SOI, or after a leading JFIF segment
  let pos = 2;

  for (;;) {
    if (pos + 4 > bytes.length || bytes[pos] !== 0xff) return null;
    const marker = bytes[pos + 1];
    if (marker === 0xff) {
      pos += 1; // a fill byte
      continue;
    }
    if (marker === 0xda) {
      // Start of scan: the image data. It runs to the end-of-image marker -
      // the first FF D9, since an FF inside image data is always followed by
      // 00 or a restart marker.
      let end = pos + 2;
      while (end + 1 < bytes.length && !(bytes[end] === 0xff && bytes[end + 1] === 0xd9)) {
        end++;
      }
      if (end + 1 >= bytes.length) return null;
      if (end + 2 < bytes.length) changed = true;
      kept.push(bytes.subarray(pos, end + 2));
      break;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      kept.push(bytes.subarray(pos, pos + 2));
      pos += 2;
      continue;
    }
    const length = (bytes[pos + 2] << 8) | bytes[pos + 3];
    const end = pos + 2 + length;
    if (length < 2 || end > bytes.length) return null;
    const segment = bytes.subarray(pos, end);
    const body = pos + 4;

    let keep: boolean;
    if (marker === 0xe0) {
      keep = startsWith(bytes, body, ascii("JFIF\0"));
      if (keep && kept.length === 0) insertAt = 2;
    } else if (marker === 0xe1) {
      if (startsWith(bytes, body, EXIF_HEADER)) {
        orientation ??= readOrientation(bytes.subarray(body + 6, end));
      }
      keep = false;
    } else if (marker === 0xe2) {
      keep = startsWith(bytes, body, ascii("ICC_PROFILE\0"));
    } else if (marker === 0xee) {
      keep = startsWith(bytes, body, ascii("Adobe"));
    } else if ((marker >= 0xe3 && marker <= 0xef) || marker === 0xfe) {
      keep = false;
    } else {
      keep = true;
    }
    if (keep) kept.push(segment);
    else changed = true;
    pos = end;
  }

  if (!changed) return null;
  const parts = [bytes.subarray(0, 2), ...kept];
  if (keepsOrientation(orientation)) {
    const tiff = orientationTiff(orientation);
    const length = 2 + EXIF_HEADER.length + tiff.length;
    const exif = concat([
      new Uint8Array([0xff, 0xe1, length >> 8, length & 0xff, ...EXIF_HEADER]),
      tiff,
    ]);
    parts.splice(insertAt, 0, exif);
  }
  return concat(parts);
};

// ---- PNG ----

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

const crc32 = (bytes: Uint8Array) => {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
/** Text, timestamps and EXIF - none of them needed to draw the image. */
const PNG_METADATA = new Set(["eXIf", "tEXt", "zTXt", "iTXt", "tIME"]);

const pngChunk = (type: string, data: Uint8Array) => {
  const typed = concat([new Uint8Array(ascii(type)), data]);
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  out.set(typed, 4);
  view.setUint32(8 + data.length, crc32(typed));
  return out;
};

const stripPng = (bytes: Uint8Array): Uint8Array | null => {
  if (!startsWith(bytes, 0, PNG_SIGNATURE)) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const kept: Uint8Array[] = [];
  let orientation: number | null = null;
  let changed = false;
  let pos = 8;

  for (;;) {
    if (pos + 12 > bytes.length) return null;
    const length = view.getUint32(pos);
    const type = String.fromCharCode(...bytes.subarray(pos + 4, pos + 8));
    const end = pos + 12 + length;
    if (end > bytes.length) return null;
    if (PNG_METADATA.has(type)) {
      if (type === "eXIf") {
        orientation ??= readOrientation(bytes.subarray(pos + 8, pos + 8 + length));
      }
      changed = true;
    } else {
      kept.push(bytes.subarray(pos, end));
    }
    pos = end;
    if (type === "IEND") {
      if (pos < bytes.length) changed = true;
      break;
    }
  }

  if (!changed) return null;
  // eXIf has to come before the image data; right after IHDR always is.
  if (keepsOrientation(orientation)) {
    kept.splice(1, 0, pngChunk("eXIf", orientationTiff(orientation)));
  }
  return concat([bytes.subarray(0, 8), ...kept]);
};

// ---- WebP ----

const stripWebp = (bytes: Uint8Array): Uint8Array | null => {
  if (!startsWith(bytes, 0, ascii("RIFF")) || !startsWith(bytes, 8, ascii("WEBP"))) {
    return null;
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const kept: Uint8Array[] = [];
  let orientation: number | null = null;
  let changed = false;
  let vp8x: Uint8Array | null = null;
  let pos = 12;

  while (pos + 8 <= bytes.length) {
    const type = String.fromCharCode(...bytes.subarray(pos, pos + 4));
    const size = view.getUint32(pos + 4, true);
    const end = pos + 8 + size + (size & 1);
    if (end > bytes.length) return null;
    if (type === "EXIF" || type === "XMP ") {
      if (type === "EXIF") {
        let tiff = bytes.subarray(pos + 8, pos + 8 + size);
        // Some writers put JPEG's "Exif\0\0" in front.
        if (startsWith(tiff, 0, EXIF_HEADER)) tiff = tiff.subarray(6);
        orientation ??= readOrientation(tiff);
      }
      changed = true;
    } else {
      // A copy, so the flags can be changed without touching the original.
      const chunk = bytes.slice(pos, end);
      if (type === "VP8X") vp8x = chunk;
      kept.push(chunk);
    }
    pos = end;
  }

  if (!changed) return null;
  const keep = keepsOrientation(orientation);
  if (vp8x) {
    // Flags: 0x08 = has EXIF, 0x04 = has XMP.
    vp8x[8] = (vp8x[8] & ~0x0c) | (keep ? 0x08 : 0);
  }
  if (vp8x && keepsOrientation(orientation)) {
    const tiff = orientationTiff(orientation);
    const header = new Uint8Array(8);
    header.set(ascii("EXIF"));
    new DataView(header.buffer).setUint32(4, tiff.length, true);
    kept.push(header, tiff); // EXIF belongs after the image data
  }
  const body = concat(kept);
  const out = new Uint8Array(12 + body.length);
  out.set(bytes.subarray(0, 12));
  new DataView(out.buffer).setUint32(4, 4 + body.length, true);
  out.set(body, 12);
  return out;
};

/**
 * `bytes` without their metadata, or null when there was nothing to remove
 * (or the format isn't one handled here).
 */
export const stripMetadataBytes = (
  bytes: Uint8Array,
  type: string,
): Uint8Array | null => {
  try {
    if (type === "image/jpeg") return stripJpeg(bytes);
    if (type === "image/png") return stripPng(bytes);
    if (type === "image/webp") return stripWebp(bytes);
  } catch {
    // A malformed file: sent as it is rather than not at all.
  }
  return null;
};

/** `file` without its metadata - the same File when there was none. */
export const stripImageMetadata = async (file: File): Promise<File> => {
  const type = (file.type || "").toLowerCase();
  if (!["image/jpeg", "image/png", "image/webp"].includes(type)) return file;
  const stripped = stripMetadataBytes(new Uint8Array(await file.arrayBuffer()), type);
  if (!stripped) return file;
  return new File([stripped as Uint8Array<ArrayBuffer>], file.name, {
    type: file.type,
    lastModified: file.lastModified,
  });
};
