/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import Profile from "./user/Profile";
import Diary from "./diary/Diary";
import { GetProfileInfo } from "@/reusables/hooks/requests";
import { useEffect, useState } from "react";
import {
  AuthenticationInterface,
  IRealmProfileInfo,
  ProfileUserInfoInterface,
} from "@/reusables/vars/interfaces";
import PageLoader from "@/app/reusables/loaders/PageLoader";
import BrokenLink from "@/app/reusables/catchers/BrokenLink";
import RealmProfile from "./user/RealmProfile";
import { useSelector } from "react-redux";
import { useTheme } from "@/reusables/design";

function ProfileContainer() {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );
  const [isloaded, setisloaded] = useState<boolean>(false);
  const [isError, setisError] = useState<boolean>(false);
  const [profileInfo, setprofileInfo] =
    useState<ProfileUserInfoInterface | null>(null);
  const [realmInfo, setrealmInfo] = useState<IRealmProfileInfo | null>(null);
  const [type, settype] = useState<string | null>(null);

  const params = useParams();

  const location = useLocation();
  const isSharePath = location.pathname.startsWith("/share");

  const { theme } = useTheme();

  const navigate = useNavigate();

  useEffect(() => {
    if (authentication.auth && isSharePath) {
      navigate(`/${params.userID}`);
    }
  }, [authentication, isSharePath]);

  const GetProfileInfoProcess = (callback: () => void = () => {}) => {
    GetProfileInfo({
      userID: params.userID,
    })
      .then((response) => {
        // if (response.data.status) {
        // const result: any = jwtDecode(response.data);
        if (response.data) {
          setisError(false);
          settype(response.data.data.type);
          setisloaded(true);
          callback();

          if (response.data.data.type === "user") {
            setprofileInfo(response.data.data);
          } else {
            setrealmInfo(response.data.data);
          }
        } else {
          setisError(true);
          setisloaded(true);
          setprofileInfo(null);
        }
        // } else {
        //   setprofileInfo(null);
        //   setisloaded(false);
        // }
      })
      .catch((err) => {
        setisError(true);
        setprofileInfo(null);
        setisloaded(true);
        console.log(err);
      });
  };

  useEffect(() => {
    GetProfileInfoProcess();
  }, [params.userID]);

  const content = (
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
            ) : type ? (
              type === "user" ? (
                profileInfo ? (
                  <Profile
                    profileInfo={profileInfo}
                    GetProfileInfoProcess={GetProfileInfoProcess}
                    isSharePage={isSharePath}
                  />
                ) : (
                  <BrokenLink
                    label="Link is broken."
                    secondaryLabel="Please check and try again."
                  />
                )
              ) : realmInfo && type === "page" ? (
                <RealmProfile
                  realmInfo={realmInfo}
                  GetProfileInfoProcess={GetProfileInfoProcess}
                  isSharePage={isSharePath}
                />
              ) : (
                <BrokenLink
                  label="Link is broken."
                  secondaryLabel="Please check and try again."
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
      <Route
        path="/diary"
        element={
          !authentication.auth ? (
            <Navigate to="/login" />
          ) : authentication.allowed_modules.includes(
              "module.diary.access",
            ) ? (
            <Diary />
          ) : (
            // Diary isn't available while acting as a page - not a
            // permission failure, just not a module this context has.
            <Navigate to="/" />
          )
        }
      />
    </Routes>
  );

  // The /share/:userID/* route renders this standalone (see App.tsx),
  // bypassing Home.tsx - which is normally what applies the ".cl-redesign"
  // scope (font-size rescaling, scrollbar styling, theme overrides) that
  // Profile/RealmProfile's styling assumes is present. When nested inside
  // Home.tsx instead, that scope already exists higher up, so this only
  // needs to add it for the standalone share path.
  return isSharePath ? (
    <div
      className="cl-redesign"
      data-theme={theme}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      {content}
    </div>
  ) : (
    content
  );
}

export default ProfileContainer;
