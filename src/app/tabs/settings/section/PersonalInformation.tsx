/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Gender, GenderButton } from "@/app/auth/Register";
import { SET_ALERTS } from "@/redux/types";
import { Field, SelectField } from "@/reusables/design";
import { UpdateProfileInfoRequest } from "@/reusables/hooks/requests";
import {
  getFormattedDate,
  is13YearsOldOrAbove,
} from "@/reusables/hooks/reusable";
import { AuthenticationInterface } from "@/reusables/vars/interfaces";
import { getDaysInMonth, monthList, years } from "@/reusables/vars/lists";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

function PersonalInformation() {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );

  const alerts = useSelector((state: any) => state.alerts);

  const dispatch = useDispatch();

  const genderr = authentication?.user?.gender;
  const capGender = genderr
    ? genderr[0].toUpperCase() + genderr.slice(1)
    : ("" as any);

  const [firstName, setfirstName] = useState(
    authentication.user.fullName.firstName,
  );
  const [middleName, setmiddleName] = useState(
    authentication.user.fullName.middleName === "N/A"
      ? ""
      : authentication.user.fullName.middleName,
  );
  const [lastName, setlastName] = useState(
    authentication.user.fullName.lastName,
  );

  const [month, setmonth] = useState(
    authentication.user.birthdate?.month ?? "",
  );
  const [day, setday] = useState(authentication.user.birthdate?.day ?? "");
  const [year, setyear] = useState(authentication.user.birthdate?.year ?? "");
  const [gender, setgender] = useState<"" | Gender>(capGender);

  const [isLoading, setisLoading] = useState<boolean>(false); // setisLoading false

  const triggerAlert = (type: string, content: string) => {
    dispatch({
      type: SET_ALERTS,
      payload: {
        alerts: {
          id: alerts.length,
          type,
          content,
        },
      },
    });
    setisLoading(false);
  };

  const resetFields = () => {
    setfirstName(authentication.user.fullName.firstName);
    setmiddleName(
      authentication.user.fullName.middleName === "N/A"
        ? ""
        : authentication.user.fullName.middleName,
    );
    setlastName(authentication.user.fullName.lastName);
    setmonth(authentication.user.birthdate?.month ?? "");
    setday(authentication.user.birthdate?.day ?? "");
    setyear(authentication.user.birthdate?.year ?? "");
    setgender(capGender);
  };

  const updateProfileProcess = () => {
    setisLoading(true);

    const fieldsToUpdate: Record<string, any> = {};

    if (firstName.trim() !== "") {
      if (firstName !== authentication.user.fullName.firstName) {
        fieldsToUpdate["first_name"] = firstName;
      }
    } else {
      triggerAlert("warning", "First name cannot be empty");
      return;
    }

    if (middleName.trim() !== "") {
      if (middleName.trim() === "N/A") {
        fieldsToUpdate["middle_name"] = middleName;
      } else {
        if (middleName !== authentication.user.fullName.middleName) {
          fieldsToUpdate["middle_name"] = middleName;
        }
      }
    } else {
      if (authentication.user.fullName.middleName !== "N/A") {
        fieldsToUpdate["middle_name"] = "N/A";
      }
    }

    if (lastName.trim() !== "") {
      if (lastName !== authentication.user.fullName.lastName) {
        fieldsToUpdate["last_name"] = lastName;
      }
    } else {
      triggerAlert("warning", "Last name cannot be empty");
      return;
    }

    const currentBirthdate = getFormattedDate(
      authentication.user.birthdate?.month ?? "",
      authentication.user.birthdate?.day ?? "",
      authentication.user.birthdate?.year ?? "",
    );
    const newBirthdate = getFormattedDate(month, day, year) ?? "";

    if (newBirthdate !== currentBirthdate) {
      if (is13YearsOldOrAbove(newBirthdate)) {
        fieldsToUpdate["birthdate"] = newBirthdate;
      } else {
        triggerAlert("warning", "Age must be 13 years or above");
        return;
      }
    }

    if (gender.trim() !== "") {
      if (genderr !== gender) {
        fieldsToUpdate["gender"] = gender.toLowerCase();
      }
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
      triggerAlert("warning", "There are no fields to be updated");
      return;
    }

    UpdateProfileInfoRequest(fieldsToUpdate, dispatch, alerts, setisLoading);
  };

  return (
    <div className="tw-w-full tw-h-full tw-flex tw-gap-[10px] tw-flex-col tw-items-start tw-font-Inter">
      <div className="tw-w-full tw-flex tw-items-start">
        <span className="tw-text-[16px] tw-font-Inter tw-font-semibold">
          Personal Information
        </span>
      </div>
      <div className="tw-w-full tw-flex tw-flex-col tw-gap-[30px]">
        <div className="tw-w-full tw-flex tw-flex-col tw-items-start tw-gap-[15px]">
          <div className="tw-w-full tw-flex tw-flex-col tw-items-start">
            <span className="tw-text-[14px] tw-font-semibold">Name</span>
            <span className="tw-text-[14px] tw-text-left tw-text-[#6b6b6d]">
              Change your name how you prefer it.
            </span>
          </div>
          <div className="tw-w-full tw-flex tw-flex-col tw-items-start tw-gap-[10px]">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 13,
                width: "100%",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                  gap: 12,
                  width: "100%",
                }}
              >
                <Field
                  icon="person"
                  placeholder="First"
                  value={firstName}
                  onChange={(e) => setfirstName(e.target.value)}
                />
                <Field
                  placeholder="Middle (Optional)"
                  value={middleName}
                  onChange={(e) => setmiddleName(e.target.value)}
                />
              </div>
              <Field
                icon="badge"
                placeholder="Last"
                value={lastName}
                onChange={(e) => setlastName(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="tw-w-full tw-flex tw-flex-col tw-items-start tw-gap-[15px]">
          <div className="tw-w-full tw-flex tw-flex-col tw-items-start">
            <span className="tw-text-[14px] tw-font-semibold">Birthdate</span>
            <span className="tw-text-[14px] tw-text-left tw-text-[#6b6b6d]">
              Update your birthdate.
            </span>
          </div>
          <div className="tw-w-full tw-flex tw-flex-col tw-items-start tw-gap-[10px]">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 13,
                width: "100%",
              }}
            >
              <div>
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
            </div>
          </div>
        </div>
        <div className="tw-w-full tw-flex tw-flex-col tw-items-start tw-gap-[15px]">
          <div className="tw-w-full tw-flex tw-flex-col tw-items-start">
            <span className="tw-text-[14px] tw-font-semibold">Gender</span>
            <span className="tw-text-[14px] tw-text-left tw-text-[#6b6b6d]">
              Update your gender.
            </span>
          </div>
          <div className="tw-w-full tw-flex tw-flex-col tw-items-start tw-gap-[10px]">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 13,
                width: "100%",
              }}
            >
              <div>
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
            </div>
          </div>
        </div>
        <div className="tw-w-full tw-flex tw-flex-col tw-items-start tw-gap-[15px]">
          <div className="tw-w-full tw-flex tw-flex-row tw-items-start tw-justify-end tw-gap-[6px]">
            <button
              onClick={updateProfileProcess}
              disabled={isLoading}
              className="tw-min-w-[92px] tw-cursor-pointer tw-font-semibold tw-font-Inter tw-border-none tw-px-[14px] tw-py-[10px] tw-bg-[var(--brand)] tw-text-white tw-rounded-[var(--r-md)] tw-text-[13px] disabled:tw-opacity-[0.65] tw-transition-colors"
            >
              Save
            </button>
            <button
              disabled={isLoading}
              onClick={resetFields}
              className="tw-min-w-[92px] tw-cursor-pointer tw-font-semibold tw-font-Inter tw-border-none tw-px-[14px] tw-py-[10px] tw-bg-[var(--surface-2)] tw-text-[var(--text)] tw-rounded-[var(--r-md)] tw-text-[13px] hover:tw-bg-[var(--surface-hover)] tw-transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PersonalInformation;
