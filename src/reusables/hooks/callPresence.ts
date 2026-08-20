/**
 * Which calls THIS TAB is currently sitting in.
 *
 * The question "am I already on a call?" had no answer anywhere in the app.
 * `callslist` is the closest thing, but it only tracks CallWindow - a server
 * voice channel renders VoiceWindow directly and a conference renders
 * ConferenceVoiceWindow, neither of which touches callslist. So anything
 * keying off callslist reads "not in a call" for two of the three ways to be
 * in one, which is how an incoming-call alert could ring over a voice channel.
 *
 * Deliberately module state and not Redux: the only consumers are the SSE
 * handlers, which run outside React and would otherwise have to reach for
 * store.getState() anyway, and the three call surfaces, which register with
 * the hook below. Nothing renders off it, so there is nothing for a reducer
 * to buy us.
 *
 * Membership is scoped to the surface's MOUNT, not to its join handshake.
 * A call surface exists exactly as long as its participation does - it is
 * mounted when you enter and unmounted when you leave, including on the
 * teardown paths (rejection, remote hang-up, navigation) that never reach a
 * deliberate leave. Counting joins and leaves instead would drift, because
 * the reconnect path re-issues JoinRoomRequest for a call already in
 * progress.
 */

import { useEffect } from "react";

const activeCalls = new Set<string>();
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((listener) => listener());

/**
 * Watch for this tab entering or leaving a call.
 *
 * Needed because busy-ness can begin AFTER an alert is already on screen:
 * a call comes in while you are free, and before the 60s ringtone runs out
 * you answer a different one or step into a voice channel. Checking only at
 * arrival would leave that first alert ringing over the call you just
 * joined. Returns its own unsubscribe.
 */
export const subscribeCallPresence = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Register this tab as being in `conversationID`'s call. */
export const enterCall = (conversationID: string) => {
  if (!conversationID || activeCalls.has(conversationID)) return;
  activeCalls.add(conversationID);
  notify();
};

export const exitCall = (conversationID: string) => {
  if (!conversationID || !activeCalls.has(conversationID)) return;
  activeCalls.delete(conversationID);
  notify();
};

/** True while any call surface is mounted - call, voice channel or conference. */
export const isInAnyCall = () => activeCalls.size > 0;

export const isInCall = (conversationID: string) =>
  !!conversationID && activeCalls.has(conversationID);

export const activeCallIds = () => Array.from(activeCalls);

/**
 * One line for a call surface to declare itself. Mount registers, unmount
 * clears - so a surface torn down by any route, including the ones that never
 * run a deliberate leave, still stops counting as a live call.
 */
export const useCallPresence = (conversationID: string) => {
  useEffect(() => {
    if (!conversationID) return;
    enterCall(conversationID);
    return () => exitCall(conversationID);
  }, [conversationID]);
};
