/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { firstPartyClient } from "./requests";
import envs from "./env_configs";
import {
  INotificationAction,
  INotificationRedirect,
  INotificationV2,
} from "../vars/interfaces";

// Executes the server-driven notification buttons and resolves the row's
// destination, for the WEB client specifically.
//
// The server sends one entry per platform (web/android/ios) in flat arrays;
// each client filters to its own and renders that. Everything it does not
// recognise it skips - which is what lets the server introduce an action type
// without breaking already-deployed clients.

const PLATFORM = "web" as const;

const API = envs.CHATTERLOOP_API;
const USER_SERVICE_API = envs.USER_SERVICE_API;

/** Buttons for this client, in render order. */
export const webActions = (n: INotificationV2): INotificationAction[] =>
  (n.actions ?? [])
    .filter((a) => a.platform === PLATFORM)
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

/** The row's destination, or null when there is none for this client. */
export const webRedirect = (n: INotificationV2): INotificationRedirect | null =>
  (n.redirects ?? []).find(
    (r) => r.platform === PLATFORM && !!r.route && r.route.trim().length > 0,
  ) ?? null;

const isAbsoluteUrl = (url: string) => /^[a-z][a-z0-9+.-]*:/i.test(url);

/**
 * A first-party path: leading slash, and NOT protocol-relative.
 *
 * Tested positively rather than as "not absolute". `//evil.tld/steal` carries
 * no scheme, so a not-absolute check waves it through - and while the current
 * string concatenation happens to defuse it (it lands as a path on our own
 * host), that safety is an accident of how the url is built. Anything later
 * switching to `new URL(url, base)` would resolve it to a different origin
 * with our token attached. Requiring the shape we actually want removes the
 * question rather than relying on the rest of the function staying still.
 */
const isFirstPartyPath = (url: string) =>
  url.startsWith("/") && !url.startsWith("//") && !isAbsoluteUrl(url);

/**
 * Only kinds this client can actually carry out, AND only in a shape that is
 * safe to carry out. An entry failing this renders no button at all, rather
 * than one that misbehaves when pressed.
 *
 * The two url rules are the security boundary, not tidiness:
 *
 *  - "api-request" must be a PATH. An absolute url would let a database row
 *    aim an authenticated request at a host of its choosing - and notification
 *    rows are generated from other users' actions, so that is a reachable path
 *    for an attacker, not a hypothetical. A path can only ever resolve against
 *    a base this bundle was built with.
 *
 *  - "external-api-request" must be ABSOLUTE, precisely so it can never be
 *    confused for a first-party call and pick up our credentials (see
 *    runNotificationAction).
 */
export const isRunnable = (a: INotificationAction) => {
  switch (a.type) {
    case "in-app-redirect":
      return !!a.route;
    case "external-redirect":
      return !!a.url && isAbsoluteUrl(a.url);
    case "api-request":
      return !!a.url && !!a.method && isFirstPartyPath(a.url);
    case "external-api-request":
      return !!a.url && !!a.method && isAbsoluteUrl(a.url);
    default:
      return false;
  }
};

/**
 * Base for an "api-request" path.
 *
 * `url` is a PATH, never absolute - the stack has two API bases and a path
 * alone cannot say which, hence `service`. Defaulting to the user service
 * matches where every currently-derived action points (contacts, follow).
 *
 * Keeping these as paths against a known base is also what stops a database
 * row being able to aim an authenticated request at an arbitrary host.
 */
const baseFor = (service: INotificationAction["service"]) =>
  service === "realtime" ? API : USER_SERVICE_API;

/**
 * A deliberately BARE axios instance for third-party calls.
 *
 * `firstPartyClient` carries request interceptors that attach X-Nonce and
 * Device-Token - both derived from this user (the nonce from their id, the
 * device token being a stable per-install identifier). Neither is an account
 * credential, but neither has any business being sent to a host a notification
 * row happened to name, so an external call goes through an instance that has
 * no interceptors registered on it at all.
 *
 * Created here rather than reusing the global `axios` default because the
 * default is shared: anything, anywhere, could register an interceptor on it
 * later and silently start decorating these requests.
 */
const externalClient = axios.create();

export interface ActionOutcome {
  ok: boolean;
  /** Set for redirect kinds so the caller can navigate/open. */
  navigateTo?: string;
  openExternal?: string;
  message?: string;
}

/**
 * Runs one action.
 *
 * Navigation kinds are RETURNED rather than performed here, so routing stays
 * with the component that owns a router - this module has no business calling
 * navigate() or touching window.location on a caller's behalf.
 */
export const runNotificationAction = async (
  action: INotificationAction,
): Promise<ActionOutcome> => {
  if (!isRunnable(action)) return { ok: false, message: "Unsupported action" };

  if (action.type === "in-app-redirect") {
    return { ok: true, navigateTo: action.route as string };
  }

  if (action.type === "external-redirect") {
    return { ok: true, openExternal: action.url as string };
  }

  // FIRST-PARTY vs EXTERNAL decides whether our credentials go along, and it is
  // decided structurally rather than by trusting the row's `type`: a
  // first-party call is a PATH resolved against a base compiled into this
  // bundle, so there is no url a database row could supply that would send our
  // token somewhere else.
  //
  // An external call carries NO session of ours. Our token is a bearer
  // credential for the whole account - handing it to a third party because a
  // notification row named them would be handing over the account, and
  // notification rows are generated from other users' actions. `withCredentials`
  // stays false for the same reason, so no cookie rides along either.
  const isExternal = action.type === "external-api-request";
  const url = isExternal
    ? (action.url as string)
    : `${baseFor(action.service)}${action.url}`;

  // The CLIENT is chosen by the same first-party/external split, so the two
  // concerns cannot drift apart: a first-party call gets the configured
  // instance (and therefore the nonce and device headers the API requires),
  // an external one gets an instance carrying nothing of ours.
  const client = isExternal ? externalClient : firstPartyClient;

  try {
    const response = await client.request({
      url,
      method: (action.method || "POST") as any,
      data: action.payload ?? undefined,
      withCredentials: false,
      headers: {
        ...(isExternal
          ? {}
          : { "x-access-token": localStorage.getItem("authtoken") || "" }),
        // Row-supplied headers. Needed for real actions - the contact and
        // follow endpoints both take approve/decline as an `action` header -
        // and applied last so an action can set what it needs, but never on a
        // request that is already carrying our credentials to somewhere else,
        // because the branch above has already decided that question.
        ...(action.headers || {}),
      },
    });
    return {
      ok: response.data?.status !== false,
      message: response.data?.message,
    };
  } catch (err: any) {
    return {
      ok: false,
      message: err?.response?.data?.message || "Something went wrong",
    };
  }
};
