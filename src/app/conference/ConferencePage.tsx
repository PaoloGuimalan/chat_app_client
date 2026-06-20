/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CredentialResponse,
  GoogleLogin,
  GoogleOAuthProvider,
} from "@react-oauth/google";
import { useNavigate, useParams } from "react-router-dom";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FiCalendar, FiVideo, FiArrowRight, FiVideoOff } from "react-icons/fi";
import { IoMdMail } from "react-icons/io";
import { BsKeyFill } from "react-icons/bs";
import ChatterLoopImg from "../../assets/imgs/chatterloop.png";
import ChatterLoopDarkImg from "../../assets/imgs/chatterloop-dark.png";
import { Icon } from "@/reusables/design";
import envs from "@/reusables/hooks/env_configs";
import {
  CreateConferenceRequest,
  LoginRequest,
  LogoutRequest,
  ThirdPartyAuthenticationRequest,
} from "@/reusables/hooks/requests";
import { useTheme } from "@/reusables/design/ThemeProvider";
import { SET_ALERTS } from "@/redux/types";
import { AuthenticationInterface } from "@/reusables/vars/interfaces";
import ConferenceRoom from "./ConferenceRoom";

function ConferencePage() {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );
  const alerts = useSelector((state: any) => state.alerts);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const params = useParams();
  const { theme, toggleTheme } = useTheme();
  const conferenceLogo = theme === "dark" ? ChatterLoopDarkImg : ChatterLoopImg;

  const roomSlug = params.slug?.trim() ?? "";
  const [emailUsername, setEmailUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isWaitingRequest, setIsWaitingRequest] = useState(false);
  const [joinSlug, setJoinSlug] = useState(roomSlug);
  const [meetingName, setMeetingName] = useState("Instant meeting");
  const [meetingMode, setMeetingMode] = useState<"instant" | "scheduled">(
    "instant",
  );
  const [scheduledFor, setScheduledFor] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    setJoinSlug(roomSlug);
  }, [roomSlug]);

  useEffect(() => {
    setMeetingName((prev) => {
      const instantTitle = "Instant meeting";
      const scheduledTitle = "Scheduled meeting";

      if (
        prev.trim() === "" ||
        prev === instantTitle ||
        prev === scheduledTitle
      ) {
        return meetingMode === "instant" ? instantTitle : scheduledTitle;
      }

      return prev;
    });
  }, [meetingMode]);

  const isLoggedIn = authentication.auth === true;
  const isAuthResolving = authentication.auth === null;

  const login = () => {
    if (!emailUsername.trim() || !password.trim()) {
      dispatch({
        type: SET_ALERTS,
        payload: {
          alerts: {
            id: alerts.length,
            type: "warning",
            content: "Please complete the field.",
          },
        },
      });
      return;
    }

    LoginRequest(
      { email_username: emailUsername, password },
      dispatch,
      alerts,
      setIsWaitingRequest,
    );
  };

  const loginWithGoogle = (credential: CredentialResponse) => {
    if (!credential.credential) return;

    ThirdPartyAuthenticationRequest(
      { token: credential.credential },
      dispatch,
      alerts,
      setIsWaitingRequest,
    );
  };

  const createMeeting = async () => {
    if (!isLoggedIn) {
      dispatch({
        type: SET_ALERTS,
        payload: {
          alerts: {
            id: alerts.length,
            type: "warning",
            content: "Please sign in first.",
          },
        },
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await CreateConferenceRequest({
        groupName: meetingName.trim() || "Instant meeting",
        privacy: false,
        otherUsers: [],
        meetingMode,
        starts_at: meetingMode === "scheduled" ? scheduledFor || null : null,
        expires_at: null,
      });

      const slug = response?.result?.slug;
      if (slug) {
        navigate(`/conference/${slug}`);
      }
    } catch (err: any) {
      dispatch({
        type: SET_ALERTS,
        payload: {
          alerts: {
            id: alerts.length,
            type: "error",
            content: err?.message || "Unable to create conference.",
          },
        },
      });
    } finally {
      setIsCreating(false);
    }
  };

  const joinMeeting = () => {
    if (!isLoggedIn) {
      dispatch({
        type: SET_ALERTS,
        payload: {
          alerts: {
            id: alerts.length,
            type: "warning",
            content: "Please sign in first.",
          },
        },
      });
      return;
    }

    if (!joinSlug.trim()) {
      dispatch({
        type: SET_ALERTS,
        payload: {
          alerts: {
            id: alerts.length,
            type: "warning",
            content: "Please enter a meeting slug.",
          },
        },
      });
      return;
    }

    navigate(`/conference/${joinSlug.trim()}`);
  };

  const logout = () => {
    LogoutRequest(dispatch);
  };

  const showConferenceRoom = useMemo(
    () => isLoggedIn && roomSlug.length > 0,
    [isLoggedIn, roomSlug],
  );

  return (
    <GoogleOAuthProvider clientId={envs.GOOGLE_CLIENT_ID}>
      <div
        className="cl-redesign tw-min-h-screen tw-bg-[var(--bg)] tw-text-[var(--text)]"
        data-theme={theme}
      >
        {showConferenceRoom ? (
          <ConferenceRoom />
        ) : (
          <div className="tw-min-h-screen tw-w-full tw-flex tw-flex-col tw-items-center tw-px-[16px] tw-py-[18px] sm:tw-px-[24px] sm:tw-py-[22px]">
            <div className="tw-w-full tw-max-w-[1240px] tw-flex tw-items-center tw-justify-between tw-gap-[12px] tw-mb-[18px]">
              <div className="tw-flex tw-items-center tw-gap-[12px] tw-min-w-0">
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="tw-border-none tw-bg-transparent tw-p-0 tw-cursor-pointer tw-shrink-0"
                  aria-label="Go to home"
                >
                  <img
                    src={conferenceLogo}
                    alt="Chatterloop"
                    className="tw-w-[42px] tw-h-[42px] tw-rounded-[14px] tw-object-cover tw-shadow-[var(--shadow-sm)]"
                  />
                </button>
                <div className="tw-flex tw-flex-col tw-items-start tw-min-w-0">
                  <span className="tw-text-[18px] sm:tw-text-[20px] tw-font-semibold tw-tracking-[-0.02em]">
                    Conference
                  </span>
                  <span className="tw-text-[12px] sm:tw-text-[13px] tw-text-[var(--text-2)] tw-truncate">
                    Create or join meetings from one place.
                  </span>
                </div>
              </div>

              <div className="tw-flex tw-items-center tw-gap-[10px] tw-shrink-0">
                {isLoggedIn && (
                  <button
                    type="button"
                    onClick={logout}
                    className="tw-h-[42px] tw-px-[14px] tw-rounded-[var(--r-md)] tw-border tw-border-[var(--border)] tw-bg-[var(--surface)] tw-text-[var(--text)] tw-cursor-pointer tw-text-[13px] tw-font-semibold"
                  >
                    Logout
                  </button>
                )}
                <button
                  type="button"
                  onClick={toggleTheme}
                  title="Toggle theme"
                  aria-label="Toggle theme"
                  className="tw-w-[42px] tw-h-[42px] tw-rounded-[var(--r-md)] tw-border tw-border-[var(--border)] tw-bg-[var(--surface)] tw-text-[var(--text-2)] tw-cursor-pointer tw-flex tw-items-center tw-justify-center tw-shrink-0"
                >
                  <Icon
                    n={theme === "dark" ? "light_mode" : "dark_mode"}
                    s={20}
                  />
                </button>
              </div>
            </div>

            <div className="tw-w-full tw-max-w-[1240px] tw-grid tw-grid-cols-1 xl:tw-grid-cols-[1fr_1fr] tw-gap-[16px]">
              <div className="tw-flex tw-flex-col tw-gap-[16px]">
                <div className="tw-rounded-[24px] tw-bg-[var(--surface)] tw-border tw-border-[var(--border)] tw-shadow-[var(--shadow-sm)] tw-p-[18px] sm:tw-p-[22px]">
                  <div className="tw-flex tw-items-center tw-justify-between tw-gap-[12px] tw-mb-[18px]">
                    <div className="tw-flex tw-flex-col tw-items-start tw-gap-[4px]">
                      {isAuthResolving ? (
                        <>
                          <span className="tw-text-[18px] tw-font-semibold tw-flex tw-items-center tw-gap-[8px]">
                            <AiOutlineLoading3Quarters className="tw-animate-spin" />
                            Checking session
                          </span>
                          <span className="tw-text-[13px] tw-text-[var(--text-2)]">
                            Please wait while we confirm your login state.
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="tw-text-[18px] tw-font-semibold">
                            {isLoggedIn ? "You're signed in" : "Sign in first"}
                          </span>
                          <span className="tw-text-[13px] tw-text-[var(--text-2)]">
                            {isLoggedIn
                              ? "Create and manage your conference rooms."
                              : "Use your Chatterloop account or Google to continue."}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="tw-hidden sm:tw-flex tw-items-center tw-justify-center tw-w-[44px] tw-h-[44px] tw-rounded-[var(--r-md)] tw-bg-[var(--brand-soft)] tw-text-[var(--brand)]">
                      {isAuthResolving ? (
                        <AiOutlineLoading3Quarters className="tw-animate-spin" />
                      ) : (
                        <FiVideo size={20} />
                      )}
                    </div>
                  </div>

                  {isAuthResolving ? (
                    <div className="tw-w-full tw-min-h-[252px] tw-rounded-[24px] tw-border tw-border-[var(--border)] tw-bg-[var(--surface-2)] tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-[10px]">
                      <AiOutlineLoading3Quarters className="tw-animate-spin tw-text-[20px] tw-text-[var(--brand)]" />
                      <span className="tw-text-[13px] tw-text-[var(--text-2)]">
                        Loading your conference access...
                      </span>
                    </div>
                  ) : !isLoggedIn ? (
                    <div className="tw-flex tw-flex-col tw-gap-[12px]">
                      <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-[12px]">
                        <div className="tw-flex tw-flex-col tw-gap-[10px]">
                          <label className="tw-text-[12px] tw-font-semibold tw-text-[var(--text-2)]">
                            Email or Username
                          </label>
                          <div className="tw-flex tw-items-center tw-gap-[10px] tw-h-[42px] tw-rounded-[var(--r-md)] tw-border tw-border-[var(--border)] tw-bg-[var(--input)] tw-px-[12px]">
                            <IoMdMail size={16} color="var(--text-3)" />
                            <input
                              value={emailUsername}
                              onChange={(e) => setEmailUsername(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !isWaitingRequest) {
                                  login();
                                }
                              }}
                              placeholder="you@chatterloop.app"
                              className="tw-flex-1 tw-bg-transparent tw-outline-none tw-border-none tw-text-[13px] tw-text-[var(--text)]"
                            />
                          </div>
                        </div>
                        <div className="tw-flex tw-flex-col tw-gap-[10px]">
                          <label className="tw-text-[12px] tw-font-semibold tw-text-[var(--text-2)]">
                            Password
                          </label>
                          <div className="tw-flex tw-items-center tw-gap-[10px] tw-h-[42px] tw-rounded-[var(--r-md)] tw-border tw-border-[var(--border)] tw-bg-[var(--input)] tw-px-[12px]">
                            <BsKeyFill size={15} color="var(--text-3)" />
                            <input
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !isWaitingRequest) {
                                  login();
                                }
                              }}
                              placeholder="••••••••"
                              className="tw-flex-1 tw-bg-transparent tw-outline-none tw-border-none tw-text-[13px] tw-text-[var(--text)]"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={login}
                        disabled={isWaitingRequest}
                        className="tw-h-[44px] tw-rounded-[var(--r-md)] tw-border-none tw-bg-[var(--brand)] tw-text-white tw-font-semibold tw-cursor-pointer disabled:tw-opacity-[0.7] tw-flex tw-items-center tw-justify-center tw-gap-[10px]"
                      >
                        {isWaitingRequest ? (
                          <AiOutlineLoading3Quarters className="tw-animate-spin" />
                        ) : (
                          "Sign in"
                        )}
                      </button>

                      <div className="tw-flex tw-items-center tw-gap-[10px]">
                        <div className="tw-h-[1px] tw-flex-1 tw-bg-[var(--border)]" />
                        <span className="tw-text-[11px] tw-text-[var(--text-2)]">
                          or continue with Google
                        </span>
                        <div className="tw-h-[1px] tw-flex-1 tw-bg-[var(--border)]" />
                      </div>

                      <GoogleLogin
                        width="100%"
                        onSuccess={loginWithGoogle}
                        onError={() => {
                          dispatch({
                            type: SET_ALERTS,
                            payload: {
                              alerts: {
                                id: alerts.length,
                                type: "error",
                                content: "Google sign-in failed.",
                              },
                            },
                          });
                        }}
                      />
                    </div>
                  ) : (
                    <div className="tw-flex tw-items-center tw-justify-between tw-gap-[12px] tw-rounded-[var(--r-md)] tw-bg-[var(--surface-2)] tw-border tw-border-[var(--border)] tw-p-[14px]">
                      <div className="tw-flex tw-flex-col tw-items-start">
                        <span className="tw-text-[14px] tw-font-semibold">
                          {authentication.user.fullName.firstName}{" "}
                          {authentication.user.fullName.lastName}
                        </span>
                        <span className="tw-text-[12px] tw-text-[var(--text-2)]">
                          Ready to create or join a meeting.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/${authentication.user.username}`)
                        }
                        className="tw-h-[40px] tw-px-[14px] tw-rounded-[var(--r-md)] tw-border tw-border-[var(--border)] tw-bg-[var(--surface)] tw-text-[var(--text)] tw-font-semibold tw-cursor-pointer"
                      >
                        View profile
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="tw-flex tw-flex-col tw-gap-[16px]">
                <div className="tw-rounded-[24px] tw-bg-[var(--surface)] tw-border tw-border-[var(--border)] tw-shadow-[var(--shadow-sm)] tw-p-[18px] sm:tw-p-[22px]">
                  <div className="tw-flex tw-flex-col tw-items-start tw-gap-[6px] tw-mb-[16px]">
                    <span className="tw-text-[18px] tw-font-semibold">
                      Create meeting
                    </span>
                    <span className="tw-text-[13px] tw-text-[var(--text-2)]">
                      Start an instant room or schedule one for later.
                    </span>
                  </div>

                  <div className="tw-flex tw-flex-col tw-gap-[14px]">
                    <div className="tw-grid tw-grid-cols-2 tw-gap-[10px]">
                      <button
                        type="button"
                        onClick={() => setMeetingMode("instant")}
                        className={`tw-h-[42px] tw-rounded-[var(--r-md)] tw-border tw-font-semibold tw-cursor-pointer tw-transition-colors ${
                          meetingMode === "instant"
                            ? "tw-bg-[var(--brand-soft)] tw-border-[var(--brand)] tw-text-[var(--brand)]"
                            : "tw-bg-[var(--surface-2)] tw-border-[var(--border)] tw-text-[var(--text)]"
                        }`}
                      >
                        Instant
                      </button>
                      <button
                        type="button"
                        onClick={() => setMeetingMode("scheduled")}
                        className={`tw-h-[42px] tw-rounded-[var(--r-md)] tw-border tw-font-semibold tw-cursor-pointer tw-transition-colors ${
                          meetingMode === "scheduled"
                            ? "tw-bg-[var(--brand-soft)] tw-border-[var(--brand)] tw-text-[var(--brand)]"
                            : "tw-bg-[var(--surface-2)] tw-border-[var(--border)] tw-text-[var(--text)]"
                        }`}
                      >
                        Schedule
                      </button>
                    </div>

                    <div className="tw-flex tw-flex-col tw-gap-[10px]">
                      <label className="tw-text-[12px] tw-font-semibold tw-text-[var(--text-2)]">
                        Meeting title
                      </label>
                      <div className="tw-flex tw-items-center tw-gap-[10px] tw-h-[42px] tw-rounded-[var(--r-md)] tw-border tw-border-[var(--border)] tw-bg-[var(--input)] tw-px-[12px]">
                        <FiVideo size={16} color="var(--text-3)" />
                        <input
                          value={meetingName}
                          onChange={(e) => setMeetingName(e.target.value)}
                          placeholder="Instant meeting"
                          className="tw-flex-1 tw-bg-transparent tw-outline-none tw-border-none tw-text-[13px] tw-text-[var(--text)]"
                        />
                      </div>
                    </div>

                    {meetingMode === "scheduled" && (
                      <div className="tw-flex tw-flex-col tw-gap-[10px]">
                        <label className="tw-text-[12px] tw-font-semibold tw-text-[var(--text-2)]">
                          Starts at
                        </label>
                        <div className="tw-flex tw-items-center tw-gap-[10px] tw-h-[42px] tw-rounded-[var(--r-md)] tw-border tw-border-[var(--border)] tw-bg-[var(--input)] tw-px-[12px]">
                          <FiCalendar size={16} color="var(--text-3)" />
                          <input
                            type="datetime-local"
                            value={scheduledFor}
                            onChange={(e) => setScheduledFor(e.target.value)}
                            className="tw-flex-1 tw-bg-transparent tw-outline-none tw-border-none tw-text-[13px] tw-text-[var(--text)]"
                          />
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={createMeeting}
                      disabled={isCreating || !isLoggedIn}
                      className="tw-h-[44px] tw-rounded-[var(--r-md)] tw-border-none tw-bg-[var(--brand)] tw-text-white tw-font-semibold tw-cursor-pointer disabled:tw-opacity-[0.6] tw-flex tw-items-center tw-justify-center tw-gap-[10px]"
                    >
                      {isCreating ? (
                        <AiOutlineLoading3Quarters className="tw-animate-spin" />
                      ) : (
                        <>
                          {meetingMode === "scheduled"
                            ? "Schedule meeting"
                            : "Create meeting"}
                          <FiArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="tw-rounded-[24px] tw-bg-[var(--surface)] tw-border tw-border-[var(--border)] tw-shadow-[var(--shadow-sm)] tw-p-[18px] sm:tw-p-[22px]">
                  <div className="tw-flex tw-flex-col tw-items-start tw-gap-[6px] tw-mb-[16px]">
                    <span className="tw-text-[18px] tw-font-semibold">
                      Join meeting
                    </span>
                    <span className="tw-text-[13px] tw-text-[var(--text-2)]">
                      Paste the meeting slug or conference link slug here.
                    </span>
                  </div>

                  <div className="tw-flex tw-flex-col tw-gap-[12px]">
                    <div className="tw-flex tw-items-center tw-gap-[10px] tw-h-[42px] tw-rounded-[var(--r-md)] tw-border tw-border-[var(--border)] tw-bg-[var(--input)] tw-px-[12px]">
                      <FiVideoOff size={16} color="var(--text-3)" />
                      <input
                        value={joinSlug}
                        onChange={(e) => setJoinSlug(e.target.value)}
                        placeholder="conference-slug"
                        className="tw-flex-1 tw-bg-transparent tw-outline-none tw-border-none tw-text-[13px] tw-text-[var(--text)]"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            joinMeeting();
                          }
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={joinMeeting}
                      className="tw-h-[44px] tw-rounded-[var(--r-md)] tw-border tw-border-[var(--border)] tw-bg-[var(--surface-2)] tw-text-[var(--text)] tw-font-semibold tw-cursor-pointer"
                    >
                      Join room
                    </button>

                    {!isLoggedIn && (
                      <span className="tw-text-[12px] tw-text-[var(--text-2)]">
                        Sign in first to create or join a room. After login,
                        this page will keep your selected room slug.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </GoogleOAuthProvider>
  );
}

export default ConferencePage;

