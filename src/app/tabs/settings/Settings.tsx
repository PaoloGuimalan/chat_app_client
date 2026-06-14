/* eslint-disable @typescript-eslint/no-explicit-any */
import { SET_PAGE_MODAL } from "@/redux/types";
import { ReactNode, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import MapFeedSettings from "./section/MapFeedSettings";
import ArchivedMessages from "./section/ArchivedMessages";
import { Card, Icon, IconBtn, useTheme } from "@/reusables/design";
import PersonalInformation from "./section/PersonalInformation";
import Credentials from "./section/Credentials";

interface SettingsItem {
  key: string;
  icon: string;
  name: string;
  description: string;
  isDisabled: boolean;
  component: ReactNode | null;
}

interface SettingsCategory {
  category: string;
  description: string;
  items: SettingsItem[];
}

function Settings({ isModal }: { isModal: boolean }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { theme } = useTheme();

  const [modalPage, setmodalPage] = useState<{
    isToggled: boolean;
    component: ReactNode | null;
    key: string | null;
  }>({ isToggled: false, component: null, key: null });

  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );

  const isMobileView = useMemo(
    () => screensizelistener.W <= 1100,
    [screensizelistener],
  );

  const mappedSettingsList: SettingsCategory[] = useMemo(
    () => [
      {
        category: "Account",
        description:
          "Review, Update, Validate, and Manage your informations on how you want it to appear.",
        items: [
          {
            key: "personal",
            icon: "account_circle",
            name: "Personal Information",
            description:
              "Change your name, birthdate, address, and your other public informations.",
            isDisabled: false,
            component: <PersonalInformation />,
          },
          {
            key: "credentials",
            icon: "key",
            name: "Credentials",
            description: "Setup or update your necessary account credentials.",
            isDisabled: false,
            component: <Credentials />,
          },
          {
            key: "privacy",
            icon: "lock",
            name: "Privacy",
            description: "Configure your account privacy settings.",
            isDisabled: true,
            component: null,
          },
        ],
      },
      {
        category: "Messages",
        description:
          "Access your archived or restricted messages and other messaging settings",
        items: [
          {
            key: "archives",
            icon: "inventory_2",
            name: "Archives",
            description:
              "Check your archived messages and revisit conversations.",
            isDisabled: false,
            component: <ArchivedMessages />,
          },
          {
            key: "restricted",
            icon: "block",
            name: "Restricted",
            description:
              "Access your restricted conversations and/or unrestrict certain people.",
            isDisabled: true,
            component: <ArchivedMessages />,
          },
        ],
      },
      {
        category: "Location",
        description: "View and/or Modify how the app displays your location.",
        items: [
          {
            key: "map",
            icon: "map",
            name: "Map Feed Access",
            description:
              "Change how Map Feed use or display your location relative to your existing connections.",
            isDisabled: false,
            component: <MapFeedSettings />,
          },
        ],
      },
    ],
    [],
  );

  const onItemClick = (it: SettingsItem) => {
    if (it.isDisabled || !it.component) return;
    setmodalPage({ isToggled: true, component: it.component, key: it.key });
  };

  const onBack = () => {
    if (isModal) {
      dispatch({ type: SET_PAGE_MODAL, payload: { pagemodal: null } });
      return;
    }
    if (modalPage.isToggled) {
      setmodalPage({ isToggled: false, component: null, key: null });
    } else {
      navigate("/");
    }
  };

  const renderList = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        flex: 1,
        minWidth: 0,
        overflowY: "auto",
        padding: "0 18px 24px",
      }}
    >
      {mappedSettingsList.map((cat) => (
        <Card
          key={cat.category}
          pad={20}
          style={{ borderRadius: "var(--r-sm)" }}
        >
          <div style={{ marginBottom: 14 }}>
            <div
              style={{ fontSize: 14, fontWeight: 750 }}
              className="tw-text-left"
            >
              {cat.category}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-3)",
                marginTop: 4,
              }}
              className="tw-text-left"
            >
              {cat.description}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {cat.items.map((it) => (
              <button
                key={it.key}
                disabled={it.isDisabled}
                onClick={() => onItemClick(it)}
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  width: "100%",
                  border: "none",
                  padding: 0,
                  background: "transparent",
                  cursor: it.isDisabled ? "not-allowed" : "pointer",
                  opacity: it.isDisabled ? 0.5 : 1,
                  textAlign: "left",
                  borderRadius: "var(--r-sm)",
                }}
              >
                <span
                  style={{
                    width: 50,
                    height: 50,
                    flex: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon n={it.icon} s={36} c="#757b87" />
                </span>
                <span style={{ flex: 1 }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: 14,
                      color: "var(--text)",
                    }}
                  >
                    {it.name}
                  </span>
                  <span
                    style={{
                      display: "block",
                      fontSize: 12,
                      color: "var(--text-3)",
                      marginTop: 2,
                    }}
                  >
                    {it.description}
                  </span>
                </span>
                {!it.isDisabled && !isMobileView && (
                  <Icon n="chevron_right" s={22} c="var(--text-3)" />
                )}
              </button>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );

  const renderDetail = modalPage.isToggled && (
    <Card
      pad={20}
      style={{
        flex: 1,
        minWidth: 0,
        maxWidth: isMobileView ? "100%" : "60%",
        borderRadius: "var(--r-sm)",
        margin: isMobileView ? "0 18px 24px" : "0 18px 24px 0",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {isMobileView && (
        <button
          onClick={() =>
            setmodalPage({ isToggled: false, component: null, key: null })
          }
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            border: "none",
            background: "transparent",
            color: "var(--brand)",
            fontWeight: 650,
            fontSize: 13,
            cursor: "pointer",
            padding: 0,
            marginBottom: 14,
            alignSelf: "flex-start",
          }}
        >
          <Icon n="arrow_back" s={18} />
          All settings
        </button>
      )}
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {modalPage.component}
      </div>
    </Card>
  );

  return (
    <div
      className="cl-redesign"
      data-theme={theme}
      style={{
        position: "absolute",
        inset: 0,
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        zIndex: 2,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 22px",
          flex: "none",
        }}
      >
        {/* <IconBtn n="arrow_back" onClick={onBack} title="Back" /> */}
        <h1
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: "-0.02em",
          }}
        >
          Settings
        </h1>
        {isModal && (
          <IconBtn
            n="close"
            onClick={onBack}
            title="Close"
            style={{ marginLeft: "auto" }}
          />
        )}
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: isMobileView ? "column" : "row",
          gap: 0,
        }}
      >
        {(!modalPage.isToggled || !isMobileView) && renderList}
        {renderDetail}
      </div>
    </div>
  );
}

export default Settings;

