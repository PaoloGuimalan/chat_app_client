/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { SET_ALERTS } from "@/redux/types";
import { Field } from "@/reusables/design";
import { UpdateProfileInfoRequest } from "@/reusables/hooks/requests";
import { AuthenticationInterface } from "@/reusables/vars/interfaces";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

function Credentials() {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );

  const alerts = useSelector((state: any) => state.alerts);

  const dispatch = useDispatch();

  const [isLoading, setisLoading] = useState<boolean>(false); // setisLoading false

  const [email, setemail] = useState<string>(authentication.user.email);
  const [username, setusername] = useState<string>(
    authentication.user.username,
  );

  const resetFields = () => {
    setemail(authentication.user.email);
    setusername(authentication.user.username);
  };

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

  const updateProfileProcess = () => {
    setisLoading(true);

    const fieldsToUpdate: Record<string, any> = {};

    if (username.trim() !== "") {
      if (username !== authentication.user.username) {
        fieldsToUpdate["username"] = username;
      }
    } else {
      triggerAlert("warning", "Username cannot be empty");
      return;
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
          Credentials
        </span>
      </div>
      <div className="tw-w-full tw-flex tw-flex-col tw-gap-[30px]">
        <div className="tw-w-full tw-flex tw-flex-col tw-items-start tw-gap-[15px]">
          <div className="tw-w-full tw-flex tw-flex-col tw-items-start">
            <span className="tw-text-[14px] tw-font-semibold">Username</span>
            <span className="tw-text-[14px] tw-text-left tw-text-[#6b6b6d]">
              Changing your username will affect how people contact, mention,
              and access your contents.
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
              <Field
                icon="alternate_email"
                placeholder="user1234"
                value={username}
                onChange={(e) => setusername(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="tw-w-full tw-flex tw-flex-col tw-items-start tw-gap-[15px]">
          <div className="tw-w-full tw-flex tw-flex-col tw-items-start">
            <span className="tw-text-[14px] tw-font-semibold">Email</span>
            <span className="tw-text-[14px] tw-text-left tw-text-[#6b6b6d]">
              Replace your user email. Note that this will require verification
              from your old and new email address (temporarily disabled).
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
              <Field
                disabled
                icon="email"
                placeholder="you@chatterloop.app"
                value={email}
                onChange={(e) => setemail(e.target.value)}
              />
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

export default Credentials;
