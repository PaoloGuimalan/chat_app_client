/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import ChatterLoopImg from "../../assets/imgs/chatterloop.png";
import { useNavigate } from "react-router-dom";
import {
  LoginRequest,
  ThirdPartyAuthenticationRequest,
} from "../../reusables/hooks/requests";
import { useDispatch, useSelector } from "react-redux";
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
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import {
  CredentialResponse,
  GoogleLogin,
  GoogleOAuthProvider,
} from "@react-oauth/google";
import envs from "../../reusables/hooks/env_configs";
import {
  contactsliststate,
  conversationsetupstate,
} from "@/redux/actions/states";
import { Btn, Field, Icon, useTheme } from "@/reusables/design";

function Login() {
  const alerts = useSelector((state: any) => state.alerts);

  const [email_username, setemail_username] = useState("");
  const [password, setpassword] = useState("");
  const [isWaitingRequest, setisWaitingRequest] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { theme, toggleTheme } = useTheme();

  const clearStates = () => {
    dispatch({
      type: SET_CONVERSATION_SETUP,
      payload: { conversationsetup: conversationsetupstate },
    });
    dispatch({
      type: SET_MESSAGES_LIST_OVERRIDE,
      payload: { messageslist: [] },
    });
    dispatch({
      type: SET_CLEAR_ALERTS,
      payload: { alerts: [] },
    });
    dispatch({
      type: SET_CALLS_LIST,
      payload: { callslist: [] },
    });
    dispatch({
      type: CLEAR_PENDING_CALL_ALERTS,
      payload: { clearstate: [] },
    });
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
    setisWaitingRequest(true);
    if (email_username.trim() != "" && password.trim() != "") {
      LoginRequest(
        { email_username, password },
        dispatch,
        alerts,
        setisWaitingRequest,
      );
    } else {
      setisWaitingRequest(false);
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
    }
  };

  const verifyTPAuthentication = (token: string) => {
    clearStates();
    setisWaitingRequest(true);
    ThirdPartyAuthenticationRequest(
      { token },
      dispatch,
      alerts,
      setisWaitingRequest,
    );
  };

  const isMobile =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 760px)").matches;

  return (
    <GoogleOAuthProvider clientId={envs.GOOGLE_CLIENT_ID}>
      <div
        className="cl-redesign"
        data-theme={theme}
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          background: "var(--bg)",
        }}
      >
        {!isMobile && <BrandPanel />}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 22,
            position: "relative",
            overflowY: "auto",
          }}
        >
          <button
            onClick={toggleTheme}
            title="Toggle theme"
            aria-label="Toggle theme"
            style={{
              position: "absolute",
              top: 18,
              right: 18,
              width: 40,
              height: 40,
              borderRadius: "var(--r-sm)",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              cursor: "pointer",
              color: "var(--text-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon n={theme === "dark" ? "light_mode" : "dark_mode"} s={20} />
          </button>

          <div style={{ width: "100%", maxWidth: 380 }} className="cl-pop">
            {isMobile && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  justifyContent: "center",
                  marginBottom: 22,
                }}
              >
                <img
                  src={ChatterLoopImg}
                  alt=""
                  style={{ width: 38, height: 38 }}
                />
                <span style={{ fontSize: 24, fontWeight: 800 }}>
                  Chatterloop
                </span>
              </div>
            )}

            <h1
              style={{
                margin: "0 0 4px",
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: "-0.02em",
              }}
            >
              Welcome back
            </h1>
            <p
              style={{
                margin: "0 0 22px",
                color: "var(--text-2)",
                fontSize: 14,
              }}
            >
              Log in to jump back into your loop.
            </p>

            <div
              style={{ display: "flex", flexDirection: "column", gap: 13 }}
            >
              <Field
                icon="alternate_email"
                label="Email or Username"
                placeholder="you@chatterloop.app"
                value={email_username}
                onChange={(e) => setemail_username(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isWaitingRequest) verifyLogin();
                }}
              />
              <Field
                icon="lock"
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setpassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isWaitingRequest) verifyLogin();
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                margin: "12px 0 18px",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  color: "var(--brand)",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Forgot password?
              </span>
            </div>

            <Btn
              block
              size="lg"
              onClick={verifyLogin}
              disabled={isWaitingRequest}
            >
              {isWaitingRequest ? (
                <AiOutlineLoading3Quarters
                  className="cl-spin"
                  style={{ fontSize: 20 }}
                />
              ) : (
                "Log In"
              )}
            </Btn>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                margin: "18px 0",
              }}
            >
              <div
                style={{ flex: 1, height: 1, background: "var(--border)" }}
              />
              <span
                style={{
                  fontSize: 12,
                  color: "var(--text-3)",
                  fontWeight: 600,
                }}
              >
                OR
              </span>
              <div
                style={{ flex: 1, height: 1, background: "var(--border)" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "center" }}>
              <GoogleLogin
                width="320"
                onSuccess={(credentialResponse: CredentialResponse) => {
                  if (credentialResponse.credential) {
                    verifyTPAuthentication(credentialResponse.credential);
                  } else {
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
                  }
                }}
                onError={() => {
                  dispatch({
                    type: SET_ALERTS,
                    payload: {
                      alerts: {
                        id: alerts.length,
                        type: "error",
                        content:
                          "There was a problem logging in with Google.",
                      },
                    },
                  });
                }}
              />
            </div>

            <div
              style={{
                textAlign: "center",
                marginTop: 22,
                fontSize: 13.5,
                color: "var(--text-2)",
              }}
            >
              Don't have an account yet?{" "}
              <span
                onClick={() => navigate("/register")}
                style={{
                  color: "var(--brand)",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Sign Up
              </span>
            </div>
          </div>
        </div>
        <style>{spinKeyframes}</style>
      </div>
    </GoogleOAuthProvider>
  );
}

const spinKeyframes = `
.cl-spin { animation: cl-spin 0.9s linear infinite; display: inline-block; }
@keyframes cl-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

export function BrandPanel() {
  return (
    <div
      style={{
        width: "44%",
        maxWidth: 560,
        position: "relative",
        overflow: "hidden",
        background:
          "linear-gradient(150deg, #1c7def 0%, #1257b0 55%, #0e3f87 100%)",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "44px 46px",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 420,
          height: 420,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.10)",
          top: -120,
          right: -120,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 240,
          height: 240,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
          bottom: 60,
          left: -80,
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          position: "relative",
        }}
      >
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 14,
            background: "rgba(255,255,255,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={ChatterLoopImg}
            alt=""
            style={{
              width: 32,
              height: 32,
              filter: "brightness(0) invert(1)",
            }}
          />
        </div>
        <span
          style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}
        >
          Chatterloop
        </span>
      </div>
      <div style={{ position: "relative" }}>
        <div
          style={{
            fontSize: 40,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            maxWidth: 420,
          }}
        >
          A more visible way to stay connected.
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: 16,
            opacity: 0.85,
            fontWeight: 500,
          }}
        >
          Link · Share · Explore
        </div>
      </div>
      <div
        style={{ position: "relative", fontSize: 12.5, opacity: 0.7 }}
      >
        © Neon Systems · ChatterLoop
      </div>
    </div>
  );
}

export default Login;
