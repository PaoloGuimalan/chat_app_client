import { useSyncExternalStore } from "react";
import envs from "./env_configs";
import { firstPartyClient } from "./requests";
import { stripImageMetadata } from "./imageMetadata";
import {
  UploadFeature,
  limitFor,
  transferSettings,
  typeAllowed,
} from "../vars/uploads";

// Direct uploads: the bytes go straight from the browser to storage, never
// through our server.
//
//   0. strip a photo's location and camera details (imageMetadata.ts)
//   1. ask   POST /media/uploads - one signed link, or one per part for big
//            files (server/routes/media/index.js)
//   2. send  PUT each link - several parts at once, each retried on its own
//   3. done  POST /media/uploads/complete - the server checks what arrived
//            and joins a big file's parts from storage's own list of them
//
// The links go to the storage provider, not to us, so they're sent with a
// plain XMLHttpRequest: no app headers or tokens, and upload progress (which
// fetch can't report).

export interface UploadedFile {
  uploadID: string;
  /** The file's public link. */
  fileUrl: string;
  name: string;
  mime: string;
  kind: "image" | "video" | "audio" | "file";
  size: number;
  /** For message uploads: the id the message will be created under. */
  messageID?: string;
}

interface Target {
  method: string;
  url: string;
  headers: Record<string, string>;
}

type PartTarget = Target & { n: number; size: number };

interface AskedUpload extends Partial<Target> {
  uploadID: string;
  name: string;
  fileUrl: string;
  messageID?: string;
  mode: "single" | "multipart";
  partSize?: number;
  parts?: PartTarget[];
}

export class UploadError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

const API = envs.CHATTERLOOP_API;
const PART_ATTEMPTS = 3;

const authHeaders = () => ({
  "x-access-token": localStorage.getItem("authtoken"),
});

const apiError = (err: any, fallback: string) =>
  new UploadError(
    err?.response?.data?.message || fallback,
    err?.response?.status,
  );

// ---- progress, readable from any component by a key (a pending message id) --

const progress = new Map<string, number>();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

const setProgress = (key: string | undefined, fraction: number | null) => {
  if (!key) return;
  if (fraction === null) progress.delete(key);
  else progress.set(key, fraction);
  notify();
};

/** 0..1 while `key`'s upload is under way, otherwise null. */
export const useUploadProgress = (key?: string | null): number | null =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => (key ? progress.get(key) ?? null : null),
  );

// ---- sending bytes ----

/** One PUT. Rejects with the HTTP status. */
const put = (
  target: Target,
  body: Blob,
  onBytes: (loaded: number) => void,
  signal?: AbortSignal,
) =>
  new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(target.method || "PUT", target.url);
    for (const [name, value] of Object.entries(target.headers || {})) {
      xhr.setRequestHeader(name, value);
    }
    xhr.upload.onprogress = (e) => onBytes(e.loaded);
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new UploadError(`Upload failed (${xhr.status})`, xhr.status));
    xhr.onerror = () => reject(new UploadError("Network error"));
    xhr.onabort = () => reject(new UploadError("Upload cancelled", 0));
    signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(body);
  });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Sends one file to its link(s). */
