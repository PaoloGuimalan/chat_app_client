/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * The one place that turns "a request failed" into words a person can act on.
 *
 * Neither backend answers in a single shape, so every call site used to guess
 * at one and end up showing `err.message` - which for Axios is the literal
 * string "Request failed with status code 401", and for a dropped connection
 * is "Network Error". What the servers actually send:
 *
 *   Django (user_service)
 *     {"status": false, "message": "..."}   the deliberate, human-written case
 *     {"detail": "..."}                     DRF permissions/auth/throttling,
 *                                           sometimes prefixed with a sentinel
 *                                           code (see CODE_MESSAGES)
 *     {"field": ["..."], ...}               DRF serializer validation
 *     {"error": "<python exception>"}       the 500 handlers in newsfeed/views
 *
 *   Node (server)
 *     {"status": false, "message": "..."}   most routes
 *     {"success": false, "message": "..."}  routes/messages
 *     {"error": "<node exception>"}         routes/webrtc, routes/realms
 *
 * Two of those carry raw exception text, which is both meaningless to a user
 * and a small information leak, so this module only ever repeats a server
 * string it judges presentable and falls back to its own copy otherwise.
 *
 * Nothing here talks to the backends - it is pure interpretation on the
 * client, which is why wiring it up touches no server code and leaves the
 * mobile app (which speaks to the same endpoints) completely unaffected.
 */
import axios from "axios";
import store from "../../redux/store";
import { SET_ALERTS } from "../../redux/types";

export type AlertType = "success" | "info" | "warning" | "error";

export const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";

const OFFLINE_MESSAGE =
  "You appear to be offline. Check your connection and try again.";
const UNREACHABLE_MESSAGE =
  "We couldn't reach Chatterloop. Check your connection and try again.";
const TIMEOUT_MESSAGE =
  "That took too long to respond. Check your connection and try again.";
const SERVER_MESSAGE =
  "Something went wrong on our end. Please try again in a moment.";

/**
 * Copy of last resort, per status. Only reached when the response carried
 * nothing presentable AND the caller passed no action-specific fallback.
 */
const STATUS_MESSAGES: Record<number, string> = {
  400: "We couldn't process that request. Check the details and try again.",
  401: "Your session has expired. Please sign in again.",
  403: "You don't have permission to do that.",
  404: "We couldn't find what you were looking for.",
  405: "That action isn't available here.",
  408: TIMEOUT_MESSAGE,
  409: "That conflicts with something that already exists.",
  410: "That is no longer available.",
  413: "That file is too large to upload.",
  415: "That file type isn't supported.",
  422: "Some of the details you entered aren't valid.",
  423: "That is locked right now. Please try again later.",
  429: "You're doing that a little too often. Wait a moment and try again.",
};

/**
 * Statuses whose meaning is sharper than anything the caller could say about
 * the attempt, so their copy outranks the caller's fallback when the body had
 * nothing of its own: being rate limited, refused outright, or handed a file
 * the server will not take are all specific and directly actionable, where
 * "We couldn't save those changes." is not.
 *
 * 401 is deliberately NOT here - the sign-in screens are where it mostly
 * lands, and "Your session has expired" is wrong advice there.
 */
const STATUS_OUTRANKS_FALLBACK = new Set([403, 413, 415, 429]);

/**
 * Sentinel codes user/backends.py prefixes onto DRF's `detail` when an
 * otherwise-valid session is refused for a compliance reason. The response
 * interceptor in requests.ts force-logs-out on these; the user still deserves
 * to be told why.
 */
const CODE_MESSAGES: Record<string, string> = {
  PROFILE_INCOMPLETE:
    "Finish setting up your profile to continue - we still need your birthdate and gender.",
  CONSENT_REQUIRED:
    "Please review and accept the latest Terms and Conditions to continue.",
  ACCOUNT_UNDERAGE:
    "This account doesn't meet the minimum age requirement for Chatterloop.",
  ACCOUNT_INACTIVE:
    "This account has been deactivated. Contact support if you think that's a mistake.",
};

