/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactNode, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Avatar, BotFlag, Icon, PageFlag } from "@/reusables/design";
import { isUserOnline } from "@/reusables/hooks/reusable";
import type {
  AuthenticationInterface,
  IConversation,
} from "@/reusables/vars/interfaces";
import { NewMessageModal } from "@/app/widgets/modals/CreatePost/SendPostModal";
import { OPEN_THOUGHT_COMPOSER_EVENT } from "../moments/ephemeral";
import { lastMessagePreview, timestampLabel } from "./conversationPreview";

/** As many 52px faces as fit the hub's 460px on one line. */
const ACTIVE_LIMIT = 7;
/** It is a summary of the list beside it, so it shows only the first few. */
const UNREAD_LIMIT = 5;

type Action = {
  icon: string;
  label: string;
  desc: string;
  color: string;
  soft: string;
  onClick: () => void;
};

/**
 * The Messages page with no conversation open (wide screens): the action hub
 * (design 2a) - four ways to start something, who you chat with is online
 * now, and what is unread.
 *
 * Built only from what the page already holds - the conversation list with
 * the server's unread counts, and presence - so it costs no request of its
 * own. The flip side: it knows the conversations the list has loaded, which
 * are the most recent ones.
 */
function MessagesDefault({
  loading,
  onCreateGroup,
}: {
  /** The conversation list is still loading - nothing is known yet. */
  loading: boolean;
  onCreateGroup: () => void;
}) {
  const navigate = useNavigate();
  const messageslist: IConversation[] = useSelector(
    (state: any) => state.messageslist ?? [],
  );
  const activeUsers = useSelector((state: any) => state.activeuserslist);
  const istypinglist: any[] = useSelector(
    (state: any) => state.istypinglist ?? [],
  );
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );
  const me = authentication.user.entity_id;

  const [composing, setComposing] = useState(false);
  const [allActive, setAllActive] = useState(false);

  // Unread, in the list's own order - newest first.
  const unread = useMemo(
    () => messageslist.filter((c) => (c.unread ?? 0) > 0),
    [messageslist],
  );

  // People you have a chat with who are online now; each opens that chat.
  const activeNow = useMemo(() => {
    const seen = new Set<string>();
    return messageslist.filter((c) => {
      const id = c.details?.entity_id;
      if (c.conversationType !== "single" || !id || seen.has(id)) return false;
      if (!isUserOnline(activeUsers, id)) return false;
      seen.add(id);
      return true;
    });
  }, [messageslist, activeUsers]);

  const open = (c: IConversation) => navigate(`/messages/${c.conversationID}`);

  const actions: Action[] = [
    {
      icon: "edit_square",
      label: "New message",
      desc: "Chat with anyone",
      color: "var(--brand)",
      soft: "var(--brand-soft)",
      onClick: () => setComposing(true),
    },
    {
      icon: "group_add",
      label: "Create Group",
      desc: "Bring people together",
      color: "var(--green)",
      soft: "var(--green-soft)",
      onClick: onCreateGroup,
    },
    {
      icon: "lightbulb",
      label: "Share a thought",
      desc: "Post to your Thoughts",
      color: "var(--gold)",
      soft: "var(--gold-soft)",
      // The rail beside this pane owns the composer and your current thought.
      onClick: () =>
        window.dispatchEvent(new CustomEvent(OPEN_THOUGHT_COMPOSER_EVENT)),
    },
    {
      icon: "person_search",
      label: "Find people",
      desc: "Search people in Explore",
      color: "var(--pink)",
      soft: "var(--pink-soft)",
      onClick: () => navigate("/explore"),
    },
  ];

  const shownActive = allActive
    ? activeNow
    : activeNow.slice(0, ACTIVE_LIMIT);

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 24,
      }}
    >
      {composing && <NewMessageModal onClose={() => setComposing(false)} />}
      {/* Sits above the middle: the free height splits 2:3 above and below,
          since dead centre read as low. Spacers rather than justify-content,
          so a hub taller than the pane scrolls from its top instead of
          losing it. */}
      <div style={{ flex: "2 1 0" }} />
      <div
        style={{
          flex: "none",
          width: "min(460px, 100%)",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <IconTile icon="forum" color="var(--brand)" soft="var(--brand-soft)" />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: "var(--fs-section-title)",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: "var(--text)",
              }}
            >
              Start something
            </span>
            <span
              style={{ fontSize: "var(--fs-caption)", color: "var(--text-2)" }}
            >
              Pick a conversation from the list, or jump in below.
            </span>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 8,
          }}
        >
          {actions.map((a) => (
            <ActionTile key={a.label} action={a} />
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <SectionHead
            title="Active now"
            aside={
              !loading &&
              activeNow.length > ACTIVE_LIMIT && (
                <button
                  onClick={() => setAllActive((v) => !v)}
                  style={{
                    padding: 0,
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: "var(--fs-meta)",
                    fontWeight: 600,
                    color: "var(--brand)",
                  }}
                >
                  {allActive ? "Show less" : "See all"}
                </button>
              )
            }
          />
          {loading ? (
            <div style={{ display: "flex", gap: 12 }}>
              {Array.from({ length: 5 }, (_, i) => (
                <span
                  key={i}
                  className="cl-moment-skeleton"
                  style={{ width: 40, height: 40, borderRadius: "50%" }}
                />
              ))}
            </div>
          ) : activeNow.length === 0 ? (
            <span
              style={{ fontSize: "var(--fs-caption)", color: "var(--text-3)" }}
            >
              Nobody you chat with is online right now.
            </span>
          ) : (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                columnGap: 12,
                rowGap: 10,
              }}
            >
              {shownActive.map((c) => (
                <button
                  key={c.conversationID}
                  onClick={() => open(c)}
                  title={`Message ${c.details.display_name}`}
                  style={{
                    width: 52,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    padding: 0,
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                >
                  <Avatar
                    id={c.details.entity_id}
                    entityId={c.details.entity_id}
                    name={c.details.display_name}
                    src={
                      c.details.profile === "none" ? undefined : c.details.profile
                    }
                    size={40}
                    kind={c.details.type === "bot" ? "bot" : undefined}
                    // Rings the presence dot in the pane's colour, not a card's.
                    style={{ background: "var(--surface-2)" }}
                  />
                  <span
                    style={{
                      maxWidth: 52,
                      fontSize: "var(--fs-meta)",
                      color: "var(--text-2)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {c.details.display_name.split(" ")[0]}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <SectionHead
            title="Unread"
            aside={
              !loading &&
              unread.length > 0 && (
                <span
                  style={{ fontSize: "var(--fs-meta)", color: "var(--text-3)" }}
                >
                  {unread.length} chat{unread.length === 1 ? "" : "s"}
                </span>
              )
            }
          />
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-md)",
              boxShadow: "var(--shadow-sm)",
              padding: 4,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {loading ? (
              Array.from({ length: 3 }, (_, i) => <UnreadRowLoader key={i} />)
            ) : unread.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 8px",
                  fontSize: "var(--fs-caption)",
                  color: "var(--text-3)",
                }}
              >
                <Icon n="done_all" s={18} />
                You're all caught up.
              </div>
            ) : (
              <>
                {unread.slice(0, UNREAD_LIMIT).map((c) => {
                  const typing = istypinglist.some(
                    (t: any) => t.conversationID === c.conversationID,
                  );
                  return (
                    <UnreadRow
                      key={c.conversationID}
                      conversation={c}
                      me={me}
                      typing={typing}
                      onClick={() => open(c)}
                    />
                  );
                })}
                {unread.length > UNREAD_LIMIT && (
                  <span
                    style={{
                      padding: "6px 8px",
                      fontSize: "var(--fs-caption)",
                      color: "var(--text-3)",
                    }}
                  >
                    And {unread.length - UNREAD_LIMIT} more in the list.
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <div style={{ flex: "3 1 0" }} />
    </div>
  );
}

function IconTile({
  icon,
  color,
  soft,
  size = 34,
}: {
  icon: string;
  color: string;
  soft: string;
  size?: number;
}) {
  return (
    <span
      style={{
        width: size,
        height: size,
        flex: "none",
        borderRadius: "var(--r-sm)",
        background: soft,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon n={icon} s={17} c={color} />
    </span>
  );
}

function ActionTile({ action }: { action: Action }) {
  return (
    <button
      onClick={action.onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: 10,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-md)",
        boxShadow: "var(--shadow-sm)",
        textAlign: "left",
        cursor: "pointer",
        color: "inherit",
        transition: "box-shadow .18s var(--ease)",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.boxShadow = "var(--shadow-md)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.boxShadow = "var(--shadow-sm)")
      }
    >
      <IconTile
        icon={action.icon}
        color={action.color}
        soft={action.soft}
        size={32}
      />
      <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <span
          style={{
            fontSize: "var(--fs-label)",
            fontWeight: 700,
            color: "var(--text)",
          }}
        >
          {action.label}
        </span>
        <span
          style={{
            fontSize: "var(--fs-meta)",
            color: "var(--text-3)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {action.desc}
        </span>
      </span>
    </button>
  );
}

function SectionHead({ title, aside }: { title: string; aside?: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
      }}
    >
      <span
        style={{
          fontSize: "var(--fs-caption)",
          fontWeight: 700,
          color: "var(--text-2)",
        }}
      >
        {title}
      </span>
      {aside}
    </div>
  );
}

/** A compact conversation row - the hub's size, not the list's. */
function UnreadRow({
  conversation: c,
  me,
  typing,
  onClick,
}: {
  conversation: IConversation;
  me: string;
  typing: boolean;
  onClick: () => void;
}) {
  const last = lastMessagePreview(c, me);
  const ellipsis = {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  } as const;
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        width: "100%",
        padding: "7px 8px",
        border: "none",
        borderRadius: "var(--r-sm)",
        background: "transparent",
        textAlign: "left",
        cursor: "pointer",
        color: "inherit",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = "var(--surface-hover)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <Avatar
        id={c.details.display_name}
        // A group is not an entity and shows no dot - see MessageRow.
        entityId={c.conversationType === "single" ? c.details.entity_id : null}
        name={c.details.display_name}
        src={c.details.profile === "none" ? undefined : c.details.profile}
        size={30}
        kind={c.details.type === "bot" ? "bot" : undefined}
      />
      <span
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            minWidth: 0,
            fontSize: "var(--fs-body-sm)",
            fontWeight: 700,
            color: "var(--text)",
          }}
        >
          <span style={{ ...ellipsis, minWidth: 0 }}>
            {c.details.display_name}
          </span>
          {c.details.is_verified === true && (
            <Icon
              n="verified"
              s={13}
              c="var(--brand)"
              style={{ flex: "none" }}
            />
          )}
          <PageFlag is={c.details.realm_type === "page"} size={12} />
          <BotFlag is={c.details.type === "bot"} size={12} />
        </span>
        <span
          style={{
            ...ellipsis,
            fontSize: "var(--fs-caption)",
            color: typing ? "var(--brand)" : "var(--text-2)",
          }}
          {...(!typing && last.html
            ? { dangerouslySetInnerHTML: { __html: last.text } }
            : { children: typing ? "is typing…" : last.text })}
        />
      </span>
      <span
        style={{ fontSize: "var(--fs-micro)", color: "var(--text-3)", flex: "none" }}
      >
        {timestampLabel(c)}
      </span>
      <span
        style={{
          minWidth: 16,
          height: 16,
          padding: "0 4px",
          boxSizing: "border-box",
          borderRadius: 999,
          background: "var(--brand)",
          color: "#fff",
          fontSize: "var(--fs-micro)",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "none",
        }}
      >
        {c.unread}
      </span>
    </button>
  );
}

function UnreadRowLoader() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "7px 8px",
      }}
    >
      <span
        className="cl-moment-skeleton"
        style={{ width: 30, height: 30, borderRadius: "50%", flex: "none" }}
      />
      <span
        style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}
      >
        <span
          className="cl-moment-skeleton"
          style={{ width: "40%", height: 10, borderRadius: 999 }}
        />
        <span
          className="cl-moment-skeleton"
          style={{ width: "70%", height: 9, borderRadius: 999 }}
        />
      </span>
    </div>
  );
}

export default MessagesDefault;
