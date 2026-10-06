import { useMemo } from "react";
import { useSelector } from "react-redux";
import { AuthenticationInterface } from "@/reusables/vars/interfaces";

/**
 * Who you are in a conference: the ACTING entity - yourself, or the page
 * you have switched into. Both servers already act as it (the token names
 * it), so the lobby, the call and the People panel must too; they used to
 * read the personal account throughout, so a page saw its admin's invites,
 * was matched against its admin's email and joined the call under its
 * admin's username.
 */
export interface ConferenceIdentity {
  /** The acting entity's id - what invites, members and the call key on. */
  entityID: string;
  /**
   * What the call and the member list know it by: a username, or a page's
   * slug (its id when it has none).
   */
  handle: string;
  name: string;
  profile: string | undefined;
  /**
   * The personal account's address, when acting as yourself. A page's
   * contact email is not on the client - an invite to it is matched by the
   * entity the server resolved it to.
   */
  email: string;
  isPage: boolean;
}

type AuthState = { authentication: AuthenticationInterface };

/**
 * You as yourself, whichever entity is acting. The account fields (name,
 * username, picture, email) are always the personal account's; its entity id
 * is NOT `user.entity_id` - after a switch and the reload that follows,
 * session restore signs the ACTING entity into the usertoken
 * (`/auth/jwtchecker`), so that holds the page's id. `personal_entity_id` is
 * the one that always names you.
 */
export function personalIdentity(
  authentication: AuthenticationInterface,
): ConferenceIdentity {
  const user = authentication.user;
  const fullName = [user.fullName?.firstName, user.fullName?.lastName]
    .filter((part) => part && part !== "N/A")
    .join(" ");
  return {
    entityID: String(
      authentication.active_entity_context?.personal_entity_id ||
        user.entity_id ||
        "",
    ),
    handle: user.username ?? "",
    name: fullName || user.username || "You",
    profile: user.profile && user.profile !== "none" ? user.profile : undefined,
    email: user.email ? String(user.email).trim().toLowerCase() : "",
    isPage: false,
  };
}

export function useConferenceIdentity(): ConferenceIdentity {
  const authentication = useSelector(
    (state: AuthState) => state.authentication,
  );
  const active = authentication.active_entity_context;

  return useMemo(() => {
    // The server's word for it - the active entity's type. This compared the
    // active id with `user.entity_id`, which after a reload IS the page's id
    // too (see personalIdentity), so a page was never seen as one: it joined
    // the call, sat in the People panel and showed on the landing page as its
    // admin.
    if (active?.id && active.entity_type === "realm") {
      return {
        entityID: String(active.id),
        handle: active.slug || active.realm_id || String(active.id),
        name: active.name || active.slug || "Page",
        profile:
          active.profile && active.profile !== "N/A" && active.profile !== "none"
            ? active.profile
            : undefined,
        email: "",
        isPage: true,
      };
    }
    return personalIdentity(authentication);
  }, [active, authentication]);
}