/**
 * The terse strings the Django authentication backend and DRF raise for
 * session problems. They read like server logs, so each gets a plain-language
 * replacement. Keys are lowercased for matching.
 */
const DETAIL_MESSAGES: Record<string, string> = {
  "origin blocked":
    "This request was blocked. Please reload Chatterloop and try again.",
  "token not defined": "You need to be signed in to do that.",
  "authentication credentials were not provided.":
    "You need to be signed in to do that.",
  "no nonce defined":
    "We couldn't verify this request. Please reload the page and try again.",
  "error nonce":
    "We couldn't verify this request. Please reload the page and try again.",
  "invalid nonce":
    "We couldn't verify this request. Please reload the page and try again.",
  // The nonce carries a timestamp taken from THIS device (generateXNonce in
  // reusable.ts), and both backends reject anything more than a minute off
  // their own clock - Django with "Expired Nonce", Node with the phrasing
  // below. Repeating either verbatim tells the user nothing they can act on;
  // the device's own date & time setting is the entire fix.
  "expired nonce":
    "Your device's date & time appear to be off. Set them to update automatically, then try again.",
  "request expired. please sync your clock.":
    "Your device's date & time appear to be off. Set them to update automatically, then try again.",
  "device not recognized. try logging in again.":
    "We don't recognise this device. Please sign in again.",
  "device not logged in.":
    "This device has been signed out. Please sign in again.",
  "account does not exist": "We couldn't find an account for those details.",
  "error querying account": SERVER_MESSAGE,
  "you do not have permission to perform this action.":
    "You don't have permission to do that.",
  // The Node middleware's wording for a nonce it has already seen. True of
  // a genuine replay, but it also fires on an accidental double-submit, and
  // accusing someone of an attack is not the way to say "try that again".
  "replay attack detected!": "That request was already sent. Please try again.",
};

/**
 * Text that is plainly a server-side exception rather than a message meant for
 * a person. Django's login view and several Node route handlers stringify
 * whatever they caught straight into the response body, so this is the guard
 * that keeps "Account matching query does not exist." off the screen.
 */
const RAW_ERROR_SIGNATURES = [
  /matching query does not exist/i,
  /\btraceback\b/i,
  /\b(?:Key|Type|Value|Attribute|Index|Integrity|Operational|Runtime|Reference)Error\b/,
  /\bException\b/,
  /\bpsycopg\d?\b/i,
  /duplicate key value/i,
  /\bE(?:CONNREFUSED|CONNRESET|TIMEDOUT|NOTFOUND|HOSTUNREACH|PIPE)\b/,
  /\bat [\w$.<>]+ \(.*:\d+:\d+\)/,
  /\bundefined is not\b|\bis not a function\b|\bcannot read propert/i,
  /^\s*[[{<]/,
  /request failed with status code/i,
  /^network error$/i,
];

const MAX_PRESENTABLE_LENGTH = 300;

/** A server string is only repeated if it reads like a sentence, not a log. */
const isPresentable = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const text = value.trim();
  if (!text || text.length > MAX_PRESENTABLE_LENGTH) return false;
  return !RAW_ERROR_SIGNATURES.some((pattern) => pattern.test(text));
};

/**
 * Sentence-cases a backend string and gives it closing punctuation, so
 * "Gender is required" and "You cannot poke yourself" sit next to our own copy
 * without looking like a different app wrote them.
 */
const polish = (value: string) => {
  const text = value.trim().replace(/\s+/g, " ");
  if (!text) return text;
  const cased = text.charAt(0).toUpperCase() + text.slice(1);
  return /[.!?…]$/.test(cased) ? cased : `${cased}.`;
};

/** "profile_picture" -> "Profile picture", for DRF field-error keys. */
const humanizeFieldName = (field: string) =>
  polish(field.replace(/[_.]+/g, " ").trim()).replace(/\.$/, "");

const FIELDLESS_ERROR_KEYS = new Set([
  "non_field_errors",
  "detail",
  "message",
  "error",
  "__all__",
]);

/**
 * Keys that carry PAYLOAD rather than a complaint. Without this, a refusal
 * like `{"status": false, "result": [...]}` would have a sentence lifted out
 * of `result` and shown as if it were the reason.
 */
const NON_ERROR_KEYS = new Set([
  "status",
  "success",
  "result",
  "results",
  "data",
  "count",
  "next",
  "previous",
]);

/** Pulls the first usable sentence out of a DRF validation error value. */
const firstStringIn = (value: any, depth = 0): string | null => {
  if (isPresentable(value)) return value;
  if (depth >= 2) return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstStringIn(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) {
      const found = firstStringIn(item, depth + 1);
      if (found) return found;
    }
  }
  return null;
};

