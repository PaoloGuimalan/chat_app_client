/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import Skeleton from "react-loading-skeleton";
import { Avatar, BotFlag, Btn, Icon, PageFlag } from "@/reusables/design";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import CommunityName from "@/app/reusables/CommunityName";
import { CommunityPostScope } from "@/app/reusables/CommunityPostScope";
import ConfirmModal from "@/app/widgets/modals/ConfirmModal";
import PageLoader from "@/app/reusables/loaders/PageLoader";
import BrokenLink from "@/app/reusables/catchers/BrokenLink";
import ProfileCoverContainer from "../profile/user/ProfileCoverContainer";
import ProfilePicContainer from "../profile/user/ProfilePicContainer";
import PostsContainer from "../profile/user/PostsContainer";
import {
  getCommunity,
  joinCommunity,
  leaveCommunity,
  type CommunityCard,
} from "@/reusables/hooks/communityRequests";
import { GetRealmMembersRequest } from "@/reusables/hooks/requests";
import {
  canManageCommunitySettings,
  canReadCommunity,
} from "@/reusables/hooks/communityState";
import {
  notifyRequestError,
  resolveErrorMessage,
} from "@/reusables/hooks/errormessages";
import { communityProfilePath } from "@/reusables/routing/communityPaths";
import type {
  AuthenticationInterface,
  IRealmMember,
} from "@/reusables/vars/interfaces";

