/* eslint-disable @typescript-eslint/no-explicit-any */
import { Field } from "@/reusables/design";
import { AuthenticationInterface } from "@/reusables/vars/interfaces";
import { useSelector } from "react-redux";

function Credentials() {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );

  return (
    <div className="tw-w-full tw-h-full tw-flex tw-gap-[10px] tw-flex-col tw-items-start tw-font-Inter">
      <div className="tw-w-full tw-flex tw-items-start">
        <span className="tw-text-[16px] tw-font-Inter tw-font-semibold">
          Credentials (under development)
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
                value={authentication.user.username}
                // onChange={(e) => setemail(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="tw-w-full tw-flex tw-flex-col tw-items-start tw-gap-[15px]">
          <div className="tw-w-full tw-flex tw-flex-col tw-items-start">
            <span className="tw-text-[14px] tw-font-semibold">Email</span>
            <span className="tw-text-[14px] tw-text-left tw-text-[#6b6b6d]">
              Replace your user email. Note that this will require verification
              from your old and new email address.
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
                icon="email"
                placeholder="you@chatterloop.app"
                value={authentication.user.email}
                // onChange={(e) => setemail(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Credentials;
