/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import "./App.css";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Login from "./app/auth/Login";
import { useDispatch, useSelector } from "react-redux";
import Splash from "./app/main/Splash";
import Home from "./app/main/Home";
import Register from "./app/auth/Register";
import Verification from "./app/auth/Verification";
import { useEffect, useRef, useState } from "react";
import { AuthCheck } from "./reusables/hooks/requests";
import { loadMediaConfig } from "./reusables/vars/uploads";
import Alert from "./app/widgets/Alert";
import {
  SET_PATHNAME_LISTENER,
  SET_SCREEN_SIZE_LISTENER,
  SET_MUTATE_ALERTS,
} from "./redux/types";
import { consumeStudioMomentNotice } from "./reusables/hooks/studio";
import ProfileContainer from "./app/tabs/profile/ProfileContainer";
import { AuthenticationInterface } from "./reusables/vars/interfaces";
import Setup from "./app/auth/Setup";
import ConferenceContainer from "./app/conference/ConferenceContainer";
import PolicyPage from "./app/legal/PolicyPage";
import DeleteAccount from "./app/legal/DeleteAccount";
import Support from "./app/legal/Support";
import envs from "./reusables/hooks/env_configs";
// import { publicProfilePath } from "./reusables/routing/profilePaths";
import { useProfilePathsVersion } from "./reusables/routing/useProfilePaths";