/** The user profile's shell, hero, media controls and feed, bound to a realm. */
export default function CommunityProfile({
  communityId,
}: {
  communityId?: string;
}) {
  const params = useParams();
  const navigate = useNavigate();
  const id = communityId || params.communityId || params.userID || "";
  const authentication = useSelector(
    (state: { authentication: AuthenticationInterface }) =>
      state.authentication,
  );
  const width = useSelector((state: any) => state.screensizelistener.W);
  const actor =
    authentication.active_entity_context?.id ?? authentication.user?.entity_id;
  const [community, setCommunity] = useState<CommunityCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedError, setFeedError] = useState("");
  const [pending, setPending] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [revision, setRevision] = useState(0);
  const [tab, setTab] = useState("posts");
  const tabs = ["posts", "members"];
  const [members, setMembers] = useState<IRealmMember[]>([]);
  const [membersPage, setMembersPage] = useState(1);
  const [membersNext, setMembersNext] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState("");
  const currentCommunity = useRef(community);
  const epoch = useRef(0);
  const mutationPending = useRef(false);
  currentCommunity.current = community;

  const refresh = useCallback(() => {
    epoch.current++;
    setConfirmLeave(false);
    setCommunity(null);
    setMembers([]);
    setMembersPage(1);
    setRevision((value) => value + 1);
  }, []);

  useEffect(() => {
    setTab("posts");
    setConfirmLeave(false);
  }, [id, actor, authentication.auth]);

  useEffect(() => {
    const changed = (event: Event) => {
      const realmId = (event as CustomEvent).detail?.realm_id;
      if (
        !realmId ||
        realmId === id ||
        realmId === currentCommunity.current?.realm_id
      ) {
        refresh();
      }
    };
    document.addEventListener("community-changed", changed);
    return () => document.removeEventListener("community-changed", changed);
  }, [id, refresh]);

  useEffect(() => {
    const version = ++epoch.current;
    let active = true;
    setCommunity(null);
    setMembers([]);
    setMembersPage(1);
    setLoading(true);
    setError("");
    setFeedError("");
    getCommunity(id)
      .then((response) => {
        if (active && epoch.current === version) setCommunity(response.result);
      })
      .catch((error) => {
        if (active && epoch.current === version) {
          setError("This community is unavailable.");
          notifyRequestError(error, "This community is unavailable.");
        }
      })
      .finally(() => {
        if (active && epoch.current === version) setLoading(false);
      });
    return () => {
      active = false;
      // Invalidate pending membership mutations; this ref is not a DOM node.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      epoch.current++;
    };
  }, [id, actor, revision, authentication.auth]);

  useEffect(() => {
    if (community && params.communityId) {
      navigate(communityProfilePath(community), { replace: true });
    }
  }, [community, params.communityId, navigate]);

  useEffect(() => {
    if (
      !authentication.auth ||
      !community ||
      tab !== "members" ||
      !canReadCommunity(community)
    )
      return;
    let active = true;
    const version = epoch.current;
    setMembersLoading(true);
    if (membersPage === 1) setMembers([]);
    setMembersError("");
    GetRealmMembersRequest(community.realm_id, membersPage, 20)
      .then((response) => {
        if (!active || epoch.current !== version) return;
        setMembers((previous) =>
          membersPage === 1
            ? response.results
            : [...previous, ...response.results],
        );
        setMembersNext(Boolean(response.next));
      })
      .catch((error) => {
        if (active && epoch.current === version) {
          setMembers([]);
          setMembersError("failed");
          notifyRequestError(error, "The member list is unavailable.");
        }
      })
      .finally(() => {
        if (active && epoch.current === version) setMembersLoading(false);
      });
    return () => {
      active = false;
    };
  }, [authentication.auth, community, tab, membersPage]);

  const feedAccessDenied = useCallback((error: unknown) => {
    setFeedError(resolveErrorMessage(error, "Posts could not be loaded."));
    notifyRequestError(error, "Posts could not be loaded.");
  }, []);

  const updateMembership = async () => {
    if (!community || mutationPending.current) return;
    mutationPending.current = true;
    setPending(true);
    setError("");
    const version = epoch.current;
    try {
      if (community.is_member || community.request_pending) {
        await leaveCommunity(community.realm_id, !community.is_member);
      } else {
        await joinCommunity(community.realm_id);
      }
      if (version === epoch.current) {
        document.dispatchEvent(
          new CustomEvent("community-changed", {
            detail: { realm_id: community.realm_id },
          }),
        );
        window.dispatchEvent(new CustomEvent("broadcast_reload_feed"));
      }
    } catch (error) {
      if (version === epoch.current) {
        notifyRequestError(error, "Membership could not be updated.");
      }
    } finally {
      mutationPending.current = false;
      setPending(false);
    }
  };

  if (!community) {
    return loading ? (
      <PageLoader />
    ) : (
      <BrokenLink
        label={error || "This community is unavailable."}
        secondaryLabel="Please check and try again."
      />
    );
  }

  const canManage =
    authentication.auth === true &&
    canManageCommunitySettings(community.my_role);
  const canRead = canReadCommunity(community);
  const actionClass =
    "cl-profile-action-button--secondary tw-cursor-pointer tw-font-semibold tw-font-Inter tw-p-[8px] tw-pl-[10px] tw-pr-[10px] tw-rounded-[12px] cl-text-caption";

  return (
    <div className="cl-profile-page__shell tw-w-full tw-h-full tw-absolute tw-flex tw-flex-col tw-items-center tw-z-[2] tw-gap-[6px] tw-overflow-y-scroll x-scroll">
      <div className="cl-profile-page__hero tw-mb-[6px] tw-w-full tw-h-auto tw-min-h-[auto] sm:tw-min-h-[500px] tw-flex tw-flex-col tw-justify-start sm:tw-justify-center tw-items-center tw-py-[0px] sm:tw-py-[0px]">
        <ProfileCoverContainer
          userID={community.realm_id}
          realm_id={community.realm_id}
          realm_type="community"
          coverphoto={community.cover_photo}
          type="realm"
          isAllowed={canManage}
          getpostprocess={refresh}
        />
        <div className="cl-profile-picrow tw-w-[calc(100%-24px)] sm:tw-w-[calc(100%-80px)] tw-h-auto sm:tw-h-[150px] tw-bg-transparent tw-max-w-[calc(1200px-80px)] tw-flex tw-flex-col sm:tw-flex-row tw-items-center tw-justify-center tw-flex-wrap tw-pl-[12px] tw-pr-[12px] sm:tw-pl-[40px] sm:tw-pr-[40px]">
          <ProfilePicContainer
            userID={community.realm_id}
            entityId={community.entity_id}
            realm_id={community.realm_id}
            realm_type="community"
            profile={community.profile}
            name={community.name}
            type="realm"
            isAllowed={canManage}
            getpostprocess={refresh}
          />
          <div className="cl-profile-identity tw-bg-transparent tw-flex tw-flex-col sm:tw-flex-row tw-flex-1 tw-h-auto sm:tw-h-full tw-items-center">
            <div className="cl-profile-identity__meta tw-flex tw-flex-1 tw-flex-col tw-items-center sm:tw-items-start tw-justify-center tw-h-full tw-p-[16px] tw-sm:p-[0px]">
              <span className="cl-identity-name cl-text-hero tw-font-bold tw-flex tw-items-center tw-gap-[5px]">
                <CommunityName community={community} />
                {community.is_private && (
                  <Icon n="lock" s={18} c="var(--text-2)" />
                )}
              </span>
              <span className="cl-text-body tw-break-all tw-mb-[14px]">
                {community.is_private ? "Private" : "Public"} community ·{" "}
                {community.member_count ?? "—"} members
              </span>
              {community.slug && (
                <span className="cl-text-body tw-break-all">
                  @{community.slug}
                </span>
              )}
            </div>
            <div className="cl-profile-actions">
              {authentication.auth &&
                ["owner", "admin", "moderator"].includes(
                  community.my_role || "",
                ) && (
                  <button
                    className={actionClass}
                    onClick={() => navigate(`/realms/${community.realm_id}`)}
                  >
                    Manage realm
                  </button>
                )}
              {!authentication.auth ? (
                <>
                  <button
                    className={actionClass}
                    onClick={() => navigate("/login")}
                  >
                    Login
                  </button>
                  <button
                    className={actionClass}
                    onClick={() => navigate("/register")}
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <button
                  className={actionClass}
                  disabled={pending}
                  onClick={() => {
                    if (community.is_member) setConfirmLeave(true);
                    else void updateMembership();
                  }}
                >
                  {pending
                    ? "Updating…"
                    : community.is_member
                      ? "Leave community"
                      : community.request_pending
                        ? "Cancel request"
                        : community.is_private
                          ? "Request to join"
                          : "Join community"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="cl-profile-page__content cl-bleed-host tw-bg-transparent tw-max-w-[1200px] tw-w-[calc(100%-24px)] sm:tw-w-[98%] tw-flex tw-flex-col md:tw-flex-row tw-gap-[10px] tw-items-stretch md:tw-items-start">
        <div className="cl-profile-page__sidebar tw-bg-transparent tw-w-full tw-flex tw-flex-col tw-gap-[8px] tw-items-center md:tw-sticky tw-top-[10px] tw-max-w-[100%] md:tw-max-w-[400px]">
          <section className="cl-profile-surface tw-w-full tw-h-fit tw-flex">
            <div className="tw-w-full tw-p-[18px] tw-flex tw-flex-col tw-items-start tw-gap-[12px] tw-text-left">
              <h2 className="cl-text-body tw-font-semibold tw-m-0">
                About this community
              </h2>
              <p className="cl-text-body tw-text-[var(--text-2)] tw-m-0">
                {community.description || "Welcome to our community."}
              </p>
              <span className="cl-text-caption tw-text-[var(--text-2)]">
                {community.is_private
                  ? "Private · Members only"
                  : "Public · Anyone can read"}
              </span>
            </div>
          </section>
        </div>
        <div className="cl-profile-page__feed tw-w-full tw-pb-[12px] tw-flex tw-flex-col tw-items-center tw-gap-[4px]">
          <div className="cl-profile-surface cl-profile-page__feed-nav tw-w-full tw-h-fit tw-flex tw-mb-[6px]">
            <nav
              aria-label="Community profile"
              style={{ justifyContent: width < 800 ? "center" : "start" }}
              className="tw-w-full tw-p-[10px] tw-flex tw-flex-row tw-flex-wrap tw-items-center tw-gap-[4px]"
            >
              {tabs.map((value) => (
                <motion.button
                  key={value}
                  aria-current={tab === value ? "page" : undefined}
                  onClick={() => {
                    setTab(value);
                    setMembersPage(1);
                  }}
                  animate={{
                    backgroundColor:
                      tab === value ? "var(--brand-soft)" : "transparent",
                    color: tab === value ? "var(--brand)" : "var(--text-2)",
                  }}
                  className="cl-profile-tab-button tw-flex tw-flex-row tw-gap-[5px] tw-items-center tw-font-Inter tw-p-[6px] tw-px-[10px] tw-cursor-pointer tw-rounded-md tw-border-none"
                >
                  <span className="cl-text-caption tw-font-semibold">
                    {value[0].toUpperCase() + value.slice(1)}
                  </span>
                </motion.button>
              ))}
            </nav>
          </div>
          {!canRead ? (
            <section className="cl-profile-surface tw-w-full tw-p-[24px] tw-text-center">
              <Icon n="lock" s={40} />
              <h2 className="cl-text-body tw-font-semibold tw-m-0">
                This community is private
              </h2>
              <p className="cl-text-body tw-mt-[12px]">
                {community.request_pending
                  ? "Your request is pending. You can participate after approval."
                  : "Join this community to see its posts and members."}
              </p>
            </section>
          ) : tab === "members" ? (
            <section className="cl-profile-surface tw-w-full tw-p-[18px] tw-text-left">
              <h2 className="cl-text-body tw-font-semibold tw-m-0">Members</h2>
              {!authentication.auth && (
                <Btn onClick={() => navigate("/login")}>
                  Login to view members
                </Btn>
              )}
              {membersError && (
                <Btn variant="soft" onClick={refresh}>
                  Try again
                </Btn>
              )}
              {membersLoading && membersPage === 1 && (
                <div role="status" aria-label="Loading members">
                  {Array.from({ length: 6 }, (_, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "6px 0",
                        lineHeight: 1,
                      }}
                    >
                      <Skeleton
                        circle
                        width={32}
                        height={32}
                        baseColor="var(--skeleton)"
                        highlightColor="var(--skeleton-shine)"
                      />
                      <Skeleton
                        width={120}
                        height={13}
                        baseColor="var(--skeleton)"
                        highlightColor="var(--skeleton-shine)"
                      />
                      <span className="tw-ml-auto">
                        <Skeleton
                          width={46}
                          height={11}
                          baseColor="var(--skeleton)"
                          highlightColor="var(--skeleton-shine)"
                        />
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {membersLoading && membersPage > 1 && (
                <p role="status">Loading more members…</p>
              )}
              {members.map((member) => (
                <div
                  className="tw-flex tw-items-center tw-gap-[10px] tw-py-[10px]"
                  key={member.member_id}
                >
                  <Avatar
                    id={member.entity.id}
                    name={
                      member.entity.details.name ||
                      member.entity.details.first_name ||
                      "Member"
                    }
                    src={member.entity.details.profile}
                    size={36}
                  />
                  <a
                    className="cl-text-body tw-font-semibold tw-inline-flex tw-items-center tw-gap-[4px] tw-min-w-0 tw-text-[var(--text)]"
                    href={`/${member.entity.type === "realm" ? member.entity.details.slug || member.entity.details.realm_id : member.entity.type === "bot" ? member.entity.details.handle || member.entity.details.username : member.entity.details.username}`}
                    onClick={(event) => {
                      if (
                        event.button !== 0 ||
                        event.metaKey ||
                        event.ctrlKey ||
                        event.shiftKey ||
                        event.altKey
                      )
                        return;
                      event.preventDefault();
                      navigate(event.currentTarget.getAttribute("href")!);
                    }}
                  >
                    <span className="tw-truncate">
                      {member.entity.details.name ||
                        [
                          member.entity.details.first_name,
                          member.entity.details.last_name,
                        ]
                          .filter(Boolean)
                          .join(" ") ||
                        member.entity.details.username}
                    </span>
                    {member.entity.type !== "bot" &&
                      (member.entity.details.is_badged ||
                        member.entity.details.is_verified) && (
                        <RiVerifiedBadgeFill
                          size={14}
                          color="var(--brand)"
                          style={{ flexShrink: 0 }}
                        />
                      )}
                    {member.entity.type === "realm" && (
                      <PageFlag realmType={member.entity.details.type} />
                    )}
                    {member.entity.type === "bot" && <BotFlag is />}
                  </a>
                  <span className="cl-text-caption tw-ml-auto tw-text-[var(--text-3)]">
                    {member.role}
                  </span>
                </div>
              ))}
              {membersNext && !membersLoading && (
                <Btn
                  variant="soft"
                  onClick={() => setMembersPage((value) => value + 1)}
                >
                  Load more
                </Btn>
              )}
            </section>
          ) : feedError ? (
            <div className="cl-profile-surface tw-w-full tw-p-[18px] tw-text-left">
              <Btn variant="soft" onClick={refresh}>
                Try again
              </Btn>
            </div>
          ) : (
            <CommunityPostScope.Provider value={community.entity_id}>
              <PostsContainer
                key={`${actor}:${community.realm_id}`}
                community={community}
                onCommunityAccessDenied={feedAccessDenied}
              />
            </CommunityPostScope.Provider>
          )}
        </div>
      </div>
      {confirmLeave && (
        <ConfirmModal
          title="Leave community?"
          message={`You will leave ${community.name}. ${community.is_private ? "Joining again will require approval." : "You can join again later."}`}
          confirmLabel="Leave community"
          onClose={() => setConfirmLeave(false)}
          onConfirm={() => {
            setConfirmLeave(false);
            if (community.is_member) void updateMembership();
          }}
          isBusy={pending}
        />
      )}
    </div>
  );
}
