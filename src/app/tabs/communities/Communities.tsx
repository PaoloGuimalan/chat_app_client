/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/reusables/design";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import CommunityDirectoryItem from "@/app/widgets/items/CommunityDirectoryItem";
import {
  listCommunities,
  type CommunityCard,
} from "@/reusables/hooks/communityRequests";
import { notifyRequestError } from "@/reusables/hooks/errormessages";
import CreateCommunityModal from "@/app/widgets/modals/CreateCommunityModal";
import { communityProfilePath } from "@/reusables/routing/communityPaths";
import "../../../styles/communities.css";
export default function Communities() {
  const actor = useSelector(
    (state: any) =>
      state.authentication.active_entity_context?.id ??
      state.authentication.user.entity_id,
  );
  const navigate = useNavigate();
  const [tab, setTab] = useState<"joined" | "discover">("discover");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [cards, setCards] = useState<CommunityCard[]>([]);
  const [next, setNext] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [create, setCreate] = useState(false);
  useEffect(() => {
    setPage(1);
    setCards([]);
    setCreate(false);
  }, [actor, search, tab]);
  useEffect(() => {
    let active = true;
    setBusy(true);
    setError("");
    const timer = setTimeout(
      () => {
        listCommunities({
          search,
          joined: tab === "joined",
          page,
          page_size: 20,
        })
          .then((response) => {
            if (!active) return;
            setCards((previous) =>
              page === 1
                ? response.results
                : [...previous, ...response.results].filter(
                    (card, i, rows) =>
                      rows.findIndex(
                        (row) => row.realm_id === card.realm_id,
                      ) === i,
                  ),
            );
            setNext(Boolean(response.next));
          })
          .catch((error) => {
            if (active) {
              setError("failed");
              notifyRequestError(error, "Communities could not be loaded.");
            }
          })
          .finally(() => {
            if (active) setBusy(false);
          });
      },
      search ? 250 : 0,
    );
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [actor, search, tab, page, retry]);
  return (
    <main className="cl-communities thinscroller">
      <header className="cl-community-heading">
        <div>
          <h1>Communities</h1>
          <p>Find your people. Share what matters.</p>
        </div>
      </header>
      <div className="cl-community-tools">
        <label className="cl-community-search">
          <Icon n="search" s={20} />
          <input
            aria-label="Search communities"
            placeholder="Search communities"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <button
          className="cl-community-primary"
          onClick={() => setCreate(true)}
        >
          + Create community
        </button>
      </div>
      <nav className="cl-community-tabs" aria-label="Community directory">
        <button
          aria-current={tab === "discover" ? "page" : undefined}
          onClick={() => setTab("discover")}
        >
          Discover
        </button>
        <button
          aria-current={tab === "joined" ? "page" : undefined}
          onClick={() => setTab("joined")}
        >
          Your communities
        </button>
      </nav>
      {error && (
        <div className="cl-community-panel">
          <button onClick={() => setRetry((value) => value + 1)}>
            Try again
          </button>
        </div>
      )}
      <div className="cl-community-grid">
        {cards.map((card) => (
          <CommunityDirectoryItem
            key={card.realm_id}
            community={card}
            onOpen={() => navigate(communityProfilePath(card))}
          />
        ))}
        {busy &&
          Array.from({ length: 6 }, (_, index) => (
            <div
              key={`loading-${index}`}
              className="cl-display-card cl-community-card"
              role="status"
              aria-label="Loading community"
            >
              <SkeletonTheme
                baseColor="var(--skeleton)"
                highlightColor="var(--skeleton-shine)"
              >
                <Skeleton height={110} borderRadius={0} />
                <div className="cl-display-card__body cl-community-card-body">
                  <Skeleton width={40} height={40} />
                  <Skeleton
                    containerClassName="tw-w-full"
                    width="65%"
                    height={14}
                  />
                  <Skeleton
                    containerClassName="tw-w-full"
                    count={2}
                    height={12}
                  />
                  <Skeleton
                    containerClassName="tw-w-full"
                    width="45%"
                    height={20}
                  />
                </div>
              </SkeletonTheme>
            </div>
          ))}
      </div>
      {!busy && !error && cards.length === 0 && (
        <div className="cl-community-panel">
          {search
            ? "No communities found."
            : tab === "joined"
              ? "You haven’t joined a community yet. Explore Discover to find one."
              : "No communities to discover yet."}
        </div>
      )}
      {!busy && next && (
        <button
          className="cl-community-secondary"
          onClick={() => setPage((value) => value + 1)}
        >
          Load more
        </button>
      )}
      {create && (
        <CreateCommunityModal
          key={actor}
          onClose={() => setCreate(false)}
          onCreated={(card) => {
            setCreate(false);
            navigate(communityProfilePath(card));
          }}
        />
      )}
    </main>
  );
}