/**
 * Is this the SHAPE DRF gives a ValidationError - every remaining key mapping
 * to a message or a list of them?
 *
 * Checked before reading anything out, because describeFieldErrors is the
 * last resort in messageFromPayload and would otherwise happily rummage
 * through an ordinary response body and quote whatever string it found first.
 */
const looksLikeFieldErrors = (data: Record<string, any>) => {
  const entries = Object.entries(data).filter(
    ([field]) => !NON_ERROR_KEYS.has(field),
  );
  if (entries.length === 0) return false;
  return entries.every(([, value]) => {
    if (typeof value === "string") return true;
    if (Array.isArray(value))
      return value.every(
        (item) => typeof item === "string" || Array.isArray(item),
      );
    // One level of nesting, which is what a nested serializer produces.
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return Object.values(value).every(
        (item) => typeof item === "string" || Array.isArray(item),
      );
    }
    return false;
  });
};

/**
 * Turns `{"email": ["This field is required."], "gender": [...]}` into
 * "Email: This field is required. Gender: ..." - at most three fields, since
 * the alert is a small box and the form itself is still on screen.
 */
const describeFieldErrors = (data: Record<string, any>): string | null => {
  if (!looksLikeFieldErrors(data)) return null;
  const parts: string[] = [];
  for (const [field, value] of Object.entries(data)) {
    if (NON_ERROR_KEYS.has(field)) continue;
    const sentence = firstStringIn(value);
    if (!sentence) continue;
    parts.push(
      FIELDLESS_ERROR_KEYS.has(field)
        ? polish(sentence)
        : `${humanizeFieldName(field)}: ${polish(sentence)}`,
    );
    if (parts.length === 3) break;
  }
  return parts.length ? parts.join(" ") : null;
};

/**
 * Reads a body in the order the backends actually populate it. Returns null
 * when the body held nothing a person should be shown, which is the signal to
 * fall back to the caller's own copy.
 */
const messageFromPayload = (data: any): string | null => {
  if (!data) return null;

  if (Array.isArray(data)) {
    const sentence = firstStringIn(data);
    return sentence ? polish(sentence) : null;
  }

  // A string body is an HTML error page or a proxy's plain-text notice -
  // never something written for this user.
  if (typeof data !== "object") return null;

  if (typeof data.detail === "string") {
    const detail = data.detail.trim();
    const [code] = detail.split(":");
    if (CODE_MESSAGES[code]) return CODE_MESSAGES[code];
    const mapped = DETAIL_MESSAGES[detail.toLowerCase()];
    if (mapped) return mapped;
  }

  for (const key of ["message", "error", "detail"]) {
    const value = data[key];
    if (isPresentable(value)) {
      const mapped = DETAIL_MESSAGES[value.trim().toLowerCase()];
      return mapped ?? polish(value);
    }
  }

  const nested = data.errors ?? data.error;
  if (nested && typeof nested === "object") {
    const described = describeFieldErrors(nested);
    if (described) return described;
  }

  return describeFieldErrors(data);
};

export type ErrorDescription = {
  type: AlertType;
  content: string;
  /** HTTP status, or 0 when the request never got an answer. */
  status: number;
  /** True for cancelled/aborted requests, which are not worth alerting about. */
  silent: boolean;
};

/** 4xx is something the user can act on; anything else is on us. */
const alertTypeFor = (status: number): AlertType =>
  status >= 400 && status < 500 ? "warning" : "error";