function App() {
  useProfilePathsVersion();
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );
  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );
  const alerts = useSelector((state: any) => state.alerts);
  const dispatch = useDispatch();

  const location = useLocation().pathname;

  const scrollDivAlerts = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authentication.auth || location !== "/") return;
    const entityId =
      authentication.active_entity_context?.id || authentication.user.entity_id;
    if (!entityId) return;
    const content = consumeStudioMomentNotice(entityId);
    if (content)
      dispatch({
        type: SET_MUTATE_ALERTS,
        payload: { alerts: { type: "success", content } },
      });
  }, [
    authentication.auth,
    authentication.active_entity_context?.id,
    authentication.user.entity_id,
    location,
  ]);

  const screensizelistenerTrigger = () => {
    dispatch({
      type: SET_SCREEN_SIZE_LISTENER,
      payload: {
        screensizelistener: {
          W: window.innerWidth,
          H: window.innerHeight,
        },
      },
    });
    // console.log(screensizelistener)
  };

  useEffect(() => {
    // Upload limits per feature, from the server - refreshed every boot.
    loadMediaConfig();
    AuthCheck(dispatch);
    // console.log("v2.2.1.0");
    console.log(envs.APP_VERSION);
  }, []);

  useEffect(() => {
    dispatch({
      type: SET_PATHNAME_LISTENER,
      payload: {
        pathnamelistener: location,
      },
    });
    // console.log(location)
  }, [location]);

  useEffect(() => {
    window.addEventListener("resize", screensizelistenerTrigger);

    return () => {
      window.removeEventListener("resize", screensizelistenerTrigger);
    };
  }, [screensizelistener]);

  useEffect(() => {
    if (scrollDivAlerts.current) {
      const scrollHeight = scrollDivAlerts.current.scrollHeight;
      const clientHeight = scrollDivAlerts.current.clientHeight;
      const maxScrollTop = scrollHeight - clientHeight;
      scrollDivAlerts.current.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
    }
  }, [alerts, scrollDivAlerts]);

  const [nextPathState, setnextPathState] = useState<string | null>(null);
  const wasAuthenticated = useRef(authentication.auth === true);
  const justLoggedOut =
    wasAuthenticated.current && authentication.auth === false;

  useEffect(() => {
    wasAuthenticated.current = authentication.auth === true;
    if (justLoggedOut) setnextPathState(null);
  }, [authentication.auth, justLoggedOut]);

  useEffect(() => {
    const nextPath = window.location.href.replace(window.location.origin, "");

    if (
      !nextPath.trim().includes("/login") &&
      !nextPath.trim().includes("/register") &&
      !nextPath.trim().includes("/verification") &&
      nextPath.trim() !== "/"
    ) {
      setnextPathState(nextPath);
    }
  }, []);

  // A signed-out profile visitor may use the public route; a logout must
  // finish at login before that guest-route fallback can run.
  if (justLoggedOut) return <Navigate to="/login" replace />;

  return (
    <div className="App">
      <div id="div_alerts_container" ref={scrollDivAlerts}>
        {alerts.map((al: any, i: number) => {
          return <Alert key={i} al={al} />;
        })}
      </div>
      <Routes>
        <Route path="/conference" element={<ConferenceContainer />} />
        <Route path="/conference/:slug" element={<ConferenceContainer />} />
        {/* PUBLIC, and declared ABOVE the `/*` catch-all below - that route runs
            the whole authentication gate and redirects to /login, so anything
            registered under it is unreachable logged out. These four are the
            URLs the app stores require us to host and that a reviewer opens in
            a clean browser with no session:
              /privacy         Play's Privacy Policy field, App Store Connect
              /terms           linked from the same listings and from signup
              /delete-account  Play requires a WEB deletion URL as well as the
                               in-app path in Settings -> Data & Privacy
              /support         Apple guideline 1.2 - a published way to contact
                               us about user-generated content
            Deliberately separate from the consent modals in Register/Setup,
            which stay exactly as they are; these only share the policies fetch. */}
        <Route
          path="/privacy"
          element={<PolicyPage documentType="privacy" />}
        />
        <Route path="/terms" element={<PolicyPage documentType="terms" />} />
        <Route path="/delete-account" element={<DeleteAccount />} />
        <Route path="/support" element={<Support />} />
        <Route
          path="/*"
          element={
            authentication.auth != null ? (
              authentication.auth ? (
                authentication.user.isVerified ? (
                  authentication.user.isComplete ? (
                    <Home setNextPath={setnextPathState} />
                  ) : (
                    <Setup />
                  )
                ) : (
                  <Navigate to="/verification" />
                )
              ) : (
                <Navigate
                  to={`/login${nextPathState ? `?next=${nextPathState}` : ""}`}
                />
              )
            ) : (
              <Splash />
            )
          }
        />
        <Route
          path="/login"
          element={
            authentication.auth != null ? (
              authentication.auth ? (
                authentication.user.isVerified ? (
                  authentication.user.isComplete ? (
                    <Navigate to={nextPathState ? nextPathState : "/"} />
                  ) : (
                    <Setup />
                  )
                ) : (
                  <Navigate to="/verification" />
                )
              ) : (
                <Login />
              )
            ) : (
              <Splash />
            )
          }
        />
        <Route
          path="/register"
          element={
            authentication.auth != null ? (
              authentication.auth ? (
                authentication.user.isVerified ? (
                  authentication.user.isComplete ? (
                    // Back to where they came in - an emailed invite, say,
                    // which is what sent a new person to sign up at all.
                    <Navigate to={nextPathState ? nextPathState : "/"} />
                  ) : (
                    <Setup />
                  )
                ) : (
                  <Navigate to="/verification" />
                )
              ) : (
                <Register />
              )
            ) : (
              <Splash />
            )
          }
        />
        <Route
          path="/verification"
          element={
            authentication.auth != null ? (
              authentication.auth ? (
                authentication.user.isVerified ? (
                  authentication.user.isComplete ? (
                    <Navigate to={nextPathState ? nextPathState : "/"} />
                  ) : (
                    <Setup />
                  )
                ) : (
                  <Verification />
                )
              ) : (
                <Navigate to="/login" />
              )
            ) : (
              <Splash />
            )
          }
        />
        <Route
          path="/setup"
          element={
            authentication.auth != null ? (
              authentication.auth ? (
                authentication.user.isVerified ? (
                  authentication.user.isComplete ? (
                    <Navigate to={nextPathState ? nextPathState : "/"} />
                  ) : (
                    <Setup />
                  )
                ) : (
                  <Verification />
                )
              ) : (
                <Navigate to="/login" />
              )
            ) : (
              <Splash />
            )
          }
        />
        <Route path="/share/:userID/*" element={<ProfileContainer />} />
        {/* <Route path='/app/*' element={authentication.auth != null? authentication.auth? authentication.user.isVerified? <Home /> : <Navigate to='/verification' /> : <Navigate to='/login' /> : <Splash />} /> */}
      </Routes>
    </div>
  );
}

export default App;
