/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import {
  getDaysInMonth,
  monthList,
  years,
} from "../../reusables/vars/lists";
import { RegisterRequest } from "../../reusables/hooks/requests";
import { checkIfValid } from "../../reusables/hooks/validatevariables";
import { SET_ALERTS } from "../../redux/types";
import { monthNameToNumber } from "@/reusables/hooks/reusable";
import AuthShell from "./AuthShell";

function Register() {
  const alerts = useSelector((state: any) => state.alerts);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem("cl_up_theme") || "light");

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [year, setYear] = useState("");
  const [gender, setGender] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isWaitingRequest, setIsWaitingRequest] = useState(false);

  const isReady = useMemo(
    () =>
      checkIfValid([
        firstName,
        lastName,
        email,
        month,
        day,
        year,
        gender,
        password,
      ]) && agreed,
    [firstName, lastName, email, month, day, year, gender, password, agreed],
  );

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("cl_up_theme", nextTheme);
  };

  const processRegister = () => {
    setIsWaitingRequest(true);

    if (!agreed) {
      dispatch({
        type: SET_ALERTS,
        payload: {
          alerts: {
            id: alerts.length,
            type: "warning",
            content: "Please agree with the Terms and Conditions.",
          },
        },
      });
      setIsWaitingRequest(false);
      return;
    }

    if (!checkIfValid([firstName, lastName, email, month, day, year, gender, password])) {
      dispatch({
        type: SET_ALERTS,
        payload: {
          alerts: {
            id: alerts.length,
            type: "warning",
            content: "Please complete the fields.",
          },
        },
      });
      setIsWaitingRequest(false);
      return;
    }

    RegisterRequest(
      {
        firstName,
        middleName,
        lastName,
        birthmonth: monthNameToNumber(month),
        birthday: day,
        birthyear: year,
        gender,
        email,
        password,
      },
      dispatch,
      alerts,
      setIsWaitingRequest,
    );
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join the loop in less than a minute."
      theme={theme}
      onToggleTheme={toggleTheme}
    >
      <div style={{ padding: 28 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>
            Sign up
          </h1>
          <p style={{ margin: 0, color: "var(--cl-text-2)", fontSize: 14 }}>
            Set up your profile and start connecting.
          </p>
        </div>

        <div style={{ display: "grid", gap: 14 }}>
          <div className="cl-grid-2">
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--cl-text-2)" }}>
                First name
              </span>
              <input
                type="text"
                placeholder="Paolo"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                style={authInputStyle}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--cl-text-2)" }}>
                Last name
              </span>
              <input
                type="text"
                placeholder="Guimalan"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                style={authInputStyle}
              />
            </label>
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--cl-text-2)" }}>
              Middle name <span style={{ opacity: 0.7 }}>(optional)</span>
            </span>
            <input
              type="text"
              placeholder="Middle name"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              style={authInputStyle}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--cl-text-2)" }}>
              Email
            </span>
            <input
              type="text"
              placeholder="you@chatterloop.app"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={authInputStyle}
            />
          </label>

          <div style={{ display: "grid", gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--cl-text-2)" }}>
              Birth date
            </span>
            <div className="cl-grid-3">
              <select value={month} onChange={(e) => setMonth(e.target.value)} style={authInputStyle}>
                <option value="">Month</option>
                {monthList.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
              <select value={day} onChange={(e) => setDay(e.target.value)} style={authInputStyle}>
                <option value="">Day</option>
                {month !== "" && year !== ""
                  ? getDaysInMonth(month, year).map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))
                  : null}
              </select>
              <select value={year} onChange={(e) => setYear(e.target.value)} style={authInputStyle}>
                <option value="">Year</option>
                {years.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--cl-text-2)" }}>
              Gender
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
              {[
                { value: "Male", label: "Male" },
                { value: "Female", label: "Female" },
                { value: "Others", label: "Others" },
              ].map((option) => {
                const active = gender === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setGender(option.value)}
                    style={{
                      ...genderButtonStyle,
                      borderColor: active ? "transparent" : "var(--cl-border-2)",
                      background:
                        option.value === "Others" && active
                          ? "linear-gradient(180deg, #FE0000 16.66%, #FD8C00 16.66%, 33.32%, #FFE500 33.32%, 49.98%, #119F0B 49.98%, 66.64%, #0644B3 66.64%, 83.3%, #C22EDC 83.3%)"
                          : active
                            ? "var(--cl-brand)"
                            : "var(--cl-surface)",
                      color: active ? "#fff" : "var(--cl-text)",
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--cl-text-2)" }}>
              Password
            </span>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={authInputStyle}
            />
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--cl-text-2)" }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ accentColor: "var(--cl-brand)" }}
            />
            I agree to the Terms and Conditions
          </label>

          <button
            type="button"
            onClick={processRegister}
            disabled={!isReady || isWaitingRequest}
            style={{
              width: "100%",
              height: 46,
              border: "none",
              borderRadius: "var(--cl-radius-sm)",
              background: "var(--cl-brand)",
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              cursor: isReady && !isWaitingRequest ? "pointer" : "not-allowed",
              opacity: isReady && !isWaitingRequest ? 1 : 0.7,
              boxShadow: "0 2px 8px rgba(28,125,239,0.30)",
            }}
          >
            {isWaitingRequest ? (
              <AiOutlineLoading3Quarters style={{ animation: "clSpin 1s linear infinite" }} />
            ) : (
              "Sign Up"
            )}
          </button>

          <div style={{ textAlign: "center", marginTop: 8, fontSize: 13.5, color: "var(--cl-text-2)" }}>
            Already have an account?{" "}
            <span
              onClick={() => navigate("/login")}
              style={{ color: "var(--cl-brand)", fontWeight: 700, cursor: "pointer" }}
            >
              Log In
            </span>
          </div>
        </div>
      </div>
    </AuthShell>
  );
}

const authInputStyle: React.CSSProperties = {
  width: "100%",
  height: 44,
  borderRadius: "var(--cl-radius-sm)",
  border: "1px solid var(--cl-border)",
  background: "var(--cl-input)",
  color: "var(--cl-text)",
  padding: "0 14px",
  outline: "none",
  fontSize: 14,
};

const genderButtonStyle: React.CSSProperties = {
  height: 42,
  borderRadius: "var(--cl-radius-sm)",
  border: "1px solid var(--cl-border-2)",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

export default Register;
