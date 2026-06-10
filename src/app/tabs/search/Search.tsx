/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AiOutlineSearch, AiOutlineLoading3Quarters } from "react-icons/ai";
import { FiArrowRight } from "react-icons/fi";
import { RiUser3Line } from "react-icons/ri";
import { SearchRequest } from "@/reusables/hooks/requests";
import DefaultProfile from "../../../assets/imgs/default.png";
import CachedImage from "@/app/reusables/cachers/CachedImage";
import { UserSearchResult } from "@/reusables/vars/interfaces";

const TRENDING_TAGS = [
  "#MapFeed",
  "#5amClub",
  "#DesignTokens",
  "#LinkShareExplore",
  "live pins",
  "Neon Systems",
];

const DISCOVER_CARDS = [
  {
    title: "People near you",
    text: "Find friends, coworkers, and nearby people in your circle.",
    icon: "person_search",
  },
  {
    title: "Live map posts",
    text: "See who is sharing from the map feed right now.",
    icon: "map",
  },
  {
    title: "Communities",
    text: "Jump into servers and group chats that match your interests.",
    icon: "dns",
  },
];

function SearchScreen() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const alerts = useSelector((state: any) => state.alerts);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeChip, setActiveChip] = useState("people");

  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = window.setTimeout(() => {
      SearchRequest(
        { searchdata: searchTerm.trim() },
        dispatch,
        setIsLoading,
        alerts,
        setSearchResults,
      );
    }, 200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchTerm, dispatch, alerts]);

  const filteredResults = useMemo(() => {
    if (activeChip !== "people") {
      return searchResults;
    }
    return searchResults;
  }, [activeChip, searchResults]);

  return (
    <div className="cl-screen-shell">
      <div className="cl-feed-shell" style={{ gridTemplateColumns: "minmax(0, 1fr) 320px" }}>
        <div className="cl-card cl-card-pad" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div className="cl-section-title" style={{ marginBottom: 8 }}>
              <div>
                <h3>Explore</h3>
                <div style={{ marginTop: 4, color: "var(--cl-text-2)" }}>
                  Search people, communities, and live topics.
                </div>
              </div>
            </div>
            <div className="cl-input-shell">
              <AiOutlineSearch size={18} color="var(--cl-text-3)" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search ChatterLoop"
                autoComplete="off"
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { key: "people", label: "People" },
              { key: "posts", label: "Posts" },
              { key: "servers", label: "Servers" },
              { key: "realms", label: "Realms" },
            ].map((chip) => (
              <button
                key={chip.key}
                className="cl-pill"
                data-active={activeChip === chip.key}
                onClick={() => setActiveChip(chip.key)}
                type="button"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {searchTerm.trim().length >= 2 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="cl-section-title" style={{ marginBottom: 0 }}>
                <h3>{isLoading ? "Searching…" : "Results"}</h3>
                {isLoading && <AiOutlineLoading3Quarters className="cl-spin" />}
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                {filteredResults.length > 0 ? (
                  filteredResults.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      onClick={() => navigate(`/${result.username}`)}
                      className="cl-card"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: 14,
                        textAlign: "left",
                      }}
                    >
                      <div
                        style={{
                          flex: "none",
                          width: 48,
                          height: 48,
                          borderRadius: "50%",
                          overflow: "hidden",
                        }}
                      >
                        <CachedImage
                          src={result.profile === "none" ? DefaultProfile : result.profile}
                          id="img_actual_profile"
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 750, fontSize: 15 }}>
                          {result.first_name} {result.last_name}
                        </div>
                        <div style={{ color: "var(--cl-text-2)", fontSize: 13 }}>
                          @{result.username} · {result.is_verified ? "Verified" : "Unverified"}
                        </div>
                      </div>
                      <FiArrowRight color="var(--cl-text-3)" />
                    </button>
                  ))
                ) : (
                  !isLoading && (
                    <div className="cl-card cl-card-pad" style={{ color: "var(--cl-text-2)" }}>
                      No matching results found.
                    </div>
                  )
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              <div className="cl-grid-3">
                {DISCOVER_CARDS.map((card) => (
                  <div key={card.title} className="cl-card cl-card-pad" style={{ minHeight: 150 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        background: "var(--cl-brand-soft)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 12,
                      }}
                    >
                      <span className="material-icons" style={{ color: "var(--cl-brand)" }}>
                        {card.icon}
                      </span>
                    </div>
                    <div style={{ fontWeight: 750, fontSize: 15, marginBottom: 6 }}>{card.title}</div>
                    <div style={{ color: "var(--cl-text-2)" }}>{card.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="cl-feed-sidebar">
          <div className="cl-card cl-card-pad">
            <div className="cl-section-title">
              <h3>Trending</h3>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {TRENDING_TAGS.map((tag) => (
                <span key={tag} className="cl-pill">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="cl-card cl-card-pad">
            <div className="cl-section-title">
              <h3>Who to follow</h3>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {["Maria Santos", "Devon Reyes", "Aiko Tanaka"].map((name) => (
                <div
                  key={name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: "var(--cl-brand-soft)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <RiUser3Line color="var(--cl-brand)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700 }}>{name}</div>
                    <div style={{ color: "var(--cl-text-2)", fontSize: 13 }}>Suggested account</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchScreen;
