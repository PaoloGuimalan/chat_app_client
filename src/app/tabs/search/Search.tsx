/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { BiUserCheck, BiUserMinus, BiUserX } from "react-icons/bi";
import {
  AcceptContactRequest,
  ContactRequest,
  DeclineContactRequest,
  SearchRequest,
} from "@/reusables/hooks/requests";
import { UserSearchResult } from "@/reusables/vars/interfaces";
import { Avatar, Badge, Btn, Card, Icon, useTheme } from "@/reusables/design";
import Skeleton from "react-loading-skeleton";

function SearchPage() {
  const alerts = useSelector((state: any) => state.alerts);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDisabledByRequest, setIsDisabledByRequest] = useState(false);
  const [results, setResults] = useState<UserSearchResult[]>([]);

  const normalizedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!normalizedQuery) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      SearchRequest(
        { searchdata: normalizedQuery },
        dispatch,
        setIsLoading,
        alerts,
        setResults,
      );
    }, 450);

    return () => clearTimeout(timeout);
  }, [normalizedQuery]);

  const acceptContactRequestProcess = (
    connection_id: string,
    to_user_id: string,
  ) => {
    setIsDisabledByRequest(true);
    AcceptContactRequest(
      { connection_id, to_user_id },
      dispatch,
      alerts,
      setIsDisabledByRequest,
    );
  };

  const contactRequestProcess = (addUserID: string) => {
    setIsDisabledByRequest(true);
    ContactRequest(
      { addUsername: addUserID },
      dispatch,
      alerts,
      setIsDisabledByRequest,
    );
  };

  const declineRequestProcess = (
    connection_id: string,
    to_user_id: string,
    action: string,
  ) => {
    setIsDisabledByRequest(true);
    DeclineContactRequest(
      { connection_id, to_user_id, action },
      dispatch,
      alerts,
      setIsDisabledByRequest,
    );
  };

  return (
    <div
      className="cl-redesign"
      data-theme={theme}
      style={{
        width: "100%",
        height: "100%",
        minHeight: 0,
        overflow: "auto",
        background: "var(--background)",
      }}
    >
      <div
        style={{
          width: "100%",
          minHeight: "100%",
          display: "flex",
          justifyContent: "center",
          padding: "22px 18px 28px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 1080,
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div
            style={{
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <span
              style={{
                alignSelf: "center",
                display: "inline-flex",
                alignItems: "center",
                height: 24,
                padding: "0 10px",
                borderRadius: 999,
                background: "var(--brand-soft)",
                color: "var(--brand)",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: ".04em",
                textTransform: "uppercase",
                width: "fit-content",
              }}
            >
              Explore
            </span>
            <h1
              style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "var(--text)",
              }}
            >
              Search people
            </h1>
            <p
              style={{
                margin: 0,
                color: "var(--text-2)",
                fontSize: 14,
              }}
            >
              Find users, start connections, and open profiles from one place.
            </p>
          </div>

          <Card
            pad={14}
            style={{ width: "100%", border: "none", boxShadow: "none" }}
          >
            <div
              id="div_input_container"
              style={{ width: "100%", maxHeight: 52 }}
              className="tw-border-none tw-bg-transparent tw-outline-none tw-select-none cl-explore-search-shell"
            >
              <Icon n="search" s={20} c="var(--text-3)" />
              <input
                id="input_search_box"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search users by name or username"
                autoComplete="off"
                className="tw-border-none tw-outline-none"
              />
            </div>
          </Card>

          {!normalizedQuery ? (
            <Card
              pad={22}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 260,
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    background: "var(--brand-soft)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto",
                  }}
                >
                  <Icon n="manage_search" s={34} c="var(--brand)" />
                </div>
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: "var(--text)",
                  }}
                >
                  Search users only
                </span>
                <span style={{ fontSize: 14, color: "var(--text-2)" }}>
                  Start typing a name or username to find people.
                </span>
              </div>
            </Card>
          ) : isLoading ? (
            <Card pad={18} style={{ width: "100%" }}>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto minmax(0, 1fr) auto",
                      gap: 14,
                      alignItems: "center",
                      width: "100%",
                      padding: 14,
                      borderRadius: "var(--r-md)",
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <Skeleton
                      circle
                      height={52}
                      width={52}
                      baseColor="var(--surface-3)"
                      highlightColor="var(--surface-hover)"
                    />
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <Skeleton
                        width="65%"
                        height={18}
                        baseColor="var(--surface-3)"
                        highlightColor="var(--surface-hover)"
                      />
                      <Skeleton
                        width="45%"
                        height={14}
                        baseColor="var(--surface-3)"
                        highlightColor="var(--surface-hover)"
                      />
                    </div>
                    <Skeleton
                      width={84}
                      height={34}
                      baseColor="var(--surface-3)"
                      highlightColor="var(--surface-hover)"
                      style={{ borderRadius: "var(--r-sm)" }}
                    />
                  </div>
                ))}
              </div>
            </Card>
          ) : results.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {results.map((result) => {
                const fullName =
                  `${result.first_name} ${result.middle_name === "N/A" ? "" : `${result.middle_name} `}${result.last_name}`.trim();
                const connectionId = result.connection_id ?? result.id;
                const statusTone = result.has_connection
                  ? result.connection_accomplished
                    ? "green"
                    : "gold"
                  : "grey";

                return (
                  <Card
                    key={result.id}
                    pad={14}
                    hover
                    style={{ width: "100%" }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "auto minmax(0, 1fr) auto",
                        gap: 14,
                        alignItems: "center",
                        width: "100%",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => navigate(`/${result.username}`)}
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: 0,
                          margin: 0,
                          cursor: "pointer",
                        }}
                      >
                        <Avatar
                          id={result.id}
                          name={fullName}
                          src={
                            result.profile === "none"
                              ? undefined
                              : result.profile
                          }
                          size={52}
                          style={{
                            boxShadow: "0 0 0 1px var(--border)",
                            borderRadius: "100%",
                          }}
                        />
                      </button>

                      <div
                        style={{
                          minWidth: 0,
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                          alignItems: "flex-start",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-start",
                            gap: 8,
                            minWidth: 0,
                            width: "100%",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => navigate(`/${result.username}`)}
                            style={{
                              background: "transparent",
                              border: "none",
                              padding: 0,
                              margin: 0,
                              cursor: "pointer",
                              minWidth: 0,
                              textAlign: "left",
                              color: "inherit",
                            }}
                          >
                            <span
                              style={{
                                display: "block",
                                fontSize: 15,
                                fontWeight: 800,
                                color: "var(--text)",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: "100%",
                              }}
                            >
                              {fullName}
                            </span>
                          </button>
                          <Badge tone={statusTone as any}>
                            {result.has_connection
                              ? result.connection_accomplished
                                ? "Connected"
                                : result.is_action_by_user
                                  ? "Request sent"
                                  : "Request received"
                              : "New"}
                          </Badge>
                        </div>
                        <span
                          style={{
                            fontSize: 13,
                            color: "var(--text-2)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            width: "100%",
                            textAlign: "left",
                          }}
                        >
                          @{result.username}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        {result.has_connection ? (
                          !result.is_action_by_user ? (
                            result.connection_accomplished ? (
                              <Btn
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/${result.username}`)}
                              >
                                Profile
                              </Btn>
                            ) : (
                              <Btn
                                variant="outline"
                                size="sm"
                                disabled={isDisabledByRequest}
                                onClick={() =>
                                  declineRequestProcess(
                                    connectionId,
                                    result.id,
                                    "remove",
                                  )
                                }
                              >
                                <BiUserMinus />
                              </Btn>
                            )
                          ) : result.connection_accomplished ? (
                            <Btn
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/${result.username}`)}
                            >
                              Profile
                            </Btn>
                          ) : (
                            <>
                              <Btn
                                variant="outline"
                                size="sm"
                                disabled={isDisabledByRequest}
                                onClick={() =>
                                  acceptContactRequestProcess(
                                    connectionId,
                                    result.id,
                                  )
                                }
                              >
                                <BiUserCheck />
                              </Btn>
                              <Btn
                                variant="outline"
                                size="sm"
                                disabled={isDisabledByRequest}
                                onClick={() =>
                                  declineRequestProcess(
                                    connectionId,
                                    result.id,
                                    "decline",
                                  )
                                }
                              >
                                <BiUserX />
                              </Btn>
                            </>
                          )
                        ) : (
                          <Btn
                            variant="soft"
                            size="sm"
                            disabled={isDisabledByRequest}
                            onClick={() => contactRequestProcess(result.id)}
                            iconL="person_add"
                          >
                            Add
                          </Btn>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card
              pad={22}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 260,
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto",
                  }}
                >
                  <Icon n="search_off" s={34} c="var(--text-2)" />
                </div>
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: "var(--text)",
                  }}
                >
                  No users found
                </span>
                <span style={{ fontSize: 14, color: "var(--text-2)" }}>
                  Try a different name or username.
                </span>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchPage;
