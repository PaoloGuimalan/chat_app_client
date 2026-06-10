/* eslint-disable @typescript-eslint/no-explicit-any */
import { SET_USER_SETTINGS } from "@/redux/types";
import { persistSettings } from "@/reusables/hooks/localforagehelper";
import {
  AuthenticationInterface,
  IUserSettings,
} from "@/reusables/vars/interfaces";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux/es/hooks/useSelector";

function MapFeedSettings() {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );

  const usersettings: IUserSettings = useSelector(
    (state: any) => state.usersettings,
  );

  const dispatch = useDispatch();

  const setSettingsAndPersist = (newSettings: IUserSettings) => {
    dispatch({
      type: SET_USER_SETTINGS,
      payload: { usersettings: newSettings },
    });
    persistSettings(authentication.user.userID, newSettings);
  };

  return (
    <div className="tw-w-full tw-h-full tw-flex tw-gap-[10px] tw-flex-col tw-items-start tw-font-Inter">
      <div className="tw-w-full tw-flex tw-items-start">
        <span className="tw-text-[16px] tw-font-Inter tw-font-semibold">
          Map Feed Access
        </span>
      </div>
      <div className="tw-w-full tw-flex tw-flex-col tw-items-start tw-gap-[15px]">
        <div className="tw-w-full tw-flex tw-flex-col tw-items-start">
          <span className="tw-text-[14px] tw-font-semibold">
            Enable location
          </span>
          <span className="tw-text-[14px] tw-text-left tw-text-[#6b6b6d]">
            Let the app use your location.
          </span>
        </div>
        <div className="tw-w-full tw-flex tw-flex-row tw-items-start">
          <div id="div_toggle_switch_container">
            <label className="switch">
              <input
                type="checkbox"
                id="input_switch_map_settings"
                checked={usersettings.map_feed_access.enable_location}
                onChange={(e) => {
                  setSettingsAndPersist({
                    ...usersettings,
                    map_feed_access: {
                      ...usersettings.map_feed_access,
                      enable_location: e.target.checked,
                    },
                  });
                }}
              />
              <span className="slider round"></span>
            </label>
            <span id="span_toggle_switch_label" className="tw-font-Inter">
              {usersettings.map_feed_access.enable_location
                ? "Enabled"
                : "Disabled"}
            </span>
          </div>
        </div>
      </div>
      {usersettings.map_feed_access.enable_location && (
        <div className="tw-w-full tw-flex tw-flex-col tw-items-start tw-gap-[15px]">
          <div className="tw-w-full tw-flex tw-flex-col tw-items-start">
            <span className="tw-text-[14px] tw-font-semibold">
              Share location
            </span>
            <span className="tw-text-[14px] tw-text-left tw-text-[#6b6b6d]">
              Let your friend know where you are, and let anyone nearby see your
              location.
            </span>
          </div>
          <div className="tw-w-full tw-flex tw-flex-row tw-items-start">
            <div id="div_toggle_switch_container">
              <label className="switch">
                <input
                  type="checkbox"
                  id="input_switch_map_settings"
                  checked={usersettings.map_feed_access.share_location}
                  onChange={(e) => {
                    setSettingsAndPersist({
                      ...usersettings,
                      map_feed_access: {
                        ...usersettings.map_feed_access,
                        share_location: e.target.checked,
                      },
                    });
                  }}
                />
                <span className="slider round"></span>
              </label>
              <span id="span_toggle_switch_label" className="tw-font-Inter">
                {usersettings.map_feed_access.share_location
                  ? "Sharing"
                  : "Disabled"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MapFeedSettings;
