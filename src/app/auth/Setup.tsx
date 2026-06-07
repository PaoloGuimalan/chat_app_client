/* eslint-disable @typescript-eslint/no-explicit-any */
import { SET_ALERTS } from "@/redux/types";
import {
  LogoutRequest,
  CompleteProfileRequest,
} from "@/reusables/hooks/requests";
import { AuthenticationInterface } from "@/reusables/vars/interfaces";
import { getDaysInMonth, monthList, years } from "@/reusables/vars/lists";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { BsPersonFillExclamation } from "react-icons/bs";
import { useDispatch, useSelector } from "react-redux";

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

  const [gender, setgender] = useState<string>("");

  useEffect(() => {
    const requiredKeys = ["birthdate", "gender"];
    if (authentication.user) {
      const toFillKeys = getMissingFields(authentication.user, requiredKeys);

      setrequiredFields(toFillKeys);
    }
  }, [authentication.user]);

  const dispatch = useDispatch();

  const isOver13 = useMemo(() => {
    // Return true automatically if birthdate is not in requiredFields
    if (!requiredFields.includes("birthdate")) {
      return true;
    }

    // Return false if any value is an empty string
    if (month === "" || day === "" || year === "") return false;

    // Convert month name to month number (0-11)
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

    // Invalid month name
    if (monthIndex === -1) return false;

    const birthDate = new Date(parseInt(year), monthIndex, parseInt(day));

    // Validate date is real
    if (birthDate.getMonth() !== monthIndex) return false;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();

    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }

    return age > 13;
  }, [month, day, year, requiredFields]);

  const getFormattedDate = (
    monthName: string,
    dayStr: string,
    yearStr: string,
  ): string | null => {
    const monthMap: Record<string, string> = {
      january: "01",
      february: "02",
      march: "03",
      april: "04",
      may: "05",
      june: "06",
      july: "07",
      august: "08",
      september: "09",
      october: "10",
      november: "11",
      december: "12",
      jan: "01",
      feb: "02",
      mar: "03",
      apr: "04",
      jun: "06",
      jul: "07",
      aug: "08",
      sep: "09",
      oct: "10",
      nov: "11",
      dec: "12",
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

      const birthdate = getFormattedDate(month, day, year);
      finalPayload["birthdate"] = birthdate;
    }

    if (requiredFields.includes("gender")) {
      if (gender.trim() === "") {
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
      finalPayload["gender"] = gender.toLowerCase();
    }

    CompleteProfileRequest(finalPayload, dispatch, alerts, setisWaitingRequest);
  };

  return (
    <div id="div_verification">
      <motion.div
        initial={{
          width: "0%",
        }}
        animate={{
          width: "95%",
        }}
        transition={{
          duration: 2,
          delay: 0.5,
        }}
        id="div_setup_container"
      >
        <div id="div_verification_header_container">
          <div id="div_verification_icon_container" className="tw-bg-[#dfdfdf]">
            <BsPersonFillExclamation size={65} color="#3f3f3f" />
            <div id="div_ver_bubble" className="tw-bg-[#dfdfdf]" />
            <div id="div_ver_bubble2" className="tw-bg-[#dfdfdf]" />
          </div>
          <motion.span
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              duration: 1,
              delay: 2.5,
            }}
            id="span_verify_label"
          >
            Complete your profile
          </motion.span>
        </div>
        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          transition={{
            duration: 1,
            delay: 2.5,
          }}
          id="div_verification_form"
        >
          <span id="span_verifiaction_label_to_user">
            Please complete the asked details and verify if all are true.
          </span>
          <div className="tw-w-full tw-flex tw-flex-col tw-gap-[15px] tw-mb-[0px]">
            {requiredFields.includes("birthdate") && (
              <div id="div_birthdate">
                <span id="span_birthdate_label">Birth Date</span>
                <div id="div_inputs_dates">
                  <select
                    className="input_dates"
                    // placeholder="Month"
                    value={month}
                    onChange={(e) => {
                      setmonth(e.target.value);
                    }}
                  >
                    <option value="" defaultValue={""}>
                      Month
                    </option>
                    {monthList.map((val, i) => {
                      return (
                        <option key={i} value={val}>
                          {val}
                        </option>
                      );
                    })}
                  </select>
                  <select
                    className="input_dates"
                    // placeholder="Year"
                    value={year}
                    onChange={(e) => {
                      setyear(e.target.value);
                    }}
                  >
                    <option value="" defaultValue={""}>
                      Year
                    </option>
                    {years.map((val, i) => {
                      return (
                        <option key={i} value={val}>
                          {val}
                        </option>
                      );
                    })}
                  </select>
                  <select
                    className="input_dates"
                    // placeholder="Day"
                    value={day}
                    onChange={(e) => {
                      setday(e.target.value);
                    }}
                  >
                    <option value="" defaultValue={""}>
                      Day
                    </option>
                    {month != "" && year != ""
                      ? getDaysInMonth(month, year).map((val, i) => {
                          return (
                            <option key={i} value={val}>
                              {val}
                            </option>
                          );
                        })
                      : null}
                  </select>
                </div>
              </div>
            )}
            {requiredFields.includes("gender") && (
              <div id="div_birthdate">
                <span id="span_birthdate_label">Gender</span>
                <div id="div_inputs_dates">
                  <motion.button
                    initial={{
                      backgroundColor: "#f0f0f0",
                    }}
                    animate={{
                      backgroundColor: gender == "Male" ? "#49a1f8" : "#f0f0f0",
                      color: gender == "Male" ? "white" : "#4A4A4A",
                    }}
                    onClick={() => {
                      setgender("Male");
                    }}
                    className="input_gender"
                  >
                    Male
                  </motion.button>
                  <motion.button
                    initial={{
                      backgroundColor: "#f0f0f0",
                    }}
                    animate={{
                      backgroundColor:
                        gender == "Female" ? "#db56a4" : "#f0f0f0",
                      color: gender == "Female" ? "white" : "#4A4A4A",
                    }}
                    onClick={() => {
                      setgender("Female");
                    }}
                    className="input_gender"
                  >
                    Female
                  </motion.button>
                  <motion.button
                    style={{
                      background:
                        gender == "Others"
                          ? "linear-gradient(180deg, #FE0000 16.66%, #FD8C00 16.66%, 33.32%, #FFE500 33.32%, 49.98%, #119F0B 49.98%, 66.64%, #0644B3 66.64%, 83.3%, #C22EDC 83.3%)"
                          : "#f0f0f0",
                      color: gender == "Others" ? "white" : "#4A4A4A",
                    }}
                    onClick={() => {
                      setgender("Others");
                    }}
                    className="input_gender"
                  >
                    Others
                  </motion.button>
                </div>
              </div>
            )}
          </div>
          <div className="tw-w-full tw-flex tw-gap-[20px] tw-items-center tw-justify-center">
            {isWaitingRequest ? (
              <button
                id="btn_complete"
                disabled
                className="tw-flex tw-items-center tw-justify-center"
              >
                <motion.div
                  animate={{
                    rotate: -360,
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                  }}
                  id="div_loader_request_complete"
                  className="tw-mt-[8px]"
                >
                  <AiOutlineLoading3Quarters style={{ fontSize: "15px" }} />
                </motion.div>
              </button>
            ) : (
              <button
                id="btn_complete"
                onClick={() => {
                  completeProfileProcess();
                }}
              >
                Complete
              </button>
            )}
            <button
              className="btn_verification_navigations"
              onClick={() => {
                logoutProcess();
              }}
            >
              Logout
            </button>
          </div>
        </motion.div>
      </motion.div>
      <motion.div
        initial={{
          scale: 0,
        }}
        animate={{
          scale: 1,
        }}
        transition={{
          delay: 1.2,
          duration: 1.5,
        }}
        id="div_bubble_verification1"
      />
      <motion.div
        initial={{
          scale: 0,
        }}
        animate={{
          scale: 1,
        }}
        transition={{
          delay: 1.2,
          duration: 1.5,
        }}
        id="div_bubble_verification2"
      />
      <motion.div
        initial={{
          scale: 0,
        }}
        animate={{
          scale: 1,
        }}
        transition={{
          delay: 1.2,
          duration: 1.5,
        }}
        id="div_bubble_verification3"
      />
      <motion.div
        initial={{
          scale: 0,
        }}
        animate={{
          scale: 1,
        }}
        transition={{
          delay: 1.2,
          duration: 1.5,
        }}
        id="div_bubble_verification4"
      />
      <motion.div
        initial={{
          scale: 0,
        }}
        animate={{
          scale: 1,
        }}
        transition={{
          delay: 1.2,
          duration: 1.5,
        }}
        id="div_bubble_verification5"
      />
      <motion.div
        initial={{
          scale: 0,
        }}
        animate={{
          scale: 1,
        }}
        transition={{
          delay: 1.2,
          duration: 1.5,
        }}
        id="div_bubble_verification6"
      />
      <motion.div
        initial={{
          scale: 0,
        }}
        animate={{
          scale: 1,
        }}
        transition={{
          delay: 1.2,
          duration: 1.5,
        }}
        id="div_bubble_verification7"
      />
      <motion.div
        initial={{
          scale: 0,
        }}
        animate={{
          scale: 1,
        }}
        transition={{
          delay: 1.2,
          duration: 1.5,
        }}
        id="div_bubble_verification8"
      />
    </div>
  );
}

export default Setup;
