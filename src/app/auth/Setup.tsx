/* eslint-disable @typescript-eslint/no-explicit-any */
import { SET_ALERTS } from "@/redux/types";
import {
  LogoutRequest,
  CompleteProfileRequest,
} from "@/reusables/hooks/requests";
import { AuthenticationInterface } from "@/reusables/vars/interfaces";
import { getDaysInMonth, monthList, years } from "@/reusables/vars/lists";
import { CSSProperties, useEffect, useMemo, useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import {
  Btn,
  Icon,
  SelectField,
  useTheme,
} from "@/reusables/design";
import { BrandPanel } from "./Login";

type Gender = "Male" | "Female" | "Others";

const GENDER_ACTIVE: Record<Gender, CSSProperties["background"]> = {
  Male: "#49a1f8",
  Female: "#db56a4",
  Others:
    "linear-gradient(180deg, #FE0000 16.66%, #FD8C00 16.66%, 33.32%, #FFE500 33.32%, 49.98%, #119F0B 49.98%, 66.64%, #0644B3 66.64%, 83.3%, #C22EDC 83.3%)",
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
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        height: 40,
        border: "1px solid " + (active ? "transparent" : "var(--border-2)"),
        borderRadius: "var(--r-sm)",
        cursor: "pointer",
        fontSize: 13.5,
        fontWeight: 650,
        background: active ? GENDER_ACTIVE[value] : "var(--surface)",
        color: active ? "#fff" : "var(--text-2)",
        transition: "all .14s",
        width: "100%",
      }}
    >
      {value}
    </button>
  );
}

function Setup() {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );
  const alerts = useSelector((state: any) => state.alerts);

  const getMissingFields = (obj: any, keys: string[]) => {
    return keys.filter((key) => obj[key] === null || obj[key] === undefined);
  };

  const [isWaitingRequest, setisWaitingRequest] = useState<boolean>(false);
  const [requiredFields, setrequiredFields] = useState<string[]>([]);
  const [month, setmonth] = useState<string>("");
  const [day, setday] = useState<string>("");
  const [year, setyear] = useState<string>("");
  const [gender, setgender] = useState<"" | Gender>("");

  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const requiredKeys = ["birthdate", "gender"];
    if (authentication.user) {
      const toFillKeys = getMissingFields(authentication.user, requiredKeys);
      setrequiredFields(toFillKeys);
    }
  }, [authentication.user]);

  const dispatch = useDispatch();

  const isOver13 = useMemo(() => {
    if (!requiredFields.includes("birthdate")) return true;
    if (month === "" || day === "" || year === "") return false;
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const monthIndex = monthNames.indexOf(month);
    if (monthIndex === -1) return false;
    const birthDate = new Date(parseInt(year), monthIndex, parseInt(day));
    if (birthDate.getMonth() !== monthIndex) return false;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age--;
    return age > 13;
  }, [month, day, year, requiredFields]);

  const getFormattedDate = (
    monthName: string,
    dayStr: string,
    yearStr: string,
  ): string | null => {
    const monthMap: Record<string, string> = {
      january: "01", february: "02", march: "03", april: "04",
      may: "05", june: "06", july: "07", august: "08",
      september: "09", october: "10", november: "11", december: "12",
      jan: "01", feb: "02", mar: "03", apr: "04",
      jun: "06", jul: "07", aug: "08", sep: "09",
      oct: "10", nov: "11", dec: "12",
    };
    const numericMonth = monthMap[monthName.trim().toLowerCase()];
    if (!numericMonth || !dayStr || !yearStr) return null;
    const numericDay = dayStr.trim().padStart(2, "0");
    const numericYear = yearStr.trim();
    return `${numericYear}-${numericMonth}-${numericDay} 08:00:00.000 +0800`;
  };

  const logoutProcess = () => {
    LogoutRequest(dispatch);
  };

  const completeProfileProcess = () => {
    setisWaitingRequest(true);
    const finalPayload: any = {};

    if (requiredFields.includes("birthdate")) {
      if (!isOver13) {
        dispatch({
          type: SET_ALERTS,
          payload: {
            alerts: {
              id: alerts.length,
              type: "warning",
              content: "Age must be 13 years or older",
            },
          },
        });
        setisWaitingRequest(false);
        return;
      }
      finalPayload["birthdate"] = getFormattedDate(month, day, year);
    }

    if (requiredFields.includes("gender")) {
      if (gender === "" || gender.trim() === "") {
        dispatch({
          type: SET_ALERTS,
          payload: {
            alerts: {
              id: alerts.length,
              type: "warning",
              content: "Please select a gender",
            },
          },
        });
        setisWaitingRequest(false);
        return;
      }
      finalPayload["gender"] = (gender as string).toLowerCase();
    }

    CompleteProfileRequest(finalPayload, dispatch, alerts, setisWaitingRequest);
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
          }}
        >
          <Icon n={theme === "dark" ? "light_mode" : "dark_mode"} s={20} />
        </button>

        <div
          style={{ width: "100%", maxWidth: 420, textAlign: "center" }}
          className="cl-pop"
        >
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
            <Icon n="account_circle" s={32} c="var(--brand)" />
          </div>
          <h1
            style={{
              margin: "0 0 6px",
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            Complete your profile
          </h1>
          <p
            style={{
              margin: "0 0 24px",
              color: "var(--text-2)",
              fontSize: 14,
            }}
          >
            Just a couple more details and you're in.
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              textAlign: "left",
            }}
          >
            {requiredFields.includes("birthdate") && (
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
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: 12,
                    width: "100%",
                  }}
                >
                  <SelectField icon="event" value={month} onChange={setmonth}>
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
            )}

            {requiredFields.includes("gender") && (
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
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: 10,
                    width: "100%",
                  }}
                >
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
            )}
          </div>

          <Btn
            block
            size="lg"
            onClick={completeProfileProcess}
            disabled={isWaitingRequest}
            style={{ marginTop: 22 }}
          >
            {isWaitingRequest ? (
              <AiOutlineLoading3Quarters
                className="cl-spin"
                style={{ fontSize: 20 }}
              />
            ) : (
              "Complete"
            )}
          </Btn>

          <div style={{ marginTop: 18, fontSize: 13.5 }}>
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

export default Setup;