const sendFile = async (
  asked: AskedUpload,
  file: File,
  onBytes: (loaded: number) => void,
  signal?: AbortSignal,
) => {
  if (asked.mode === "single") {
    await put(asked as Target, file, onBytes, signal);
    return;
  }

  const partSize = asked.partSize!;
  const parts = [...(asked.parts || [])];
  const loaded = new Map<number, number>();
  const report = () =>
    onBytes([...loaded.values()].reduce((sum, n) => sum + n, 0));

  const sendPart = async (part: PartTarget) => {
    const start = (part.n - 1) * partSize;
    const blob = file.slice(start, start + part.size);
    let target: Target = part;
    for (let attempt = 1; ; attempt++) {
      try {
        await put(
          target,
          blob,
          (n) => {
            loaded.set(part.n, n);
            report();
          },
          signal,
        );
        return;
      } catch (err: any) {
        if (signal?.aborted || attempt >= PART_ATTEMPTS) throw err;
        loaded.set(part.n, 0);
        report();
        // A refused link has usually expired: ask for a fresh one.
        if (err.status === 403) {
          const fresh = await firstPartyClient.post(
            `${API}/media/uploads/${asked.uploadID}/parts`,
            { parts: [part.n] },
            { headers: authHeaders() },
          );
          target = fresh.data.parts?.[0] ?? target;
        }
        await sleep(1000 * attempt);
      }
    }
  };

  // A few parts at a time; each worker takes the next part when it's done.
  const workers = Array.from(
    { length: Math.min(transferSettings().concurrency, parts.length) },
    async () => {
      while (parts.length) {
        await sendPart(parts.shift()!);
      }
    },
  );
  await Promise.all(workers);
};

/**
 * Uploads `files` for `purpose` and resolves what was stored, in order.
 *
 * `context` says where they belong: { conversationID } for message files,
 * { realmID } for a realm's avatar or cover. `progressKeys` (one per file,
 * e.g. pending message ids) make each file's progress readable through
 * useUploadProgress; `onProgress` gets the overall fraction.
 */
export const uploadFiles = async ({
  purpose,
  files,
  context,
  progressKeys = [],
  onProgress,
  signal,
}: {
  purpose: UploadFeature;
  files: File[];
  context?: { conversationID?: string; realmID?: string };
  progressKeys?: (string | undefined)[];
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
}): Promise<UploadedFile[]> => {
  const limit = limitFor(purpose);
  // Before anything else: the size declared below is the stripped file's.
  files = await Promise.all(files.map(stripImageMetadata));
  for (const file of files) {
    if (file.size > limit.maxBytes) {
      throw new UploadError(`Files here can be at most ${limit.label}`, 413);
    }
    if (!typeAllowed(file.type || "application/octet-stream", limit.types)) {
      throw new UploadError("This type of file can't be uploaded here", 415);
    }
  }

  let asked: AskedUpload[];
  try {
    const response = await firstPartyClient.post(
      `${API}/media/uploads`,
      {
        purpose,
        context,
        files: files.map((f) => ({
          name: f.name,
          size: f.size,
          type: f.type || "application/octet-stream",
        })),
      },
      { headers: authHeaders() },
    );
    asked = response.data.uploads;
  } catch (err) {
    throw apiError(err, "Couldn't start the upload");
  }

  const total = files.reduce((sum, f) => sum + f.size, 0) || 1;
  const sent = files.map(() => 0);
  const tick = (i: number, loaded: number) => {
    sent[i] = Math.min(loaded, files[i].size);
    setProgress(progressKeys[i], files[i].size ? sent[i] / files[i].size : 1);
    onProgress?.(sent.reduce((a, b) => a + b, 0) / total);
  };

  try {
    const finished = await Promise.all(
      asked.map(async (upload, i) => {
        await sendFile(upload, files[i], (n) => tick(i, n), signal);
        return { uploadID: upload.uploadID };
      }),
    );

    let results: any[];
    try {
      const response = await firstPartyClient.post(
        `${API}/media/uploads/complete`,
        { uploads: finished },
        { headers: authHeaders() },
      );
      results = response.data.results;
    } catch (err) {
      throw apiError(err, "Couldn't finish the upload");
    }
    const failed = results.find((r) => !r.ok);
    if (failed) throw new UploadError(failed.message, failed.status);
    return results as UploadedFile[];
  } catch (err) {
    // Drop what never finished, so it doesn't wait for the cleanup job.
    asked.forEach((upload) =>
      firstPartyClient
        .delete(`${API}/media/uploads/${upload.uploadID}`, {
          headers: authHeaders(),
        })
        .catch(() => {}),
    );
    throw err;
  } finally {
    progressKeys.forEach((key) => setProgress(key, null));
  }
};
