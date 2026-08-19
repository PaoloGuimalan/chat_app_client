export interface ConfirmPrompt {
  title: string;
  message: string;
  // The destructive button's label - "Remove", "Unfollow", "Withdraw".
  confirmLabel: string;
}

// ---------------------------------------------------------------------------
// Shared copy for <ConfirmModal>. Kept here rather than at each call site so
// that every surface which can unfollow (profile, page, contacts, search, page
// cards) says the same thing, and so the wording stays in step with the app's
// dialogs.
// ---------------------------------------------------------------------------

/**
 * `name` is already display-ready: "@handle" for a person, the page's own
 * name otherwise. `realmNoun` names the kind of realm in the body copy -
 * pages are the usual case, but a server or group can be followed too and
 * calling one of those "this page" would read as a bug.
 */
export const unfollowPrompt = (
  name: string,
  isRealm: boolean,
  isPending = false,
  realmNoun = "page",
): ConfirmPrompt =>
  isPending
    ? {
        // Pending is the requester's own outgoing request, and it unfollows
        // through the same DELETE - but "Unfollow" would misdescribe it.
        title: `Withdraw follow request to ${name}?`,
        message:
          "They won't see the request any more. You can send a new one later.",
        confirmLabel: "Withdraw",
      }
    : {
        title: `Unfollow ${name}?`,
        message: isRealm
          ? `You'll stop seeing this ${realmNoun}'s posts in your feed. You can follow again anytime.`
          : "You'll stop seeing their posts in your feed. You can follow again anytime.",
        confirmLabel: "Unfollow",
      };

export const removeConnectionPrompt = (
  name: string,
  isRealm: boolean,
): ConfirmPrompt => ({
  title: `Remove ${name}?`,
  message: isRealm
    ? "You'll both be removed from each other's contacts. Following is separate and won't change."
    : "You'll both be removed from each other's contacts. You can send a new request later.",
  confirmLabel: "Remove",
});

/**
 * The kind of realm being left. Drives both the noun in the title and which
 * consequence the body describes - they genuinely differ: a server takes its
 * channels with it, a voice channel drops you out of the room you are sitting
 * in, and a group just stops delivering messages.
 */
export type LeaveRealmKind =
  | "server"
  | "channel"
  | "voice"
  | "group"
  | "page";

const LEAVE_MESSAGES: Record<LeaveRealmKind, string> = {
  server:
    "You'll lose access to its channels, and you'll need to be added back or join again to return.",
  voice:
    "You'll leave this room and lose access to the channel. An admin has to add you back to return.",
  channel:
    "You'll stop receiving messages here, and you'll need to be added back to rejoin.",
  group:
    "You'll stop receiving messages here, and you'll need to be added back to rejoin.",
  // A page has no thread to stop receiving - membership there is purely about
  // who can act as and manage it.
  page: "You'll lose access to managing this page, and an admin has to add you back.",
};

/**
 * Realm nouns arrive as plain strings (realm.type, refined for channels), so
 * narrow them here rather than at each call site. Anything unrecognised reads
 * as a group, which is the mildest and most generic of the messages.
 */
export const leaveKindFromRealmNoun = (noun: string): LeaveRealmKind =>
  (["server", "channel", "voice", "group", "page"] as const).includes(
    noun as LeaveRealmKind,
  )
    ? (noun as LeaveRealmKind)
    : "group";

/**
 * Leaving IS removing yourself - same /realms/remove-user call an admin uses
 * on someone else - and it is not undoable from this side, since a private
 * realm needs an invitation to get back into. Ported from the app's three
 * leave dialogs (server_channels_view, voice_channel_view, conversation_view).
 *
 * `name` is for surfaces that list many realms at once, where "Leave server?"
 * would not say WHICH. In-context surfaces omit it and read like the app.
 */
export const leaveRealmPrompt = (
  kind: LeaveRealmKind,
  name?: string,
): ConfirmPrompt => ({
  title: name
    ? `Leave ${name}?`
    : `Leave ${kind === "voice" ? "channel" : kind}?`,
  message: LEAVE_MESSAGES[kind],
  confirmLabel: "Leave",
});

/**
 * An admin removing SOMEONE ELSE. Same /realms/remove-user call leaving makes
 * on yourself, so the same warning applies - they need an invitation to get
 * back into a private realm. Ported from the app's realm_sections `_remove`,
 * which covers members and followers with one dialog and branches only on the
 * consequence line.
 *
 * `realmNoun` is the kind of realm they lose access to - "server", "group",
 * "channel". Saying "this realm" would be internal jargon nobody outside the
 * codebase uses.
 */
export const removeMemberPrompt = (
  name: string,
  realmNoun: string,
): ConfirmPrompt => ({
  title: `Remove ${name}?`,
  message: `They'll lose access to this ${realmNoun}.`,
  confirmLabel: "Remove",
});

/** The follower half of the same dialog. Following is theirs to redo. */
export const removeFollowerPrompt = (name: string): ConfirmPrompt => ({
  title: `Remove ${name}?`,
  message: "They'll stop following this page, and can follow again themselves.",
  confirmLabel: "Remove",
});

/**
 * Handing the realm over. Phrased around what the CURRENT owner gives up,
 * since that is the part that is not undoable by them afterwards: only the
 * new owner can hand it back.
 */
export const transferOwnershipPrompt = (
  name: string,
  realmNoun: string,
): ConfirmPrompt => ({
  title: `Make ${name} the owner?`,
  message: `They'll get full control of this ${realmNoun}, including deleting it and removing admins. You'll stay on as an admin, and only they can transfer it back.`,
  confirmLabel: "Transfer",
});

/**
 * Shown INSTEAD of the leave prompt when the owner tries to leave. The server
 * refuses this outright ("Transfer ownership to another member before
 * leaving.") because a realm cannot be left without an owner - so the useful
 * thing to offer is the screen where they can hand it over, not a Leave
 * button that will fail.
 */
export const ownerCannotLeavePrompt = (realmNoun: string): ConfirmPrompt => ({
  title: `You own this ${realmNoun}`,
  message: `A ${realmNoun} can't be left without an owner. Transfer ownership to another member first, then you can leave.`,
  confirmLabel: "Manage members",
});

/**
 * The owner trying to leave from the members screen itself. Informational -
 * rendered without an onConfirm - because there is no action to offer: they
 * are already looking at the list they need to transfer from, so the only
 * thing left is to say why Leave is refused.
 */
export const ownerMustTransferPrompt = (realmNoun: string): ConfirmPrompt => ({
  title: `You own this ${realmNoun}`,
  message: `A ${realmNoun} can't be left without an owner. Transfer ownership to someone in this list first, then you can leave.`,
  confirmLabel: "Got it",
});
