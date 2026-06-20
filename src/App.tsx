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
import Alert from "./app/widgets/Alert";
import { SET_PATHNAME_LISTENER, SET_SCREEN_SIZE_LISTENER } from "./redux/types";
import ProfileContainer from "./app/tabs/profile/ProfileContainer";
import { AuthenticationInterface } from "./reusables/vars/interfaces";
import Setup from "./app/auth/Setup";
import ConferenceContainer from "./app/conference/ConferenceContainer";

function App() {
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
    AuthCheck(dispatch);
    // console.log("v2.2.1.0");
    console.log("v2.7.2");
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

  return (
    <div className="App">
      <div id="div_alerts_container" ref={scrollDivAlerts}>
        {alerts.map((al: any, i: number) => {
          return <Alert key={i} al={al} />;
        })}
      </div>
      <Routes>
        <Route path="/conference" element={<ConferenceContainer />} />
        <Route
          path="/conference/:slug"
          element={<ConferenceContainer />}
        />
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
                    <Navigate to="/" />
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
                    <Navigate to="/" />
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
                    <Navigate to="/" />
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
