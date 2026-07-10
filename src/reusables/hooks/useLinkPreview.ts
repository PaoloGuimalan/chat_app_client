/**
 * useLinkPreview
 *
 * Debounced "live preview while typing" for chat/comment/post/diary
 * composers - extracts the first URL from `text` (see extractFirstUrl in
 * reusable.ts), resolves it against the Django link-preview endpoint
 * (GetLinkPreviewRequest), and exposes dismiss/retry so the composer can
 * show a removable LinkPreviewCard before the user sends/saves.
 *
 * Persisted display surfaces (already-sent messages, saved posts/comments/
 * entries) don't use this hook - they render the link_preview field the
 * backend already attached to that content directly.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { extractFirstUrl } from "./reusable";
import { GetLinkPreviewRequest } from "./requests";

interface UseLinkPreviewOptions {
  text: string;
  debounceMs?: number;
  enabled?: boolean;
}

export type LinkPreviewStatus = "idle" | "loading" | "ok" | "failed";

export interface LinkPreviewData {
  url: string | null;
  resolved_url: string | null;
  title: string | null;
  description: string | null;
  image: string | null;
  site_name: string | null;
  favicon: string | null;
  /** Set for "playable media" providers (YouTube, Vimeo, SoundCloud, Spotify, TikTok, Twitter/X) - see newsfeed/services/link_preview.py's OEMBED_PROVIDERS */
  embed_type: "video" | "rich" | null;
  embed_url: string | null;
  embed_provider: string | null;
  embed_width: number | null;
  embed_height: number | null;
  /** How LinkPreviewCard should size the embed - see OEMBED_PROVIDERS' comment for what each means */
  embed_layout: "auto" | "landscape" | "portrait" | null;
  status: "ok" | "failed";
}

export function useLinkPreview({
  text,
  debounceMs = 600,
  enabled = true,
}: UseLinkPreviewOptions) {
  const [preview, setPreview] = useState<LinkPreviewData | null>(null);
  const [status, setStatus] = useState<LinkPreviewStatus>("idle");
  const [url, setUrl] = useState<string | null>(null);

  // Refs (not state) so the debounce effect below doesn't need to depend on
  // values it also writes - avoids re-running itself on every resolution.
  const lastAttemptedUrlRef = useRef<string | null>(null);
  const dismissedUrlRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resolve = useCallback((candidateUrl: string, forceRefresh = false) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    lastAttemptedUrlRef.current = candidateUrl;
    setUrl(candidateUrl);
    setStatus("loading");

    GetLinkPreviewRequest(
      { url: candidateUrl, force_refresh: forceRefresh },
      controller.signal,
    )
      .then((data: LinkPreviewData) => {
        if (controller.signal.aborted) return;
        setPreview(data);
        setStatus(data.status === "ok" ? "ok" : "failed");
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setStatus("failed");
      });
  }, []);

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (!enabled) {
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      const candidateUrl = extractFirstUrl(text);

      if (!candidateUrl) {
        lastAttemptedUrlRef.current = null;
        dismissedUrlRef.current = null;
        setUrl(null);
        setPreview(null);
        setStatus("idle");
        return;
      }

      if (
        candidateUrl === lastAttemptedUrlRef.current ||
        candidateUrl === dismissedUrlRef.current
      ) {
        return;
      }

      resolve(candidateUrl);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [text, enabled, debounceMs, resolve]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const dismiss = useCallback(() => {
    // Abort any in-flight resolve() - without this, a request started
    // before dismiss (e.g. the user hit Send while resolution was still in
    // flight) can resolve afterward and call setPreview/setStatus, popping
    // the card back up over an already-cleared/sent composer.
    abortControllerRef.current?.abort();
    dismissedUrlRef.current = url;
    setPreview(null);
    setStatus("idle");
  }, [url]);

  const retry = useCallback(() => {
    if (!url) return;
    resolve(url, true);
  }, [url, resolve]);

  return { preview, status, url, dismiss, retry };
}
