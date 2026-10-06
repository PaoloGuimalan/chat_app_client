/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { GetProfileInfo } from "@/reusables/hooks/requests";
import { IRealmProfileInfo } from "@/reusables/vars/interfaces";

/**
 * The realm a manage screen edits, read as "manage" - shared by the page at
 * /realms/:realm_id (ManageRealmContainer) and ManageRealmModal, which a
 * voice channel opens so managing doesn't take the user off the call.
 */
export function useManagedRealm(realmId: string | undefined) {
  const [isloaded, setisloaded] = useState<boolean>(false);
  const [isError, setisError] = useState<boolean>(false);
  const [realmInfo, setrealmInfo] = useState<IRealmProfileInfo | null>(null);

  const GetProfileInfoProcess = () => {
    GetProfileInfo(
      {
        userID: realmId,
      },
      {
        type: "manage",
      },
    )
      .then((response) => {
        if (response.data) {
          setisError(false);
          setisloaded(true);

          if (response.data.data.type !== "user") {
            setrealmInfo(response.data.data);
          }
        } else {
          setisError(true);
          setisloaded(true);
        }
      })
      .catch((err) => {
        setisError(true);
        setisloaded(true);
        console.log(err);
      });
  };

  useEffect(() => {
    GetProfileInfoProcess();
  }, [realmId]);

  // Role writes (transfer ownership, promote/demote, remove) announce
  // themselves with this event so the members list refetches. The REALM
  // payload has to come along, because my_role lives on it and every
  // "may I act on this person" decision below reads it - without this, a
  // former owner keeps seeing owner-only affordances (the ⋯ menu on the
  // person they just handed the realm to) until a full reload, since their
  // own my_role stays "owner" from the first fetch.
  //
  // Re-registered on realm_id so the handler never refetches the realm the
  // route has already navigated away from.
  useEffect(() => {
    const reloadListener = () => GetProfileInfoProcess();

    document.addEventListener("reload-realm-members", reloadListener);

    return () => {
      document.removeEventListener("reload-realm-members", reloadListener);
    };
  }, [realmId]);

  return { isloaded, isError, realmInfo };
}
