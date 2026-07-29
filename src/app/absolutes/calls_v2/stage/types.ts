/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * One tile = one video SOURCE in the call: your own camera, your shared
 * screen, every remote participant's camera AND screen (each is its own
 * mediasoup consumer, so each gets its own tile bound to its own track),
 * plus a placeholder for anyone who has joined but has no live video yet.
 *
 * The three call surfaces (CallWindow, VoiceWindow, ConferenceVoiceWindow)
 * all describe their participants with this shape and hand the list to
 * CallStage, which owns every layout decision from there.
 */
export type CallTileKind = "self" | "remote" | "placeholder";

export interface CallTileData {
  /** Stable across re-orders — producerId for remote tiles. */
  key: string;
  kind: CallTileKind;
  /** "You" / "@username" / "Participant". */
  label: string;
  /** Screen shares lead the stage and get the spotlight by default. */
  isScreen: boolean;
  muted: boolean;
  cameraOff: boolean;
  /** True only when there is an actual track to paint. */
  hasVideo: boolean;
  /** Mirror the local camera preview, never a screen or a remote. */
  mirror?: boolean;
  /** Local tiles (own camera / own screen share). */
  stream?: MediaStream | null;
  /** Remote tiles (mediasoup consumer). */
  consumer?: any;
}
