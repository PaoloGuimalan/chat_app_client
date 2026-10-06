import { Route, Routes, useParams } from "react-router-dom";
import PageLoader from "@/app/reusables/loaders/PageLoader";
import BrokenLink from "@/app/reusables/catchers/BrokenLink";
import ManageRealm from "./ManageRealm";
import { useManagedRealm } from "./useManagedRealm";

function ManageRealmContainer() {
  const params = useParams();
  const { isloaded, isError, realmInfo } = useManagedRealm(params.realm_id);

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
