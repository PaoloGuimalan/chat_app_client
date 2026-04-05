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

  return (
    <Routes>
      <Route
        path="/"
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
