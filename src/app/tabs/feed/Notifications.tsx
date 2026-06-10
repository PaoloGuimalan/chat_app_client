/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import {
  AcceptContactRequest,
  DeclineContactRequest,
  NotificationInitRequest,
  ReadNotificationsRequest,
} from "../../../reusables/hooks/requests";
import DefaultProfile from "../../../assets/imgs/default.png";
import NotificationItemLoader from "@/app/reusables/loaders/NotificationItemLoader";
import { timeSince } from "@/reusables/hooks/reusable";
import { Avatar, Btn, Card, Icon, useTheme } from "@/reusables/design";

function Notifications() {
  const [isLoading, setisLoading] = useState(true);
  const [page, setpage] = useState(1);
  const [range] = useState(10);
  const [isDisabledByRequest, setisDisabledByRequest] = useState(false);

  const notificationslist = useSelector(
    (state: any) => state.notificationslist,
  );
  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );
  const pathnamelistener = useSelector((state: any) => state.pathnamelistener);
  const alerts = useSelector((state: any) => state.alerts);
  const dispatch = useDispatch();
  const { theme } = useTheme();

  useEffect(() => {
    NotificationInitRequest(page, range, dispatch, setisLoading);
  }, [page, range]);

  useEffect(() => {
    if (!isLoading) ReadNotificationsRequest();
  }, [isLoading]);

  const declineRequestProcess = (
    connection_id: any,
    to_user_id: string,
    action: string,
  ) => {
    setisDisabledByRequest(true);
    DeclineContactRequest(
      { connection_id, to_user_id, action },
      dispatch,
      alerts,
      setisDisabledByRequest,
    );
  };

  const acceptRequestProcess = (connection_id: string, to_user_id: string) => {
    setisDisabledByRequest(true);
    AcceptContactRequest(
      { connection_id, to_user_id },
      dispatch,
      alerts,
      setisDisabledByRequest,
    );
  };

  const divlazyloaderRef = useRef<HTMLDivElement | null>(null);
  const divcontentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let currentView = false;
    if (divcontentRef.current) {
      divcontentRef.current.onscroll = () => {
        if (divlazyloaderRef.current) {
          const top = divlazyloaderRef.current.getBoundingClientRect().top;
          const isVisible = top >= 0 && top <= window.innerHeight;
          if (currentView != isVisible) {
            currentView = isVisible;
            if (currentView) setpage((prev) => prev + 1);
          }
        }
      };
    }
  }, [isLoading]);

  const isStandalone = pathnamelistener.includes("notifications");
  const isMobile = screensizelistener.W <= 900;
  if (!isStandalone && isMobile) {
    return null;
  }

  return (
    <div
      className="cl-redesign"
      data-theme={theme}
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        width: "100%",
        maxWidth: isStandalone ? 640 : "100%",
        margin: isStandalone ? "0 auto" : undefined,
        padding: isStandalone ? "16px 22px" : "16px 12px",
        gap: 12,
        background: "transparent",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: isStandalone ? 0 : "0 4px",
        }}
      >
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: "var(--r-sm)",
            background: "var(--gold-soft)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon n="notifications" s={18} c="var(--gold)" />
        </span>
        <h2
          style={{
            margin: 0,
            fontSize: isStandalone ? 22 : 17,
            fontWeight: 800,
            letterSpacing: "-0.02em",
          }}
        >
          {isStandalone ? "Activity" : "Notifications"}
        </h2>
      </div>

      {isLoading ? (
        <div
          ref={divcontentRef}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {Array.from({ length: 10 }, (_, i) => (
            <NotificationItemLoader key={i} />
          ))}
        </div>
      ) : notificationslist.list.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            color: "var(--text-3)",
          }}
        >
          <Icon n="notifications_none" s={42} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>
            No notifications
          </span>
        </div>
      ) : (
        <div
          ref={divcontentRef}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            paddingRight: 4,
          }}
        >
          {notificationslist.list.map((ntfs: any, i: number) => {
            const profileSrc =
              ntfs.fromUser.profile === "none"
                ? DefaultProfile
                : ntfs.fromUser.profile;
            const isContactRequest = ntfs.type === "contact_request";
            const showActions = isContactRequest && !ntfs.referenceStatus;
            return (
              <Card
                key={i}
                pad={12}
                hover
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  borderColor: "var(--border)",
                }}
              >
                <Avatar
                  id={ntfs.fromUserID || ntfs.fromUser?.userID || ntfs.fromUser?.name}
                  name={ntfs.content?.headline || ntfs.fromUser?.fullName?.firstName}
                  src={profileSrc}
                  size={44}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: "var(--text)",
                    }}
                  >
                    {ntfs.content.headline}
                  </div>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: "var(--text-2)",
                      marginTop: 2,
                    }}
                  >
                    {ntfs.content.details}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "var(--text-3)",
                      marginTop: 4,
                      display: "flex",
                      gap: 6,
                    }}
                  >
                    {ntfs.date.time ? (
                      <>
                        <span>{ntfs.date.date}</span>
                        <span>·</span>
                        <span>{ntfs.date.time}</span>
                      </>
                    ) : (
                      <span>{timeSince(ntfs.date.date)}</span>
                    )}
                  </div>
                  {showActions && (
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        marginTop: 10,
                      }}
                    >
                      <Btn
                        size="sm"
                        disabled={isDisabledByRequest}
                        onClick={() =>
                          acceptRequestProcess(ntfs.referenceID, ntfs.fromUserID)
                        }
                      >
                        Confirm
                      </Btn>
                      <Btn
                        size="sm"
                        variant="outline"
                        disabled={isDisabledByRequest}
                        onClick={() =>
                          declineRequestProcess(
                            ntfs.referenceID,
                            ntfs.fromUserID,
                            "decline",
                          )
                        }
                      >
                        Decline
                      </Btn>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
          {notificationslist.next && (
            <div
              ref={divlazyloaderRef}
              style={{
                display: "flex",
                justifyContent: "center",
                padding: 16,
                color: "var(--text-3)",
              }}
            >
              <AiOutlineLoading3Quarters
                className="cl-spin"
                style={{ fontSize: 22 }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Notifications;
