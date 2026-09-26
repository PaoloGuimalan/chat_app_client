import { CSSProperties } from "react";
import { BiSolidPhoneCall } from "react-icons/bi";
import { Avatar, BotFlag, Icon, PageFlag } from "@/reusables/design";

// A conversation as one row in the conversation list. The text under the
// title comes from ./conversationPreview, which the action hub's compact
// Unread rows (MessagesDefault) share, so both say the same thing.
function MessageRow({
  imgSrc,
  title,
  titleColor,
  titleIcon,
  subtitle,
  subtitleColor,
  subtitleHtml,
  time,
  unread,
  entityId,
  showCall,
  active,
  onClick,
  style,
  isBadged,
  isPage,
  isBot,
}: {
  imgSrc: string | null | undefined;
  title: string;
  titleColor?: string;
  titleIcon?: string;
  /** Verified badge. One flag for both kinds of counterpart - the server
   *  normalises an account's is_badged and a realm's is_verified. */
  isBadged?: boolean;
  /** Counterpart is a PAGE. Same flag the Network/Contacts rows already put
   *  on a page connection, so a page reads the same wherever it appears. */
  isPage?: boolean;
  /** Counterpart is a BOT. Drives both the glyph beside the title and the
   *  avatar's fallback, so a bot with no picture shows the robot rather than
   *  initials cut from its name. */
  isBot?: boolean;
  subtitle: string;
  subtitleColor?: string;
  subtitleHtml?: boolean;
  time: string;
  unread: number;
  /**
   * The counterpart entity, for the avatar's presence dot. Omitted for a group
   * row - a group is not an entity and cannot be online, and the header says
   * "Members are Active" instead.
   *
   * Replaces a `showOnline` boolean the two call sites resolved themselves.
   * One of them resolved it from `users[]._id`, which is the ACCOUNT id, while
   * the presence list is keyed by entity id - so the dot on a DM row never lit,
   * whatever the counterpart was doing.
   */
  entityId?: string | null;
  showCall?: boolean;
  active?: boolean;
  onClick: () => void;
  style?: CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        width: "100%",
        padding: "9px 10px",
        border: "1px solid",
        borderColor: active ? "var(--brand-soft)" : "transparent",
        borderRadius: "var(--r-md)",
        cursor: "pointer",
        textAlign: "left",
        background: active ? "var(--brand-soft)" : "transparent",
        boxShadow: active ? "var(--shadow-sm)" : "none",
        transition: "background .14s",
        ...style,
      }}
      onMouseEnter={(e) =>
        !active && (e.currentTarget.style.background = "var(--surface-hover)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = active
          ? "var(--brand-soft)"
          : "transparent")
      }
    >
      <div style={{ position: "relative", flex: "none" }}>
        <Avatar
          id={title}
          entityId={entityId}
          name={title}
          src={imgSrc || undefined}
          size={40}
          kind={isBot ? "bot" : undefined}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              color: titleColor || "var(--text)",
              fontWeight: 700,
              fontSize: "var(--fs-body)",
              minWidth: 0,
            }}
          >
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                minWidth: 0,
              }}
            >
              {title}
            </span>
            {titleIcon && <Icon n={titleIcon} s={15} c={titleColor} />}
            {isBadged && (
              <Icon
                n="verified"
                s={14}
                c="var(--brand)"
                style={{ flex: "none" }}
              />
            )}
            <PageFlag is={isPage} />
            <BotFlag is={isBot} />
          </div>
          <div
            style={{
              fontSize: "var(--fs-meta)",
              color: "var(--text-3)",
              flex: "none",
            }}
          >
            {time}
          </div>
        </div>
        <div
          style={{
            fontSize: "var(--fs-label)",
            color: subtitleColor || "var(--text-2)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginTop: 1,
          }}
          {...(subtitleHtml
            ? { dangerouslySetInnerHTML: { __html: subtitle } }
            : { children: subtitle })}
        />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 4,
          flex: "none",
        }}
      >
        {unread > 0 && (
          <span
            style={{
              minWidth: 18,
              height: 18,
              padding: "0 5px",
              background: "var(--brand)",
              color: "#fff",
              fontSize: "var(--fs-meta)",
              fontWeight: 700,
              borderRadius: 999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {unread}
          </span>
        )}
        {showCall && <BiSolidPhoneCall color="var(--green)" />}
      </div>
    </button>
  );
}

export default MessageRow;
