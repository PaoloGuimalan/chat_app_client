/* eslint-disable @typescript-eslint/no-explicit-any */
import { FcPuzzle, FcSettings } from "react-icons/fc";
import { TbServer2 } from "react-icons/tb";
import { RiPagesFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { HScrollRail } from "@/reusables/design";
import { SET_PAGE_MODAL } from "@/redux/types";
import Settings from "@/app/tabs/settings/Settings";
import "../../../styles/account-menu.css";

export default function AppShortcuts({
  layout = "grid",
  hideSettings = false,
  onNavigate,
}: {
  layout?: "grid" | "rail";
  hideSettings?: boolean;
  onNavigate?: () => void;
}) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const width = useSelector((state: any) => state.screensizelistener.W);
  const active = useSelector(
    (state: any) => state.authentication.active_entity_context,
  );
  const items = [
    ...(!hideSettings
      ? [
          {
            name: active?.is_switched ? "Manage realm" : "Settings",
            icon: <FcSettings />,
            route: active?.is_switched
              ? "/realms/" + active.realm_id
              : "/settings",
          },
        ]
      : []),
    { name: "Servers", icon: <TbServer2 color="#e69500" />, route: "/servers" },
    { name: "Pages", icon: <RiPagesFill color="#4997f2" />, route: "/pages" },
    { name: "Chatterloop Extension", icon: <FcPuzzle />, route: null },
  ];
  const tiles = items.map((item) => (
    <button
      key={item.name}
      type="button"
      className="cl-app-shortcut"
      disabled={!item.route}
      title={item.route || layout === "rail" ? item.name : "Coming soon"}
      onClick={() => {
        if (!item.route) return;
        if (item.route === "/settings" && width > 1100) {
          dispatch({
            type: SET_PAGE_MODAL,
            payload: {
              pagemodal: { name: "Settings", component: <Settings isModal /> },
            },
          });
        } else navigate(item.route);
        onNavigate?.();
      }}
    >
      <span className="cl-app-shortcut-icon">{item.icon}</span>
      <span className="cl-app-shortcut-label">{item.name}</span>
      {layout === "grid" && !item.route && (
        <span className="cl-app-shortcut-hint">Coming soon</span>
      )}
    </button>
  ));
  return layout === "rail" ? (
    <HScrollRail
      label="Apps"
      gap={4}
      trackStyle={{ overflowX: "auto", paddingTop: 2, paddingBottom: 2 }}
    >
      {tiles}
    </HScrollRail>
  ) : (
    <div className="cl-app-shortcuts-grid">{tiles}</div>
  );
}

