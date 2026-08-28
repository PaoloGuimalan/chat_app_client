import { JSX } from "react";
import { FaGlobeAsia, FaLock } from "react-icons/fa";
import { FaUserGroup } from "react-icons/fa6";
import { AuthenticationInterface } from "@/reusables/vars/interfaces";

/**
 * The audience a post can be given, shared by every composer.
 *
 * Extracted because there is now more than one: the main composer and the
 * profile/cover photo uploader both publish a post and both need the same
 * list. Two copies would be two things to keep in step with
 * newsfeed/services/post_visibility.py, and the copy that fell behind would
 * silently offer an audience the server no longer honours.
 *
 * "custom" is deliberately absent. The backend supports it, but it needs an
 * allow-list picker (PostPrivacy rows) that does not exist yet, so offering it
 * would produce a post with an empty allow-list - visible to nobody.
 */
export interface PrivacyOption {
  value: string;
  label: string;
  hint: string;
  icon: JSX.Element;
}

export const PRIVACY_OPTIONS: PrivacyOption[] = [
  {
    value: "public",
    label: "Public",
    hint: "Anyone on Chatterloop, including people signed out",
    icon: <FaGlobeAsia style={{ fontSize: "16px" }} />,
  },
  {
    value: "connections",
    label: "Contacts only",
    hint: "Only people you are connected with",
    icon: <FaUserGroup style={{ fontSize: "16px" }} />,
  },
  {
    value: "private",
    label: "Only me",
    hint: "Nobody else can see this post",
    icon: <FaLock style={{ fontSize: "15px" }} />,
  },
];

/**
 * Whether this viewer posts from a private profile.
 *
 * Posting AS A PAGE is never private: profile privacy is a person-level
 * setting and a realm has none.
 */
export const isPrivateProfile = (
  authentication: AuthenticationInterface | undefined,
): boolean =>
  authentication?.user?.isPrivate === true &&
  authentication?.active_entity_context?.entity_type !== "realm";

/**
 * The audience a post gets when the author does not choose one.
 *
 * Mirrors what the server applies when the field is absent
 * (newsfeed/services/post_visibility.py default_privacy_status_for), so the UI
 * shows what will actually happen rather than claiming "Public" and then being
 * overridden.
 */
export const defaultPrivacyStatus = (
  authentication: AuthenticationInterface | undefined,
): string => (isPrivateProfile(authentication) ? "connections" : "public");

export const findPrivacyOption = (value: string): PrivacyOption =>
  PRIVACY_OPTIONS.find((option) => option.value === value) ||
  PRIVACY_OPTIONS[0];
