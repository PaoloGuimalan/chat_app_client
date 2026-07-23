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
  EntitySearchRequest,
} from "@/reusables/hooks/requests";
import { EntitySearchResult } from "@/reusables/vars/interfaces";
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
  const [results, setResults] = useState<EntitySearchResult[]>([]);

  const normalizedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!normalizedQuery) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      // Entity search (v2): returns users AND pages in one normalized shape.
      // realmTypes "page" keeps Explore to profile-like pages - widen here if
      // groups/servers should become discoverable too.
      EntitySearchRequest(
        { searchdata: normalizedQuery, types: "user,realm", realmTypes: "page" },
        dispatch,
        setIsLoading,
        alerts,
        setResults,
      );
    }, 450);

    return () => clearTimeout(timeout);
  }, [normalizedQuery]);

  // All three send entity_id - the canonical key the contacts endpoints key
  // on, so the backend never translates an account id into an entity.
  const acceptContactRequestProcess = (
    connection_id: string,
    entity_id: string,
  ) => {
    setIsDisabledByRequest(true);
    AcceptContactRequest(
      { connection_id, entity_id },
      dispatch,
      alerts,
      setIsDisabledByRequest,
    );
  };

  const contactRequestProcess = (entity_id: string) => {
    setIsDisabledByRequest(true);
    ContactRequest({ entity_id }, dispatch, alerts, setIsDisabledByRequest);
  };

  const declineRequestProcess = (
    connection_id: string,
    entity_id: string,
    action: string,
  ) => {
    setIsDisabledByRequest(true);
    DeclineContactRequest(
      { connection_id, entity_id, action },
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
              Search people and pages
            </h1>
            <p
              style={{
                margin: 0,
                color: "var(--text-2)",
                fontSize: 14,
              }}
            >
              Find people and pages, start connections, and open profiles from
              one place.
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
                placeholder="Search people and pages by name or handle"
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
                  Search people and pages
                </span>
                <span style={{ fontSize: 14, color: "var(--text-2)" }}>
                  Start typing a name or handle to find people and pages.
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
                const isRealm = result.type === "realm";
                // v2 gives one display_name for both kinds, so Explore no
                // longer composes first/middle/last itself.
                const fullName = result.display_name;
                // Contact actions are keyed on the ENTITY id for both kinds,
                // so the backend never has to translate an account id.
                const targetEntityID = result.entity_id;
                const connectionId = result.connection_id ?? targetEntityID;
                // Must be one of Badge's supported tones - Badge destructures
                // its tone map, so an unknown value throws rather than
                // falling back. Left untyped-cast-free on purpose so tsc
                // catches any future typo here.
                const statusTone = isRealm
                  ? "brand"
                  : result.has_connection
                    ? result.connection_accomplished
                      ? "green"
                      : "gold"
                    : "grey";

                return (
                  <Card
                    key={result.entity_id}
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
                        onClick={() => navigate(`/${result.handle}`)}
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: 0,
                          margin: 0,
                          cursor: "pointer",
                        }}
                      >
                        <Avatar
                          id={result.entity_id}
                          name={fullName}
                          // v2 normalizes both "none" and "N/A" to null.
                          src={result.profile ?? undefined}
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
                            onClick={() => navigate(`/${result.handle}`)}
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
                          {result.is_verified && (
                            <Icon n="verified" s={16} c="var(--brand)" />
                          )}
                          <Badge tone={statusTone}>
                            {isRealm
                              ? "Page"
                              : result.has_connection
                                ? result.connection_accomplished
                                  ? "Connected"
                                  : result.is_action_by_entity
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
                          @{result.handle}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        {isRealm ? (
                          // Pages are not connection targets - open the page
                          // and follow from there.
                          <Btn
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/${result.handle}`)}
                          >
                            View page
                          </Btn>
                        ) : result.has_connection ? (
                          // Order matters: settled first, then WHO asked.
                          // is_action_by_entity true = I sent the request, so
                          // I withdraw it; false = they sent it, so I answer
                          // it. These were previously inverted, which showed
                          // Accept/Decline to the requester.
                          result.connection_accomplished ? (
                            <Btn
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/${result.handle}`)}
                            >
                              Profile
                            </Btn>
                          ) : result.is_action_by_entity ? (
                            <Btn
                              variant="outline"
                              size="sm"
                              title="Cancel request"
                              disabled={isDisabledByRequest}
                              onClick={() =>
                                declineRequestProcess(
                                  connectionId,
                                  targetEntityID,
                                  "remove",
                                )
                              }
                            >
                              <BiUserMinus />
                            </Btn>
                          ) : (
                            <>
                              <Btn
                                variant="outline"
                                size="sm"
                                title="Accept request"
                                disabled={isDisabledByRequest}
                                onClick={() =>
                                  acceptContactRequestProcess(
                                    connectionId,
                                    targetEntityID,
                                  )
                                }
                              >
                                <BiUserCheck />
                              </Btn>
                              <Btn
                                variant="outline"
                                size="sm"
                                title="Decline request"
                                disabled={isDisabledByRequest}
                                onClick={() =>
                                  declineRequestProcess(
                                    connectionId,
                                    targetEntityID,
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
                            onClick={() => contactRequestProcess(targetEntityID)}
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
                  No results found
                </span>
                <span style={{ fontSize: 14, color: "var(--text-2)" }}>
                  Try a different name or handle.
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
