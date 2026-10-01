/**
 * Every mounted VideoPlayer, so players showing the SAME video can coordinate.
 *
 * Videos otherwise play independently, as in a browser - several at once is
 * fine. Two rules are about one video shown in two places:
 *
 * - It never plays twice. A post's modal, a reply quote or the full-screen
 *   viewer all mount their own <video> of a clip that may already be playing
 *   in the feed or the chat; starting one pauses the others (pauseDuplicates).
 * - It can carry on where it is opened. A player that continues playback (the
 *   post modal's carousel) takes over the clip's position and play state from
 *   the copy that had it, and gives them back when it closes (claimPlayback).
 *   The mobile app gets this for free by sharing one controller per URL.
 */

export interface PlaybackState {
  time: number;
  playing: boolean;
  muted: boolean;
}

export interface PlaybackEntry {
  src: string;
  video: () => HTMLVideoElement | null;
  /** Hands this copy's playback to another player: pause and stand by. */
  suspend: () => void;
  /** Takes it back. */
  resume: (state: PlaybackState) => void;
  /** When the viewer last played, paused or seeked it. */
  lastActive: number;
}

export interface PlaybackClaim {
  state: PlaybackState;
  handBack: (state: PlaybackState) => void;
}

const entries = new Set<PlaybackEntry>();

export function registerPlayback(entry: PlaybackEntry) {
  entries.add(entry);
  return () => {
    entries.delete(entry);
  };
}

export function readPlayback(video: HTMLVideoElement): PlaybackState {
  return {
    time: video.currentTime,
    playing: !video.paused && !video.ended,
    muted: video.muted,
  };
}

/** Called as `self` starts: other copies of the same video stop. */
export function pauseDuplicates(self: PlaybackEntry) {
  entries.forEach((entry) => {
    if (entry === self || entry.src !== self.src) return;
    const video = entry.video();
    if (video && !video.paused) video.pause();
  });
}

/**
 * Takes over the same video from wherever it is already playing - or, failing
 * that, from the copy most recently watched part-way. Null when no copy has
 * been started, which leaves the claimer at the beginning as usual.
 */
export function claimPlayback(self: PlaybackEntry): PlaybackClaim | null {
  let source: PlaybackEntry | null = null;
  for (const entry of entries) {
    if (entry === self || entry.src !== self.src) continue;
    const video = entry.video();
    if (!video) continue;
    if (!video.paused) {
      source = entry;
      break;
    }
    if (
      video.currentTime > 0 &&
      (!source || entry.lastActive > source.lastActive)
    ) {
      source = entry;
    }
  }
  const video = source?.video();
  if (!source || !video) return null;

  const state = readPlayback(video);
  source.suspend();
  const from = source;
  return {
    state,
    // The copy may have unmounted meanwhile (the feed paged it out).
    handBack: (next) => {
      if (entries.has(from)) from.resume(next);
    },
  };
}

/**
 * Starts a video. Autoplay asks for sound first, as the mobile app plays with
 * sound; a browser that refuses sound before the page has had a click
 * (NotAllowedError) gets a muted start instead, which every browser allows.
 */
export function startPlayback(video: HTMLVideoElement, mutedFallback: boolean) {
  const attempt = video.play();
  if (!attempt) return;
  attempt.catch((error: DOMException) => {
    // AbortError is a pause() landing before play() resolved - not a failure.
    if (error?.name !== "NotAllowedError" || !mutedFallback || video.muted) {
      return;
    }
    video.muted = true;
    video.play().catch(() => {});
  });
}

/** Puts a video where a claimed or handed-back state says it was. */
export function applyPlayback(video: HTMLVideoElement, state: PlaybackState) {
  video.muted = state.muted;
  // Before metadata this sets the start position, which the browser applies
  // once the video loads.
  if (Math.abs(video.currentTime - state.time) > 0.25) {
    video.currentTime = state.time;
  }
  if (state.playing) startPlayback(video, true);
  else if (!video.paused) video.pause();
}
