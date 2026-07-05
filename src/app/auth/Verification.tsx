/* eslint-disable @typescript-eslint/no-explicit-any */
import { KeyboardEvent, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  LogoutRequest,
  VerifyCodeRequest,
} from "../../reusables/hooks/requests";
import { checkIfValid } from "../../reusables/hooks/validatevariables";
import { SET_ALERTS } from "../../redux/types";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { Btn, Icon, useTheme } from "@/reusables/design";
import { BrandMark, BrandPanel } from "./Login";
import { AuthenticationInterface } from "@/reusables/vars/interfaces";

function Verification() {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );
  const alerts = useSelector((state: any) => state.alerts);

  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [isWaitingRequest, setisWaitingRequest] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const dispatch = useDispatch();
  const { theme, toggleTheme } = useTheme();

  const setDigit = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return;
    setCode((c) => {
      const n = [...c];
      n[i] = v;
      return n;
    });
    if (v && i < 5) refs.current[i + 1]?.focus();
  };

  const onKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[i] && i) refs.current[i - 1]?.focus();
  };

  const verificationcode = code.join("");
  const full = code.every(Boolean);

  const verifyCodeProcess = () => {
    setisWaitingRequest(true);
    if (checkIfValid([verificationcode])) {
      if (verificationcode.split("").length == 6) {
        VerifyCodeRequest(
          { code: verificationcode },
          dispatch,
          authentication,
          alerts,
          setisWaitingRequest,
        );
      } else {
        dispatch({
          type: SET_ALERTS,
          payload: {
            alerts: {
              id: alerts.length,
              type: "warning",
              content: "Please complete your verification code.",
            },
          },
        });
        setisWaitingRequest(false);
      }
    } else {
      dispatch({
        type: SET_ALERTS,
        payload: {
          alerts: {
            id: alerts.length,
            type: "warning",
            content: "Please input your verification code.",
          },
        },
      });
      setisWaitingRequest(false);
    }
  };

  const logoutProcess = () => {
    LogoutRequest(dispatch);
  };

  const isMobile =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 760px)").matches;

  return (
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

        <div
          style={{ width: "100%", maxWidth: 400, textAlign: "center" }}
          className="cl-pop"
        >
          {isMobile && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                justifyContent: "center",
                marginBottom: 18,
              }}
            >
              <BrandMark size={38} />
              <span style={{ fontSize: 24, fontWeight: 800 }}>Chatterloop</span>
            </div>
          )}
          <div
            style={{
              width: 62,
              height: 62,
              borderRadius: "50%",
              background: "var(--brand-soft)",
              margin: "0 auto 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon n="mark_email_read" s={30} c="var(--brand)" />
          </div>
          <h1
            style={{
              margin: "0 0 6px",
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            Verify your email
          </h1>
          <p
            style={{ margin: "0 0 24px", color: "var(--text-2)", fontSize: 14 }}
          >
            We sent a 6-digit code to{" "}
            <b style={{ color: "var(--text)" }}>
              {authentication?.user?.email}
            </b>
          </p>

          <div
            style={{
              display: "flex",
              gap: 9,
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            {code.map((d, i) => (
              <input
                key={i}
                ref={(el) => (refs.current[i] = el)}
                value={d}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => onKey(i, e)}
                inputMode="numeric"
                maxLength={1}
                style={{
                  width: 46,
                  height: 56,
                  textAlign: "center",
                  fontSize: 22,
                  fontWeight: 700,
                  color: "var(--text)",
                  background: "var(--input)",
                  border:
                    "1.5px solid " + (d ? "var(--brand)" : "var(--border-2)"),
                  borderRadius: "var(--r-sm)",
                  outline: "none",
                }}
              />
            ))}
          </div>

          <Btn
            block
            size="lg"
            onClick={verifyCodeProcess}
            disabled={isWaitingRequest || !full}
          >
            {isWaitingRequest ? (
              <AiOutlineLoading3Quarters
                className="cl-spin"
                style={{ fontSize: 20 }}
              />
            ) : (
              "Verify"
            )}
          </Btn>

          <div
            style={{
              marginTop: 18,
              fontSize: 13.5,
              color: "var(--text-2)",
            }}
          >
            Didn't get it?{" "}
            <span
              style={{
                color: "var(--brand)",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Resend Code
            </span>
            <span style={{ margin: "0 8px", color: "var(--border-2)" }}>·</span>
            <span
              onClick={logoutProcess}
              style={{
                color: "var(--brand)",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Logout
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Verification;

