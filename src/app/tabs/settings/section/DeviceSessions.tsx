/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ListDeviceSessionsRequest,
  RevokeDeviceSessionRequest,
} from "@/reusables/hooks/requests";
import { timeSince } from "@/reusables/hooks/reusable";
import { Icon } from "@/reusables/design";

interface IDeviceSession {
  sessionID: string;
  deviceType: string;
  browser: string;
  os: string;
  ip: string;
  status: boolean;
  lastSeen: string;
  is_current_device: boolean;
}

const deviceIcon = (deviceType: string) => {
  if (deviceType === "mobile") return "smartphone";
  if (deviceType === "tablet") return "tablet_mac";
  return "computer";
};

function DeviceSessions() {
  const alerts = useSelector((state: any) => state.alerts);
  const dispatch = useDispatch();

  const [isLoading, setisLoading] = useState<boolean>(true);
  const [sessions, setsessions] = useState<IDeviceSession[]>([]);
  const [revokingId, setrevokingId] = useState<string | null>(null);

  const loadSessions = () => {
    setisLoading(true);
    ListDeviceSessionsRequest()
      .then((data) => {
        setsessions(data);
        setisLoading(false);
      })
      .catch(() => setisLoading(false));
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const revokeProcess = (sessionID: string) => {
    setrevokingId(sessionID);
    RevokeDeviceSessionRequest(sessionID, dispatch, alerts, () => {
      setrevokingId(null);
    }).then((success) => {
      if (success) {
        setsessions((prev) => prev.filter((s) => s.sessionID !== sessionID));
      }
    });
  };

  return (
    <div className="tw-w-full tw-h-full tw-flex tw-gap-[10px] tw-flex-col tw-items-start tw-font-Inter">
      <div className="tw-w-full tw-flex tw-items-start">
        <span className="tw-text-[16px] tw-font-Inter tw-font-semibold">
          Device Sessions
        </span>
      </div>
      <div className="tw-w-full tw-flex tw-flex-col tw-items-start tw-gap-[15px]">
        <span className="tw-text-[14px] tw-text-left tw-text-[#6b6b6d]">
          See where you're logged in and sign out of devices you don't
          recognize.
        </span>
        {isLoading ? (
          <span className="tw-text-[13px] tw-text-[#6b6b6d]">Loading…</span>
        ) : sessions.length === 0 ? (
          <span className="tw-text-[13px] tw-text-[#6b6b6d]">
            No active sessions found.
          </span>
        ) : (
          <div className="tw-w-full tw-flex tw-flex-col tw-gap-[10px]">
            {sessions.map((s) => (
              <div
                key={s.sessionID}
                className="tw-w-full tw-flex tw-items-center tw-gap-[10px] tw-p-[8px] tw-rounded-[var(--r-md)] tw-bg-[var(--surface-2)]"
              >
                <div className="tw-flex tw-items-center tw-justify-center tw-w-[36px] tw-h-[36px] tw-rounded-full tw-bg-[var(--surface)]">
                  <Icon n={deviceIcon(s.deviceType)} s={18} />
                </div>
                <div className="tw-flex tw-flex-col tw-flex-1 tw-min-w-0">
                  <span className="tw-text-[13px] tw-text-left tw-font-semibold">
                    {s.browser} on {s.os}
                    {s.is_current_device && (
                      <span className="tw-text-[11px] tw-font-normal tw-text-[var(--brand)]">
                        {" "}
                        · This device
                      </span>
                    )}
                  </span>
                  <span className="tw-text-[12px] tw-text-left tw-text-[#6b6b6d]">
                    {s.ip} ·{" "}
                    {s.status ? "Active now" : `Last seen ${timeSince(s.lastSeen)}`}
                  </span>
                </div>
                {!s.is_current_device && (
                  <button
                    disabled={revokingId === s.sessionID}
                    onClick={() => revokeProcess(s.sessionID)}
                    className="tw-min-w-[80px] tw-cursor-pointer tw-font-semibold tw-font-Inter tw-border-none tw-px-[12px] tw-py-[8px] tw-bg-[var(--surface)] tw-text-[var(--text)] tw-rounded-[var(--r-md)] tw-text-[12px] hover:tw-bg-[var(--surface-hover)] tw-transition-colors disabled:tw-opacity-[0.65]"
                  >
                    {revokingId === s.sessionID ? "Signing out…" : "Sign out"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DeviceSessions;
