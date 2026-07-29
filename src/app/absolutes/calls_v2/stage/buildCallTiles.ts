/* eslint-disable @typescript-eslint/no-explicit-any */
import { CallTileData } from "./types";

interface Participant {
  clientId: string;
  username: string;
}

interface VideoConsumerEntry {
  id: string;
  consumer: any;
  ownerClientId: string | null;
  source?: string | null;
}

interface BuildCallTilesArgs {
  mediaStream: MediaStream | null;
  enableCamera: boolean;
  enableMic: boolean;
  screenStream: MediaStream | null;
  videoConsumers: VideoConsumerEntry[];
  /** Participants who have joined but have no live video consumer yet. */
  waitingParticipants: Participant[];
  participantByClientId: Map<string, Participant>;
  participantStatuses: Map<string, { muted: boolean; cameraOff: boolean }>;
}

/**
 * Builds the ordered tile list every call surface renders.
 *
 * Order is the priority order the stage relies on: shared screens first (a
 * screen share is what the call is *about*, so it leads the grid and is what
 * the spotlight auto-focuses), then your own camera, then everyone else's
 * cameras, then the not-yet-publishing placeholders. Same ordering the mobile
 * client uses in active_call_view.dart's _buildTiles.
 */
export function buildCallTiles({
  mediaStream,
  enableCamera,
  enableMic,
  screenStream,
  videoConsumers,
  waitingParticipants,
  participantByClientId,
  participantStatuses,
}: BuildCallTilesArgs): CallTileData[] {
  const remoteScreens = videoConsumers.filter(
    (entry) => entry.source === "screen",
  );
  const remoteCameras = videoConsumers.filter(
    (entry) => entry.source !== "screen",
  );

  const remoteTile = (entry: VideoConsumerEntry): CallTileData => {
    const owner = entry.ownerClientId
      ? participantByClientId.get(entry.ownerClientId)
      : null;
    const status = entry.ownerClientId
      ? participantStatuses.get(entry.ownerClientId)
      : null;
    const name = owner ? `@${owner.username}` : "Participant";
    const isScreen = entry.source === "screen";

    return {
      key: entry.id,
      kind: "remote",
      label: isScreen ? `${name} • screen` : name,
      isScreen,
      muted: Boolean(status?.muted),
      cameraOff: Boolean(status?.cameraOff),
      // A camera-off participant still has a (paused) consumer — show the
      // placeholder rather than a frozen last frame. A screen share is never
      // affected by the camera toggle.
      hasVideo: isScreen || !status?.cameraOff,
      consumer: entry.consumer,
    };
  };

  const tiles: CallTileData[] = [];

  remoteScreens.forEach((entry) => tiles.push(remoteTile(entry)));

  if (screenStream) {
    tiles.push({
      key: "self-screen",
      kind: "self",
      label: "You • screen",
      isScreen: true,
      muted: !enableMic,
      cameraOff: false,
      hasVideo: true,
      stream: screenStream,
    });
  }

  tiles.push({
    key: "self",
    kind: "self",
    label: "You",
    isScreen: false,
    muted: !enableMic,
    cameraOff: !enableCamera,
    hasVideo: Boolean(mediaStream) && enableCamera,
    mirror: true,
    stream: mediaStream,
  });

  remoteCameras.forEach((entry) => tiles.push(remoteTile(entry)));

  waitingParticipants.forEach((participant) => {
    const status = participantStatuses.get(participant.clientId);
    tiles.push({
      key: `placeholder-${participant.clientId}`,
      kind: "placeholder",
      label: `@${participant.username}`,
      isScreen: false,
      muted: Boolean(status?.muted),
      cameraOff: Boolean(status?.cameraOff),
      hasVideo: false,
    });
  });

  return tiles;
}
