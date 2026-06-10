/* eslint-disable @typescript-eslint/no-explicit-any */
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Default from "./partials/Default";
import MyPages from "./partials/MyPages";
import FollowedPages from "./partials/FollowedPages";
import { Icon, useTheme } from "@/reusables/design";

function Pages() {
  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );
  const urllocation = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const isMobile = screensizelistener.W <= 900;
  const insidePage = urllocation.pathname.split("/").length >= 4;
  const railHidden = isMobile && insidePage;

  const sections = [
    {
      key: "my-pages",
      icon: "description",
      title: "My Pages",
      isActive: urllocation.pathname.includes("my-pages"),
      onClick: () => navigate("/pages/my-pages"),
    },
    {
      key: "followed",
      icon: "person_add",
      title: "Followed Pages",
      isActive: urllocation.pathname.includes("followed"),
      onClick: () => navigate("/pages/followed"),
    },
  ];

  return (
    <div
      className="cl-redesign"
      data-theme={theme}
      style={{
        position: "absolute",
        inset: 0,
        background: "var(--bg)",
        display: "flex",
        flexDirection: "row",
        zIndex: 2,
      }}
    >
      <div
        style={{
          width: railHidden ? 0 : 76,
          minWidth: railHidden ? 0 : 76,
          flex: "none",
          overflow: "hidden",
          background: "var(--surface-2)",
          borderRight: railHidden ? "none" : "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: railHidden ? 0 : "12px 0",
          gap: 6,
          transition: "width .2s var(--ease)",
        }}
      >
        <button
          onClick={() => navigate("/")}
          title="Back"
          style={pagesRailBtn}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--surface-hover)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <Icon n="arrow_back" s={22} c="var(--brand)" />
        </button>
        <button
          onClick={() => navigate("/pages")}
          title="All Pages"
          style={pagesRailBtn}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--surface-hover)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <Icon n="auto_stories" s={22} c="var(--brand)" />
        </button>
        <div
          style={{
            width: "60%",
            height: 1,
            background: "var(--border)",
            margin: "4px 0",
          }}
        />
        {sections.map((s) => {
          const on = s.isActive;
          return (
            <button
              key={s.key}
              onClick={s.onClick}
              title={s.title}
              style={{
                ...pagesRailBtn,
                background: on ? "var(--brand-soft)" : "transparent",
                color: on ? "var(--brand)" : "var(--text-2)",
              }}
              onMouseEnter={(e) => {
                if (!on)
                  e.currentTarget.style.background = "var(--surface-hover)";
              }}
              onMouseLeave={(e) => {
                if (!on) e.currentTarget.style.background = "transparent";
              }}
            >
              <Icon n={s.icon} s={22} />
            </button>
          );
        })}
      </div>
      <Routes>
        <Route path="/" element={<Default />} />
        <Route path="/my-pages/*" element={<MyPages />} />
        <Route path="/followed" element={<FollowedPages />} />
      </Routes>
    </div>
  );
}

const pagesRailBtn = {
  width: 48,
  height: 48,
  flex: "none",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  borderRadius: "var(--r-md)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background .14s",
} as const;

export default Pages;
