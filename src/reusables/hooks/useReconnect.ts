/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * useReconnect
 *
 * Monitors mediasoup send/recv transport connection state and triggers a
 * full-rejoin when a transport enters "failed" or stays "disconnected" beyond
 * a grace period.
 *
 * Strategy: full rejoin (no ICE restart)
 * - ICE restart only helps when the STUN/TURN path changes but the server-side
 *   transport is still alive. On entry-level servers with unstable connections
 *   the server-side transport is usually dead too, so a full rejoin is more
 *   reliable and simpler to reason about.
 *
 * Backoff: 2s → 4s → 8s (3 attempts), then gives up to avoid battery drain.
 */

import { useCallback, useEffect, useRef } from "react";
import { ReconnectStaleCallerSessionRequest } from "./requests";

const DISCONNECT_GRACE_MS = 4_000; // wait before treating "disconnected" as fatal
const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 2_000;

interface ReconnectOptions {
  conversationID: string;
  clientId: string;
  instance: string | null;
  sendTransport: any;
  recvTransport: any;
  /** Called to tear down local transport/producer state before rejoining */
  onBeforeRejoin: () => void;
  /** Called to kick off the join-room → create-transport sequence again */
  onRejoin: () => void;
  /** Whether the call has already been intentionally left */
  hasLeft: boolean;
}

export function useReconnect({
  conversationID,
  clientId,
  instance,
  sendTransport,
  recvTransport,
  onBeforeRejoin,
  onRejoin,
  hasLeft,
}: ReconnectOptions) {
  const attemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const disconnectGraceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const isReconnectingRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (disconnectGraceTimerRef.current) {
      clearTimeout(disconnectGraceTimerRef.current);
      disconnectGraceTimerRef.current = null;
    }
  }, []);

  const triggerRejoin = useCallback(async () => {
    if (hasLeft || isReconnectingRef.current) return;
    if (attemptsRef.current >= MAX_ATTEMPTS) {
      console.warn("[Reconnect] Max attempts reached, giving up.");
      return;
    }

    isReconnectingRef.current = true;
    attemptsRef.current += 1;
    const delay = BASE_BACKOFF_MS * Math.pow(2, attemptsRef.current - 1);

    console.log(
      `[Reconnect] Attempt ${attemptsRef.current}/${MAX_ATTEMPTS} in ${delay}ms`,
    );

    reconnectTimerRef.current = setTimeout(async () => {
      try {
        // 1. Tell the server to evict the stale session silently
        await ReconnectStaleCallerSessionRequest(
          conversationID,
          clientId,
          instance,
        );
      } catch (err) {
        console.warn(
          "[Reconnect] Evict request failed, proceeding anyway:",
          err,
        );
      }

      // 2. Tear down local transport/producer state
      onBeforeRejoin();

      // 3. Re-run the join-room flow — server's joinRoom will detect the same
      //    clientId and treat it as a reconnect (no participant-left broadcast)
      onRejoin();

      isReconnectingRef.current = false;
    }, delay);
  }, [conversationID, clientId, instance, hasLeft, onBeforeRejoin, onRejoin]);

  const handleStateChange = useCallback(
    (state: string, transportLabel: string) => {
      if (hasLeft) return;

      console.log(
        `[Reconnect] ${transportLabel} connectionstatechange: ${state}`,
      );

      if (state === "connected") {
        // Successfully (re)connected — reset attempt counter and clear any timers
        clearTimers();
        attemptsRef.current = 0;
        isReconnectingRef.current = false;
        return;
      }

      if (state === "failed") {
        // ICE has definitively failed — trigger rejoin immediately (with backoff)
        clearTimers();
        triggerRejoin();
        return;
      }

      if (state === "disconnected") {
        // Transient drop — give it a grace period before treating as fatal
        // (mobile networks often recover within a few seconds)
        disconnectGraceTimerRef.current = setTimeout(() => {
          triggerRejoin();
        }, DISCONNECT_GRACE_MS);
        return;
      }
    },
    [hasLeft, clearTimers, triggerRejoin],
  );

  // Attach connectionstatechange to send transport
  useEffect(() => {
    if (!sendTransport) return;
    const handler = (state: string) =>
      handleStateChange(state, "sendTransport");
    sendTransport.on("connectionstatechange", handler);
    // mediasoup-client's Transport extends EnhancedEventEmitter, which DOES
    // expose off()/removeListener() (confirmed against node_modules/
    // mediasoup-client/lib/enhancedEvents.js) - the previous no-op cleanup
    // here was simply wrong, not a real platform limitation. Without this,
    // every re-run of this effect (sendTransport or handleStateChange
    // changing identity - e.g. on every roster/participant re-render, which
    // happens a lot during a call's setup) stacked ANOTHER listener on the
    // same transport instead of replacing it, so a single real state change
    // could fire handleStateChange - and therefore triggerRejoin - multiple
    // times concurrently. That reproduces exactly as observed: repeated
    // "sendTransport connectionstatechange: connecting/connected" cycles
    // with fresh producers recreated each time, which in turn corrupted
    // consume attempts on both ends (mobile calling app testing surfaced
    // this via "no a=setup found"/"Failed to setup RTCP mux" errors).
    return () => {
      sendTransport.off("connectionstatechange", handler);
    };
  }, [sendTransport, handleStateChange]);

  // Attach connectionstatechange to recv transport
  useEffect(() => {
    if (!recvTransport) return;
    const handler = (state: string) =>
      handleStateChange(state, "recvTransport");
    recvTransport.on("connectionstatechange", handler);
    return () => {
      recvTransport.off("connectionstatechange", handler);
    };
  }, [recvTransport, handleStateChange]);

  // Clean up all timers on unmount or intentional leave
  useEffect(() => {
    if (hasLeft) {
      clearTimers();
      attemptsRef.current = 0;
      isReconnectingRef.current = false;
    }
  }, [hasLeft, clearTimers]);
}