/**
 * An error that already carries presentable copy in `.message`.
 *
 * Request helpers that reject rather than alert throw this, so the many call
 * sites that only ever read `err.message` become friendly without each one
 * having to learn about this module. `.response`/`.status`/`.data` are kept so
 * a caller that wants to branch on the status still can.
 */
export class RequestError extends Error {
  readonly status: number;
  readonly data: any;
  readonly response: any;
  readonly alertType: AlertType;
  readonly silent: boolean;
  readonly original: any;
  /**
   * A stable tag for callers that need to BRANCH on a specific failure rather
   * than just show it - marking the offending form field, say. Copy is written
   * for people and will be reworded; matching on `.message` to find out what
   * happened breaks the moment it is. Only set where a caller needs it.
   */
  readonly code?: string;

  constructor(description: ErrorDescription, original: any, code?: string) {
    super(description.content);
    this.name = "RequestError";
    this.status = description.status;
    this.alertType = description.type;
    this.silent = description.silent;
    this.original = original;
    this.response = original?.response;
    this.data = original?.response?.data;
    this.code = code;
    // Subclassing a built-in needs this whenever the class is transpiled
    // below ES6; harmless otherwise.
    Object.setPrototypeOf(this, RequestError.prototype);
  }
}

const isAbort = (error: any) =>
  axios.isCancel?.(error) ||
  error?.code === "ERR_CANCELED" ||
  error?.name === "CanceledError" ||
  error?.name === "AbortError";

/**
 * A request that never reached the server is a connection problem, not a
 * problem with what the user asked for, so the connection copy leads. The one
 * exception is a genuine client-side throw that already carries a real
 * sentence - Axios's own "Network Error" does not, and is filtered out by
 * RAW_ERROR_SIGNATURES.
 */
const describeTransportFailure = (error: any) => {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return OFFLINE_MESSAGE;
  }
  if (
    error?.code === "ECONNABORTED" ||
    error?.code === "ETIMEDOUT" ||
    /timeout/i.test(String(error?.message ?? ""))
  ) {
    return TIMEOUT_MESSAGE;
  }
  if (!error?.isAxiosError && isPresentable(error?.message)) {
    return polish(error.message);
  }
  return UNREACHABLE_MESSAGE;
};

/**
 * The single entry point: everything else in this file is in service of this.
 *
 * `fallback` is the caller's own description of what was being attempted
 * ("We couldn't save your changes.") and is used whenever the response itself
 * had nothing to say - it is almost always more useful than generic status
 * copy, so it wins over STATUS_MESSAGES except where the status is more
 * specific than any caller could be (see STATUS_OUTRANKS_FALLBACK).
 */
export const describeRequestError = (
  error: any,
  fallback?: string,
): ErrorDescription => {
  if (isAbort(error)) {
    return { type: "info", content: "", status: 0, silent: true };
  }

  // Already normalised - re-describing would only strip detail back out.
  if (error instanceof RequestError) {
    return {
      type: error.alertType,
      content: error.message,
      status: error.status,
      silent: error.silent,
    };
  }

  const response = error?.response;

  if (!response) {
    return {
      type: "error",
      status: 0,
      silent: false,
      content: describeTransportFailure(error),
    };
  }

  const status: number = response.status ?? 0;

  // 5xx bodies are `{"error": str(exception)}` on both backends. There is
  // nothing in there for a user, and the exception text is ours, not theirs -
  // so the caller's description of the attempt is all the detail we can
  // honestly add.
  if (status >= 500) {
    return {
      type: "error",
      status,
      silent: false,
      content: fallback
        ? `${polish(fallback)} Please try again in a moment.`
        : SERVER_MESSAGE,
    };
  }

  const fromServer = messageFromPayload(response.data);
  if (fromServer) {
    return {
      type: alertTypeFor(status),
      status,
      silent: false,
      content: fromServer,
    };
  }

  if (STATUS_OUTRANKS_FALLBACK.has(status) && STATUS_MESSAGES[status]) {
    return {
      type: alertTypeFor(status),
      status,
      silent: false,
      content: STATUS_MESSAGES[status],
    };
  }

  return {
    type: alertTypeFor(status),
    status,
    silent: false,
    content: fallback ?? STATUS_MESSAGES[status] ?? GENERIC_ERROR_MESSAGE,
  };
};

