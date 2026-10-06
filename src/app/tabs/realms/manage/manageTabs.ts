import { IRealmProfileInfo } from "@/reusables/vars/interfaces";

/** A text channel can still come back as a "group" with a parent server. */
const isChannel = (realm: IRealmProfileInfo) =>
  realm.type === "channel" ||
  realm.type === "voice" ||
  (realm.type === "group" && !!realm.parent);

/**
 * Whether the realm gets the Media tab (profile and cover photo). Channels -
 * text and voice - and conferences show neither anywhere, so there is
 * nothing for it to manage. Read by the manage page and ManageRealmModal.
 */
export const hasMediaTab = (realm: IRealmProfileInfo) =>
  !isChannel(realm) && realm.type !== "conference";
