/* eslint-disable react-hooks/exhaustive-deps */
import { Route, Routes, useParams } from "react-router-dom";
import { GetProfileInfo } from "@/reusables/hooks/requests";
import { useEffect, useState } from "react";
import { IRealmProfileInfo } from "@/reusables/vars/interfaces";
import PageLoader from "@/app/reusables/loaders/PageLoader";
import BrokenLink from "@/app/reusables/catchers/BrokenLink";
import ManageRealm from "./ManageRealm";

function ManageRealmContainer() {
  const [isloaded, setisloaded] = useState<boolean>(false);
  const [isError, setisError] = useState<boolean>(false);
  const [realmInfo, setrealmInfo] = useState<IRealmProfileInfo | null>(null);

  const params = useParams();

  const GetProfileInfoProcess = (callback: () => void = () => {}) => {
    GetProfileInfo(
      {
        userID: params.realm_id,
      },
      {
        type: "manage",
      },
    )
      .then((response) => {
        // if (response.data.status) {
        // const result: any = jwtDecode(response.data);
        if (response.data) {
          setisError(false);
          setisloaded(true);
          callback();

          if (response.data.data.type !== "user") {
            setrealmInfo(response.data.data);
          }
        } else {
          setisError(true);
          setisloaded(true);
        }
        // } else {
        //   setprofileInfo(null);
        //   setisloaded(false);
        // }
      })
      .catch((err) => {
        setisError(true);
        setisloaded(true);
        console.log(err);
      });
  };

  useEffect(() => {
    GetProfileInfoProcess();
  }, [params.realm_id]);

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
  }, [params.realm_id]);

  return (
    <Routes>
      <Route
        path="/*"
        element={
          isloaded ? (
            isError ? (
              <BrokenLink
                label="Link is broken."
                secondaryLabel="Please check and try again."
              />
            ) : realmInfo ? (
              realmInfo.is_admin ? (
                <ManageRealm realm={realmInfo} />
              ) : (
                <BrokenLink
                  label="Restricted Page"
                  secondaryLabel="You are not allowed to access this page."
                />
              )
            ) : (
              <PageLoader />
            )
          ) : (
            <PageLoader />
          )
        }
      />
    </Routes>
  );
}

export default ManageRealmContainer;
