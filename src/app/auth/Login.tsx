/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import {
  CredentialResponse,
  GoogleLogin,
  GoogleOAuthProvider,
} from "@react-oauth/google";
import envs from "../../reusables/hooks/env_configs";
import {
  CLEAR_PENDING_CALL_ALERTS,
  SET_ALERTS,
  SET_CALLS_LIST,
  SET_CLEAR_ALERTS,
  SET_CONTACTS_LIST_OVERRIDE,
  SET_CONVERSATION_SETUP,
  SET_MESSAGES_LIST_OVERRIDE,
  SET_MINIMIZED_CONVERSATION_OVERRIDE,
  SET_NOTIFICATIONS_LIST_OVERRIDE,
} from "../../redux/types";
import {
  contactsliststate,
  conversationsetupstate,
} from "@/redux/actions/states";
import {
  LoginRequest,
  ThirdPartyAuthenticationRequest,
} from "../../reusables/hooks/requests";
import AuthShell from "./AuthShell";

function Login() {
  const alerts = useSelector((state: any) => state.alerts);
  const [emailUsername, setEmailUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isWaitingRequest, setIsWaitingRequest] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("cl_up_theme") || "light");

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const clearStates = () => {
    dispatch({
      type: SET_CONVERSATION_SETUP,
      payload: { conversationsetup: conversationsetupstate },
    });
    dispatch({ type: SET_MESSAGES_LIST_OVERRIDE, payload: { messageslist: [] } });
    dispatch({ type: SET_CLEAR_ALERTS, payload: { alerts: [] } });
    dispatch({ type: SET_CALLS_LIST, payload: { callslist: [] } });
    dispatch({ type: CLEAR_PENDING_CALL_ALERTS, payload: { clearstate: [] } });
    dispatch({
      type: SET_CONTACTS_LIST_OVERRIDE,
      payload: { contactslist: contactsliststate },
    });
    dispatch({
      type: SET_MINIMIZED_CONVERSATION_OVERRIDE,
      payload: { conversations: [] },
    });
    dispatch({
      type: SET_NOTIFICATIONS_LIST_OVERRIDE,
      payload: { notficationslist: { list: [], totalunread: 0 } },
    });
  };

  const verifyLogin = () => {
    clearStates();
    setIsWaitingRequest(true);

    if (emailUsername.trim() !== "" && password.trim() !== "") {
      LoginRequest(
        {
          email_username: emailUsername,
          password,
        },
        dispatch,
        alerts,
        setIsWaitingRequest,
      );
      return;
    }

    setIsWaitingRequest(false);
    dispatch({
      type: SET_ALERTS,
      payload: {
        alerts: {
          id: alerts.length,
          type: "warning",
          content: "Please complete the field.",
        },
      },
    });
  };

  const verifyTPAuthentication = (token: string) => {
    clearStates();
    setIsWaitingRequest(true);
    ThirdPartyAuthenticationRequest(
      { token },
      dispatch,
      alerts,
      setIsWaitingRequest,
    );
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("cl_up_theme", nextTheme);
  };

  return (
    <GoogleOAuthProvider clientId={envs.GOOGLE_CLIENT_ID}>
      <AuthShell
        title="Welcome back"
        subtitle="Log in to jump back into your loop."
        theme={theme}
        onToggleTheme={toggleTheme}
      >
        <div style={{ padding: 28 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>
              Log in
            </h1>
            <p style={{ margin: 0, color: "var(--cl-text-2)", fontSize: 14 }}>
              Use your email or username to continue.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--cl-text-2)" }}>
                Email or Username
              </span>
              <input
                type="text"
                placeholder="you@chatterloop.app"
                value={emailUsername}
                onChange={(e) => setEmailUsername(e.target.value)}
                className="cl-input-shell"
                style={{
                  width: "100%",
                  height: 44,
                  borderRadius: "var(--cl-radius-sm)",
                  border: "1px solid var(--cl-border)",
                  background: "var(--cl-input)",
                  color: "var(--cl-text)",
                  padding: "0 14px",
                  outline: "none",
                }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--cl-text-2)" }}>
                Password
              </span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  height: 44,
                  borderRadius: "var(--cl-radius-sm)",
                  border: "1px solid var(--cl-border)",
                  background: "var(--cl-input)",
                  color: "var(--cl-text)",
                  padding: "0 14px",
                  outline: "none",
                }}
              />
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "12px 0 18px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--cl-text-2)" }}>
              <input type="checkbox" defaultChecked style={{ accentColor: "var(--cl-brand)" }} />
              Remember me
            </label>
            <span style={{ fontSize: 13, color: "var(--cl-brand)", fontWeight: 700, cursor: "pointer" }}>
              Forgot password?
            </span>
          </div>

          <button
            type="button"
            onClick={verifyLogin}
            style={{
              width: "100%",
              height: 46,
              border: "none",
              borderRadius: "var(--cl-radius-sm)",
              background: "var(--cl-brand)",
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(28,125,239,0.30)",
            }}
          >
            {isWaitingRequest ? (
              <AiOutlineLoading3Quarters style={{ animation: "clSpin 1s linear infinite" }} />
            ) : (
              "Log In"
            )}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0" }}>
            <div style={{ flex: 1, height: 1, background: "var(--cl-border)" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--cl-text-3)" }}>OR</span>
            <div style={{ flex: 1, height: 1, background: "var(--cl-border)" }} />
          </div>

          <GoogleLogin
            onSuccess={(credentialResponse: CredentialResponse) => {
              if (credentialResponse.credential) {
                verifyTPAuthentication(credentialResponse.credential);
                return;
              }

              dispatch({
                type: SET_ALERTS,
                payload: {
                  alerts: {
                    id: alerts.length,
                    type: "warning",
                    content: "Unable to login using this account.",
                  },
                },
              });
            }}
            onError={() => {
              dispatch({
                type: SET_ALERTS,
                payload: {
                  alerts: {
                    id: alerts.length,
                    type: "error",
                    content: "There was a problem logging in with Google.",
                  },
                },
              });
            }}
          />

          <div style={{ textAlign: "center", marginTop: 22, fontSize: 13.5, color: "var(--cl-text-2)" }}>
            Don&apos;t have an account yet?{" "}
            <span
              onClick={() => navigate("/register")}
              style={{ color: "var(--cl-brand)", fontWeight: 700, cursor: "pointer" }}
            >
              Sign Up
            </span>
          </div>
        </div>
      </AuthShell>
    </GoogleOAuthProvider>
  );
}

export default Login;
