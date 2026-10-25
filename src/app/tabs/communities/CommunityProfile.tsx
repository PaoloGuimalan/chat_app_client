/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { Avatar, Card, Icon } from "@/reusables/design";
import CommunityName from "@/app/reusables/CommunityName";
import ProfileComposerContent from "@/app/reusables/ProfileComposerContent";
import PostItem from "../profile/user/PostItem";
import { NewPostModal } from "@/app/widgets/modals/CreatePost/NewPostModal";
import { getCommunity, joinCommunity, leaveCommunity, type CommunityCard } from "@/reusables/hooks/communityRequests";
import { GetPostRequest, GetRealmMembersRequest } from "@/reusables/hooks/requests";
import { canReadCommunity } from "@/reusables/hooks/communityState";
import { resolveErrorMessage } from "@/reusables/hooks/errormessages";
import type { IPost, IRealmMember } from "@/reusables/vars/interfaces";
import "../../../styles/communities.css";
export default function CommunityProfile({ communityId }: {
  communityId?: string;
}) {
  const params = useParams();
  const id = communityId || params.communityId || params.userID || "";
  const actor = useSelector((state: any) => state.authentication.active_entity_context?.id ?? state.authentication.user.entity_id);
  const width = useSelector((state: any) => state.screensizelistener.W);
  const avatarSize = width < 650 ? 120 : width < 900 ? 160 : 78;
  const navigate = useNavigate();
  const [community, setCommunity] = useState<CommunityCard | null>(null);
  const currentCommunity = useRef<CommunityCard | null>(null);
  currentCommunity.current = community;
  const [posts, setPosts] = useState<IPost[]>([]);
  const [members, setMembers] = useState<IRealmMember[]>([]);
  const [tab, setTab] = useState("posts");
  const [page, setPage] = useState(1);
  const [next, setNext] = useState(false);
  const [busy, setBusy] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [rosterError, setRosterError] = useState("");
  const [compose, setCompose] = useState(false);
  const [withImage, setWithImage] = useState(false);
  const [draft, setDraft] = useState("");
  const [revision, setRevision] = useState(0);
  const epoch = useRef(0);
  const mutationPending = useRef(false);
  const refresh = useCallback(() => {
    epoch.current++;
    setPosts([]);
    setMembers([]);
    setCompose(false);
    setCommunity(null);
    setPage(1);
    setRevision(value => value + 1);
  }, []);
  useEffect(() => {
    refresh();
    setTab("posts");
  }, [id, actor, refresh]);
  useEffect(() => {
    const changed = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (!detail?.realm_id || detail.realm_id === currentCommunity.current?.realm_id || detail.realm_id === id)
        refresh();
    };
    document.addEventListener("community-changed", changed);
    return () => document.removeEventListener("community-changed", changed);
  }, [id, refresh]);
  useEffect(() => {
    let active = true;
    const version = ++epoch.current;
    setBusy(true);
    setError("");
    setPosts([]);
    setMembers([]);
    setCompose(false);
    getCommunity(id).then(response => {
      if (active && epoch.current === version)
        setCommunity(response.result);
    }).catch(error => {
      if (active) {
        setCommunity(null);
        setError(resolveErrorMessage(error, "This community is unavailable."));
      }
    }).finally(() => {
      if (active)
        setBusy(false);
    });
    return () => {
      active = false;
      // This counter invalidates async work; it is not a DOM ref.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      epoch.current++;
    };
  }, [id, actor, revision]);
  useEffect(() => {
    if (!community || !canReadCommunity(community)) {
      setPosts([]);
      setMembers([]);
      return;
    }
    let active = true;
    const version = epoch.current;
    setBusy(true);
    if (tab === "posts")
      GetPostRequest({ current_user_id: actor, userID: community.realm_id, page, range: 20 }).then(response => {
        if (!active || epoch.current !== version)
          return;
        setPosts(previous => page === 1 ? response.results : [...previous, ...response.results].filter((post, index, rows) => rows.findIndex(row => row.post_id === post.post_id) === index));
        setNext(Boolean(response.next));
      }).catch(error => {
        if (active) {
          setPosts([]);
          setCompose(false);
          setError(resolveErrorMessage(error, "Posts could not be loaded."));
          if ((error?.response?.status ?? error?.status) === 404)
            setCommunity(null);
          else if ((error?.response?.status ?? error?.status) === 403)
            setCommunity(previous => previous?.is_member ? { ...previous, is_member: false } : previous);
        }
      }).finally(() => {
        if (active)
          setBusy(false);
      });
    else if (tab === "members") {
      setRosterError("");
      GetRealmMembersRequest(community.realm_id, page, 20).then(response => {
        if (active && epoch.current === version) {
          setMembers(previous => page === 1 ? response.results : [...previous, ...response.results]);
          setNext(Boolean(response.next));
        }
      }).catch(error => {
        if (active) {
          setMembers([]);
          setRosterError(resolveErrorMessage(error, "The member list is only available to authorized members."));
        }
      }).finally(() => {
        if (active)
          setBusy(false);
      });
    }
    else
      setBusy(false);
    return () => {
      active = false;
    };
  }, [community, tab, page, actor, refresh]);
  const membership = async () => {
    if (!community || mutationPending.current)
      return;
    mutationPending.current = true;
    setPending(true);
    setError("");
    const version = epoch.current;
    try {
      if (community.is_member || community.request_pending)
        await leaveCommunity(community.realm_id);
      else
        await joinCommunity(community.realm_id);
      if (epoch.current === version) {
        document.dispatchEvent(new CustomEvent("community-changed", { detail: { realm_id: community.realm_id } }));
        window.dispatchEvent(new CustomEvent("broadcast_reload_feed"));
        refresh();
      }
    }
    catch (error) {
      if (epoch.current === version)
        setError(resolveErrorMessage(error, "Membership could not be updated."));
    }
    finally {
      mutationPending.current = false;
      setPending(false);
    }
  };
  if (!community)
    return <main className="cl-communities cl-community-profile cl-bleed-host">
      <button className="cl-community-back" onClick={() => navigate("/communities")}><Icon n="chevron_left" s={22} /> Communities</button>
      {busy ? <p role="status">Loading community…</p> : <div className="cl-community-panel" role="alert">
        {error || "This community is unavailable."}
        <button onClick={refresh}>Try again</button>
      </div>}
    </main>;
  return <main className="cl-communities cl-community-profile cl-bleed-host thinscroller">
    <button className="cl-community-back" onClick={() => navigate("/communities")}><Icon n="chevron_left" s={22} /> Communities</button>
    <section className="cl-community-profile-header">
      <div className="cl-community-cover" style={community.cover_photo && community.cover_photo !== "none" ? { backgroundImage: `url(${community.cover_photo})` } : undefined} />
      <div className="cl-community-profile-title">
        <div className="cl-community-profile-avatar">
          <Avatar
            id={community.entity_id}
            name={community.name}
            src={community.profile !== "none" ? community.profile : undefined}
            size={avatarSize}
          />
        </div>
        <div className="cl-community-profile-identity">
          <h1>
            <CommunityName community={community} />
          </h1>
          <p>
            {community.is_private ? "Private" : "Public"} community · {community.member_count ?? "—"} members</p>
        </div>
        <div className="cl-community-actions">
          {["owner", "admin", "moderator"].includes(community.my_role || "") && <button className="cl-community-secondary" onClick={() => navigate(`/realms/${community.realm_id}`)}>Manage realm</button>}
          <button className={community.is_member || community.request_pending ? "cl-community-secondary" : "cl-community-primary"} disabled={pending} onClick={membership}>
            {pending ? "Updating…" : community.is_member ? "Leave community" : community.request_pending ? "Cancel request" : community.is_private ? "Request to join" : "Join community"}
          </button>
        </div>
      </div>
      <nav className="cl-community-tabs">
        {["posts", "about", "members"].map(value => <button key={value} aria-current={tab === value ? "page" : undefined} onClick={() => {
          setTab(value);
          setPage(1);
          setNext(false);
        }}>
          {value[0].toUpperCase() + value.slice(1)}
        </button>)}
      </nav>
    </section>
    {error && <div role="alert" className="cl-community-panel">
      {error}
    </div>}
    {tab === "about" ? <section className="cl-community-panel">
      <h2>About</h2>
      <p>
        {community.description || "Welcome to our community."}
      </p>
      <p>
        <Icon n={community.is_private ? "lock" : "public"} s={18} /> {community.is_private ? "Only members can see posts and participate." : "Anyone can read. Join to post, comment and react."}
      </p>
    </section> : !canReadCommunity(community) ? <section className="cl-community-panel cl-community-private">
      <Icon n="lock" s={40} />
      <h2>This community is private</h2>
      <p>
        {community.request_pending ? "Your request is pending. You can participate after approval." : "Join this community to see its posts and members."}
      </p>
    </section> : tab === "members" ? <section className="cl-community-panel">
      <h2>Members</h2>
      {rosterError && <p role="alert">
        {rosterError}
      </p>}
      {members.map(member => <div className="cl-community-member" key={member.member_id}>
        <Avatar id={member.entity.id} name={member.entity.details.name || member.entity.details.first_name || "Member"} src={member.entity.details.profile} size={36} />
        <span>
          {member.entity.details.name || [member.entity.details.first_name, member.entity.details.last_name].filter(Boolean).join(" ") || member.entity.details.username}
        </span>
        <small>
          {member.role}
        </small>
      </div>)}
    </section> : <div className="cl-community-columns">
      <section className="cl-community-feed">
        {community.is_member && (
          <Card pad={12} className="cl-bleed" style={{ width: "100%", marginBottom: 8 }}>
            <ProfileComposerContent
              placeholder={`Share something with ${community.name}…`}
              value={draft}
              onChange={setDraft}
              onOpen={media => { setWithImage(media); setCompose(true); }}
            />
          </Card>
        )}
        {posts.map(post => (
          <Card
            key={`${actor}:${post.post_id}`}
            pad={10}
            className="cl-bleed tw-flex tw-justify-center"
          >
            <PostItem isSharePreview={false} mp={post} />
          </Card>
        ))}
        {!busy && posts.length === 0 && !error && <div className="cl-community-panel">No posts yet.</div>}
      </section>
      <aside className="cl-community-panel">
        <h2>About this community</h2>
        <p>
          {community.description}
        </p>
        <p>
          {community.is_private ? "Private · Members only" : "Public · Anyone can read"}
        </p>
      </aside>
    </div>}
    {busy && <p role="status">Loading…</p>}
    {next && !busy && tab !== "about" && canReadCommunity(community) && <button className="cl-community-secondary" onClick={() => setPage(value => value + 1)}>Load more</button>}
    {compose && community.is_member && <NewPostModal key={`${actor}:${community.entity_id}`} community={community} toShare={false} withImage={withImage} setcreateposttext={setDraft} getpostprocess={refresh} onclose={() => setCompose(false)} />}
  </main>;
}
