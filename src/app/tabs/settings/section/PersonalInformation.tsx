/* eslint-disable @typescript-eslint/no-explicit-any */
import { Gender, GenderButton } from "@/app/auth/Register";
import { Field, SelectField } from "@/reusables/design";
import { AuthenticationInterface } from "@/reusables/vars/interfaces";
import { getDaysInMonth, monthList, years } from "@/reusables/vars/lists";
import { useState } from "react";
import { useSelector } from "react-redux";

function PersonalInformation() {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );

  const genderr = authentication?.user?.gender;
  const capGender = genderr
    ? genderr[0].toUpperCase() + genderr.slice(1)
    : ("" as any);

  const [month, setmonth] = useState(
    authentication.user.birthdate?.month ?? "",
  );
  const [day, setday] = useState(authentication.user.birthdate?.day ?? "");
  const [year, setyear] = useState(authentication.user.birthdate?.year ?? "");
  const [gender, setgender] = useState<"" | Gender>(capGender);

  return (
    <div className="tw-w-full tw-h-full tw-flex tw-gap-[10px] tw-flex-col tw-items-start tw-font-Inter">
      <div className="tw-w-full tw-flex tw-items-start">
        <span className="tw-text-[16px] tw-font-Inter tw-font-semibold">
          Personal Information (under development)
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
                  value={authentication.user.fullName.firstName}
                  // onChange={(e) => setfirstName(e.target.value)}
                />
                <Field
                  placeholder="Middle (Optional)"
                  value={authentication.user.fullName.middleName}
                  // onChange={(e) => setmiddleName(e.target.value)}
                />
              </div>
              <Field
                icon="badge"
                placeholder="Last"
                value={authentication.user.fullName.lastName}
                //   onChange={(e) => setlastName(e.target.value)}
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
      </div>
    </div>
  );
}

export default PersonalInformation;
