import envs from "@/reusables/hooks/env_configs";

// The one upload size cap, for every surface that attaches a file.
//
// One constant because the number has to match the SERVER's - the multipart
// parsers on /posts/upload and /users/sendFiles both reject anything larger
// (server/reusables/vars/uploads.js). A client check that is more permissive
// than the server's just means the user waits for the whole upload before
// being told no; five separate copies of it here (post composer, profile/cover
// media, diary attachments, and both conversation views) means they eventually
// disagree with each other too.
//
// Env-driven via VITE_MAX_UPLOAD_FILE_SIZE_MB so a deployment can change the
// limit without a code change, with a hardcoded fallback so a missing or
// malformed value can never leave the app with no cap - or with a cap of 0,
// which would silently reject every file. Set it to the same value as the
// server's MAX_UPLOAD_FILE_SIZE_MB.
const DEFAULT_MAX_UPLOAD_MB = 100;

function resolveMaxUploadMb(): number {
  const raw = envs.MAX_UPLOAD_FILE_SIZE_MB;
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    return DEFAULT_MAX_UPLOAD_MB;
  }

  // Vite hands every env value over as a string; Number("") is 0 and
  // Number("100mb") is NaN, so both have to fall back rather than become a cap
  // that rejects everything.
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    console.warn(
      `[uploads] VITE_MAX_UPLOAD_FILE_SIZE_MB="${raw}" is not a positive ` +
        `number; falling back to ${DEFAULT_MAX_UPLOAD_MB}MB`,
    );
    return DEFAULT_MAX_UPLOAD_MB;
  }
  return parsed;
}

export const MAX_UPLOAD_MB = resolveMaxUploadMb();
export const MAX_UPLOAD_BYTES = Math.floor(MAX_UPLOAD_MB * 1024 * 1024);

/** For user-facing copy - "Cannot upload files greater than 100mb". */
export const MAX_UPLOAD_LABEL = `${MAX_UPLOAD_MB}mb`;
