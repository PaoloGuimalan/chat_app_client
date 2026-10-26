/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import Skeleton from "react-loading-skeleton";
import { Avatar, Btn, Icon } from "@/reusables/design";
import CommunityName from "@/app/reusables/CommunityName";
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
import { canManageCommunitySettings, canReadCommunity } from "@/reusables/hooks/communityState";
import { resolveErrorMessage } from "@/reusables/hooks/errormessages";
import { communityProfilePath } from "@/reusables/routing/communityPaths";
import type { AuthenticationInterface, IRealmMember } from "@/reusables/vars/interfaces";

/** The user profile's shell, hero, media controls and feed, bound to a realm. */
export default function CommunityProfile({ communityId }: { communityId?: string }) {
  const params = useParams();
  const navigate = useNavigate();
  const id = communityId || params.communityId || params.userID || "";
  const authentication = useSelector(
    (state: { authentication: AuthenticationInterface }) => state.authentication,
  );
  const width = useSelector((state: any) => state.screensizelistener.W);
  const actor = authentication.active_entity_context?.id ?? authentication.user.entity_id;
  const [community, setCommunity] = useState<CommunityCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedError, setFeedError] = useState("");
  const [pending, setPending] = useState(false);
  const [revision, setRevision] = useState(0);
  const [tab, setTab] = useState("posts");
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
    setCommunity(null);
    setMembers([]);
    setMembersPage(1);
    setRevision(value => value + 1);
  }, []);

  useEffect(() => {
    setTab("posts");
  }, [id, actor]);

  useEffect(() => {
    const changed = (event: Event) => {
      const realmId = (event as CustomEvent).detail?.realm_id;
      if (!realmId || realmId === id || realmId === currentCommunity.current?.realm_id) {
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
    getCommunity(id).then(response => {
      if (active && epoch.current === version) setCommunity(response.result);
    }).catch(error => {
      if (active && epoch.current === version) {
        setError(resolveErrorMessage(error, "This community is unavailable."));
      }
    }).finally(() => {
      if (active && epoch.current === version) setLoading(false);
    });
    return () => {
      active = false;
      // Invalidate pending membership mutations; this ref is not a DOM node.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      epoch.current++;
    };
  }, [id, actor, revision]);

  useEffect(() => {
    if (community && params.communityId) {
      navigate(communityProfilePath(community), { replace: true });
    }
  }, [community, params.communityId, navigate]);

  useEffect(() => {
    if (!community || tab !== "members" || !canReadCommunity(community)) return;
    let active = true;
    const version = epoch.current;
    setMembersLoading(true);
    setMembersError("");
    GetRealmMembersRequest(community.realm_id, membersPage, 20).then(response => {
      if (!active || epoch.current !== version) return;
      setMembers(previous => membersPage === 1 ? response.results : [...previous, ...response.results]);
      setMembersNext(Boolean(response.next));
    }).catch(error => {
      if (active && epoch.current === version) {
        setMembers([]);
        setMembersError(resolveErrorMessage(error, "The member list is unavailable."));
      }
    }).finally(() => {
      if (active && epoch.current === version) setMembersLoading(false);
    });
    return () => { active = false; };
  }, [community, tab, membersPage]);

  const feedAccessDenied = useCallback((error: unknown) => {
    setFeedError(resolveErrorMessage(error, "Posts could not be loaded."));
  }, []);

  const updateMembership = async () => {
    if (!community || mutationPending.current) return;
    mutationPending.current = true;
    setPending(true);
    setError("");
    const version = epoch.current;
    try {
      if (community.is_member || community.request_pending) {
        await leaveCommunity(community.realm_id);
      } else {
        await joinCommunity(community.realm_id);
      }
      if (version === epoch.current) {
        document.dispatchEvent(new CustomEvent("community-changed", {
          detail: { realm_id: community.realm_id },
        }));
        window.dispatchEvent(new CustomEvent("broadcast_reload_feed"));
      }
    } catch (error) {
      if (version === epoch.current) {
        setError(resolveErrorMessage(error, "Membership could not be updated."));
      }
    } finally {
      mutationPending.current = false;
      setPending(false);
    }
  };

  if (!community) {
    return loading ? <PageLoader /> : (
      <BrokenLink label={error || "This community is unavailable."} secondaryLabel="Please check and try again." />
    );
  }

  const canManage = canManageCommunitySettings(community.my_role);
  const canRead = canReadCommunity(community);
  const actionClass = "cl-profile-action-button--secondary tw-cursor-pointer tw-font-semibold tw-font-Inter tw-p-[8px] tw-pl-[10px] tw-pr-[10px] tw-rounded-[12px] cl-text-caption";

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
                {community.is_private && <Icon n="lock" s={18} c="var(--text-2)" />}
              </span>
              <span className="cl-text-body tw-break-all tw-mb-[14px]">
                {community.is_private ? "Private" : "Public"} community · {community.member_count ?? "—"} members
              </span>
              {community.slug && <span className="cl-text-body tw-break-all">@{community.slug}</span>}
            </div>
            <div className="cl-profile-actions">
              {["owner", "admin", "moderator"].includes(community.my_role || "") && (
                <button className={actionClass} onClick={() => navigate(`/realms/${community.realm_id}`)}>
                  Manage realm
                </button>
              )}
              <button className={actionClass} disabled={pending} onClick={updateMembership}>
                {pending ? "Updating…" : community.is_member ? "Leave community" : community.request_pending ? "Cancel request" : community.is_private ? "Request to join" : "Join community"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="cl-profile-page__content cl-bleed-host tw-bg-transparent tw-max-w-[1200px] tw-w-[calc(100%-24px)] sm:tw-w-[98%] tw-flex tw-flex-col md:tw-flex-row tw-gap-[10px] tw-items-stretch md:tw-items-start">
        <div className="cl-profile-page__sidebar tw-bg-transparent tw-w-full tw-flex tw-flex-col tw-gap-[8px] tw-items-center md:tw-sticky tw-top-[10px] tw-max-w-[100%] md:tw-max-w-[400px]">
          <section className="cl-profile-surface tw-w-full tw-h-fit tw-flex">
            <div className="tw-w-full tw-p-[18px] tw-flex tw-flex-col tw-items-start tw-gap-[12px] tw-text-left">
              <h2 className="cl-text-body tw-font-semibold tw-m-0">About this community</h2>
              <p className="cl-text-body tw-text-[var(--text-2)] tw-m-0">{community.description || "Welcome to our community."}</p>
              <span className="cl-text-caption tw-text-[var(--text-2)]">
                {community.is_private ? "Private · Members only" : "Public · Anyone can read"}
              </span>
            </div>
          </section>
        </div>
        <div className="cl-profile-page__feed tw-w-full tw-pb-[12px] tw-flex tw-flex-col tw-items-center tw-gap-[4px]">
          <div className="cl-profile-surface cl-profile-page__feed-nav tw-w-full tw-h-fit tw-flex tw-mb-[6px]">
            <nav aria-label="Community profile" style={{ justifyContent: width < 800 ? "center" : "start" }} className="tw-w-full tw-p-[10px] tw-flex tw-flex-row tw-flex-wrap tw-items-center tw-gap-[4px]">
              {["posts", "about", "members"].map(value => (
                <motion.button
                  key={value}
                  aria-current={tab === value ? "page" : undefined}
                  onClick={() => { setTab(value); setMembersPage(1); }}
                  animate={{ backgroundColor: tab === value ? "var(--brand-soft)" : "transparent", color: tab === value ? "var(--brand)" : "var(--text-2)" }}
                  className="cl-profile-tab-button tw-flex tw-flex-row tw-gap-[5px] tw-items-center tw-font-Inter tw-p-[6px] tw-px-[10px] tw-cursor-pointer tw-rounded-md tw-border-none"
                >
                  <span className="cl-text-caption tw-font-semibold">{value[0].toUpperCase() + value.slice(1)}</span>
                </motion.button>
              ))}
            </nav>
          </div>
          {error && <div role="alert" className="cl-profile-surface tw-w-full tw-p-[18px] tw-text-left">{error}</div>}
          {tab === "about" ? (
            <section className="cl-profile-surface tw-w-full tw-p-[18px] tw-text-left">
              <h2 className="cl-text-body tw-font-semibold tw-m-0">About</h2>
              <p className="cl-text-body tw-my-[12px]">{community.description || "Welcome to our community."}</p>
              <span className="cl-text-caption tw-text-[var(--text-2)]">
                {community.is_private ? "Only members can see posts and participate." : "Anyone can read. Join to post, comment and react."}
              </span>
            </section>
          ) : !canRead ? (
            <section className="cl-profile-surface tw-w-full tw-p-[24px] tw-text-center">
              <Icon n="lock" s={40} />
              <h2 className="cl-text-body tw-font-semibold tw-m-0">This community is private</h2>
              <p className="cl-text-body tw-mt-[12px]">{community.request_pending ? "Your request is pending. You can participate after approval." : "Join this community to see its posts and members."}</p>
            </section>
          ) : tab === "members" ? (
            <section className="cl-profile-surface tw-w-full tw-p-[18px] tw-text-left">
              <h2 className="cl-text-body tw-font-semibold tw-m-0">Members</h2>
              {membersError && <p role="alert" className="cl-text-body tw-my-[12px]">{membersError}</p>}
              {membersLoading && <Skeleton count={6} height={40} baseColor="var(--surface-3)" highlightColor="var(--surface-hover)" />}
              {members.map(member => (
                <div className="tw-flex tw-items-center tw-gap-[10px] tw-py-[10px]" key={member.member_id}>
                  <Avatar id={member.entity.id} name={member.entity.details.name || member.entity.details.first_name || "Member"} src={member.entity.details.profile} size={36} />
                  <span className="cl-text-body">{member.entity.details.name || [member.entity.details.first_name, member.entity.details.last_name].filter(Boolean).join(" ") || member.entity.details.username}</span>
                  <span className="cl-text-caption tw-ml-auto tw-text-[var(--text-3)]">{member.role}</span>
                </div>
              ))}
              {membersNext && !membersLoading && <Btn variant="soft" onClick={() => setMembersPage(value => value + 1)}>Load more</Btn>}
            </section>
          ) : feedError ? (
            <div role="alert" className="cl-profile-surface tw-w-full tw-p-[18px] tw-text-left">
              <p className="cl-text-body">{feedError}</p>
              <Btn variant="soft" onClick={refresh}>Try again</Btn>
            </div>
          ) : (
            <PostsContainer key={`${actor}:${community.realm_id}`} community={community} onCommunityAccessDenied={feedAccessDenied} />
          )}
        </div>
      </div>
    </div>
  );
}