/** The friendly sentence on its own, for callers that render their own UI. */
export const resolveErrorMessage = (error: any, fallback?: string): string =>
  describeRequestError(error, fallback).content ||
  fallback ||
  GENERIC_ERROR_MESSAGE;

/**
 * Both backends also refuse work inside a 200 - `{"status": false, "message":
 * ...}` - so the success path needs the same presentability guard as the
 * failure path.
 */
export const resolveResponseMessage = (
  response: any,
  fallback: string,
): string => {
  // Callers pass either the Axios response or the body they already unwrapped
  // from it. A NUMERIC `status` is what tells the two apart: that is the HTTP
  // status on an Axios response, while both backends spell their own
  // success flag as a boolean.
  const data =
    response &&
    typeof response === "object" &&
    typeof response.status === "number" &&
    "data" in response
      ? response.data
      : response;
  return messageFromPayload(data) ?? fallback;
};

/**
 * An error whose copy the caller decides outright, for the cases no payload
 * can explain - a database constraint surfacing as raw SQL text, say. Shaped
 * like every other rejection so callers need not special-case it.
 */
export const friendlyError = (
  message: string,
  original?: any,
  code?: string,
): RequestError =>
  new RequestError(
    {
      type: "warning",
      content: message,
      status: original?.response?.status ?? 0,
      silent: false,
    },
    original,
    code,
  );

/** Wraps any thrown value so `.message` is safe to show. */
export const toRequestError = (error: any, fallback?: string): RequestError =>
  error instanceof RequestError
    ? error
    : new RequestError(describeRequestError(error, fallback), error);

const nextAlertId = (currentAlertState?: any[]) =>
  (currentAlertState ?? (store.getState() as any).alerts ?? []).length;

/** Queues an alert without every call site rebuilding the payload by hand. */
export const pushAlert = (
  dispatch: any,
  type: AlertType,
  content: string,
  currentAlertState?: any[],
) => {
  dispatch({
    type: SET_ALERTS,
    payload: {
      alerts: { id: nextAlertId(currentAlertState), type, content },
    },
  });
};

/**
 * Describes a failed request and shows it, keeping the raw error in the
 * console for us. Cancelled requests are dropped rather than announced.
 */
export const pushErrorAlert = (
  dispatch: any,
  error: any,
  fallback?: string,
  currentAlertState?: any[],
) => {
  const described = describeRequestError(error, fallback);
  if (described.silent) return;
  console.error("[request]", error);
  pushAlert(dispatch, described.type, described.content, currentAlertState);
};

/** The 200-with-`status: false` counterpart of pushErrorAlert. */
export const pushResponseAlert = (
  dispatch: any,
  response: any,
  fallback: string,
  currentAlertState?: any[],
  type: AlertType = "warning",
) => {
  pushAlert(
    dispatch,
    type,
    resolveResponseMessage(response, fallback),
    currentAlertState,
  );
};

/**
 * The dispatch-free forms, for the many components that would otherwise wire
 * up useDispatch purely to report a failure.
 *
 * The store is a singleton that the request layer already dispatches against
 * directly (see the response interceptor in requests.ts calling
 * LogoutRequest(store.dispatch)), so this introduces no coupling that was not
 * there - it only spares every call site a hook it does not otherwise need.
 * Prefer the push* forms where a `dispatch` is already in scope.
 */
export const notify = (type: AlertType, content: string) =>
  pushAlert(store.dispatch, type, content);

/** Reports a rejected request. Silent for cancelled ones. */
export const notifyRequestError = (error: any, fallback?: string) =>
  pushErrorAlert(store.dispatch, error, fallback);

/** Reports a refusal that arrived inside an otherwise-successful response. */
export const notifyResponseFailure = (response: any, fallback: string) =>
  pushResponseAlert(store.dispatch, response, fallback);
