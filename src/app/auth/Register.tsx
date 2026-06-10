/* eslint-disable @typescript-eslint/no-explicit-any */
import { CSSProperties, useState } from "react";
import ChatterLoopImg from "../../assets/imgs/chatterloop.png";
import { useNavigate } from "react-router-dom";
import { getDaysInMonth, monthList, years } from "../../reusables/vars/lists";
import { RegisterRequest } from "../../reusables/hooks/requests";
import { useDispatch, useSelector } from "react-redux";
import { checkIfValid } from "../../reusables/hooks/validatevariables";
import { SET_ALERTS } from "../../redux/types";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { monthNameToNumber } from "@/reusables/hooks/reusable";
import { Btn, Field, Icon, SelectField, useTheme } from "@/reusables/design";
import { BrandPanel } from "./Login";

type Gender = "Male" | "Female" | "Others";

const GENDER_STYLE: Record<Gender, { activeBg: CSSProperties["background"] }> = {
  Male: { activeBg: "#49a1f8" },
  Female: { activeBg: "#db56a4" },
  Others: {
    activeBg:
      "linear-gradient(180deg, #FE0000 16.66%, #FD8C00 16.66%, 33.32%, #FFE500 33.32%, 49.98%, #119F0B 49.98%, 66.64%, #0644B3 66.64%, 83.3%, #C22EDC 83.3%)",
  },
};

function GenderButton({
  value,
  active,
  onClick,
}: {
  value: Gender;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      style={{
        flex: 1,
        height: 40,
        border: "1px solid " + (active ? "transparent" : "var(--border-2)"),
        borderRadius: "var(--r-sm)",
        cursor: "pointer",
        fontSize: 13.5,
        fontWeight: 650,
        background: active ? GENDER_STYLE[value].activeBg : "var(--surface)",
        color: active ? "#fff" : "var(--text-2)",
        transition: "all .14s",
      }}
    >
      {value}
    </button>
  );
}

function Register() {
  const alerts = useSelector((state: any) => state.alerts);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [firstName, setfirstName] = useState("");
  const [middleName, setmiddleName] = useState("");
  const [lastName, setlastName] = useState("");
  const [email, setemail] = useState("");
  const [month, setmonth] = useState("");
  const [day, setday] = useState("");
  const [year, setyear] = useState("");
  const [gender, setgender] = useState<"" | Gender>("");
  const [password, setpassword] = useState("");
  const [agreed, setagreed] = useState(false);
  const [isWaitingRequest, setisWaitingRequest] = useState(false);

  const processregister = () => {
    setisWaitingRequest(true);
    if (agreed) {
      if (
        checkIfValid([
          firstName,
          lastName,
          email,
          month,
          day,
          year,
          gender,
          password,
        ])
      ) {
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
          setisWaitingRequest,
        );
      } else {
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
        setisWaitingRequest(false);
      }
    } else {
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
      setisWaitingRequest(false);
    }
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
            zIndex: 2,
          }}
        >
          <Icon n={theme === "dark" ? "light_mode" : "dark_mode"} s={20} />
        </button>

        <div
          style={{ width: "100%", maxWidth: 460, padding: "30px 0" }}
          className="cl-pop"
        >
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
              <span style={{ fontSize: 24, fontWeight: 800 }}>Chatterloop</span>
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
            Create your account
          </h1>
          <p
            style={{
              margin: "0 0 22px",
              color: "var(--text-2)",
              fontSize: 14,
            }}
          >
            Join the loop in less than a minute.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            <div style={{ display: "flex", gap: 10 }}>
              <Field
                icon="person"
                label="First name"
                placeholder="First"
                value={firstName}
                onChange={(e) => setfirstName(e.target.value)}
              />
              <Field
                label="Middle (optional)"
                placeholder="Middle"
                value={middleName}
                onChange={(e) => setmiddleName(e.target.value)}
              />
            </div>
            <Field
              icon="badge"
              label="Last name"
              placeholder="Last"
              value={lastName}
              onChange={(e) => setlastName(e.target.value)}
            />
            <Field
              icon="alternate_email"
              label="Email"
              placeholder="you@chatterloop.app"
              value={email}
              onChange={(e) => setemail(e.target.value)}
            />

            <div>
              <span
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-2)",
                  marginBottom: 6,
                }}
              >
                Birth date
              </span>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.3fr 1fr 1fr",
                  gap: 10,
                }}
              >
                <SelectField
                  icon="event"
                  value={month}
                  onChange={setmonth}
                >
                  <option value="">Month</option>
                  {monthList.map((val) => (
                    <option key={val} value={val}>
                      {val}
                    </option>
                  ))}
                </SelectField>
                <SelectField value={day} onChange={setday}>
                  <option value="">Day</option>
                  {month != "" && year != ""
                    ? getDaysInMonth(month, year).map((val) => (
                        <option key={val} value={val}>
                          {val}
                        </option>
                      ))
                    : null}
                </SelectField>
                <SelectField value={year} onChange={setyear}>
                  <option value="">Year</option>
                  {years.map((val) => (
                    <option key={val} value={val}>
                      {val}
                    </option>
                  ))}
                </SelectField>
              </div>
            </div>

            <div>
              <span
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-2)",
                  marginBottom: 6,
                }}
              >
                Gender
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                {(["Male", "Female", "Others"] as const).map((g) => (
                  <GenderButton
                    key={g}
                    value={g}
                    active={gender === g}
                    onClick={() => setgender(g)}
                  />
                ))}
              </div>
            </div>

            <Field
              icon="lock"
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setpassword(e.target.value)}
            />
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 16,
              fontSize: 13,
              color: "var(--text-2)",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setagreed(e.target.checked)}
              style={{
                accentColor: "var(--brand)",
                width: 15,
                height: 15,
              }}
            />
            I agree to the Terms and Conditions
          </label>

          <Btn
            block
            size="lg"
            onClick={processregister}
            disabled={isWaitingRequest}
            style={{ marginTop: 18 }}
          >
            {isWaitingRequest ? (
              <AiOutlineLoading3Quarters
                className="cl-spin"
                style={{ fontSize: 20 }}
              />
            ) : (
              "Sign Up"
            )}
          </Btn>

          <div
            style={{
              textAlign: "center",
              marginTop: 22,
              fontSize: 13.5,
              color: "var(--text-2)",
            }}
          >
            Already have an account?{" "}
            <span
              onClick={() => navigate("/login")}
              style={{
                color: "var(--brand)",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Log In
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
