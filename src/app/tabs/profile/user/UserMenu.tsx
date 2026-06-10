/* eslint-disable @typescript-eslint/no-explicit-any */
import AppMenu from "@/app/widgets/desktopwidgets/AppMenu";
import { LogoutRequest } from "@/reusables/hooks/requests";
import { AuthenticationInterface } from "@/reusables/vars/interfaces";
import { BsPersonFill } from "react-icons/bs";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Avatar, Card } from "@/reusables/design";

function UserMenu() {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    LogoutRequest(dispatch);
    navigate("/login");
  };

  return (
    <div className="tw-w-full tw-max-w-[600px] tw-bg-transparent tw-flex-1 tw-flex tw-flex-col tw-items-center tw-p-[10px] tw-pt-[8px] tw-overflow-y-auto scroller tw-gap-[10px]">
      <Card pad={14} style={{ width: "100%" }}>
        <div id="div_app_menu_label_container" className="tw-items-center tw-pt-[0px]">
          <BsPersonFill style={{ fontSize: "22px", color: "#1c7DEF" }} />
          <span className="span_contacts_label">Profile</span>
        </div>
        <div className="tw-w-full tw-flex tw-flex-col tw-items-center">
          <button
            onClick={() => {
              navigate(`/${authentication.user.username}`);
            }}
            className="tw-select-none tw-cursor-pointer tw-w-full tw-bg-transparent tw-border-none tw-text-left tw-p-0"
          >
            <div className="tw-w-full tw-min-h-[72px] tw-flex tw-flex-row tw-items-center tw-gap-[12px] tw-py-[10px] tw-px-[4px]">
              <Avatar
                id={authentication.user.username}
                name={authentication.user.fullName.firstName}
                src={
                  authentication.user.profile !== "none"
                    ? authentication.user.profile
                    : undefined
                }
                size={44}
              />
              <div className="tw-flex tw-flex-col tw-items-start tw-min-w-0 tw-flex-1">
                <span
                  id="span_user_firstname_label"
                  className="tw-w-full"
                  style={{ marginBottom: 2 }}
                >
                  {authentication.user.fullName.firstName}
                  {authentication.user.fullName.middleName == "N/A"
                    ? ""
                    : ` ${authentication.user.fullName.middleName}`}{" "}
                  {authentication.user.fullName.lastName}
                </span>
                <span className="tw-text-[13px] tw-text-[var(--text-2)] tw-break-all tw-w-full">
                  @{authentication.user.username}
                </span>
              </div>
            </div>
          </button>
        </div>
        <div className="tw-w-full tw-flex tw-justify-end tw-pt-[8px]">
          <button
            onClick={handleLogout}
            className="cl-profile-action-button--danger tw-cursor-pointer tw-font-semibold tw-font-Inter tw-p-[8px] tw-pl-[12px] tw-pr-[12px] tw-rounded-[12px] tw-text-[12px]"
          >
            Logout
          </button>
        </div>
      </Card>
      <AppMenu />
    </div>
  );
}

export default UserMenu;
