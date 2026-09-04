import { Avatar, BotFlag, Btn, Card, Icon } from "@/reusables/design";
import { SearchBotResult } from "@/reusables/vars/interfaces";
import { gradFor } from "./searchShared";

interface BotCardProps {
  bot: SearchBotResult;
  followBusy: boolean;
  onToggleFollow: (bot: SearchBotResult) => void;
  /** Card click - Search routes to the bot profile. */
  onOpen: (bot: SearchBotResult) => void;
  /** Rail mode pins the fixed 200px width; grid mode fills its cell. */
  rail?: boolean;
}

/**
 * A bot in search results.
 *
 * Built on RealmCard's frame - same banner, same footprint - so the three
 * sections read as one page rather than three designs. What differs is what a
 * bot actually is:
 *
 *  - ONE action, Follow. A bot cannot accept a contact request (no session to
 *    see one in, no accept endpoint to call), so offering Add would be a button
 *    that can only ever fail. The server says so with can_connect: false; this
 *    card simply never renders one.
 *  - The DESCRIPTION carries the meaning. People have a mutual count and realms
 *    have a member count, and neither has an equivalent - but one bot is
 *    indistinguishable from another without the line saying what it does, which
 *    defeats the point of finding it.
 */
function BotCard({ bot, followBusy, onToggleFollow, onOpen, rail }: BotCardProps) {
  const [gradA, gradB] = gradFor(bot.entity_id);

  return (
    <Card
      pad={0}
      hover
      style={{
        width: rail ? 200 : "100%",
        flex: rail ? "none" : undefined,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <button
        type="button"
        onClick={() => onOpen(bot)}
        aria-label={`Open ${bot.display_name}`}
        style={{
          width: "100%",
          height: 74,
          border: "none",
          padding: 0,
          cursor: "pointer",
          background: `linear-gradient(135deg, ${gradA}, ${gradB})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {bot.profile ? (
          <Avatar
            id={bot.entity_id}
            name={bot.display_name}
            src={bot.profile}
            size={44}
            shape="rounded"
          />
        ) : (
          <Icon n="smart_toy" s={30} c="#fff" />
        )}
      </button>

      <div style={{ padding: "10px 12px" }}>
        <button
          type="button"
          onClick={() => onOpen(bot)}
          style={{
            background: "transparent",
            border: "none",
            padding: 0,
            margin: 0,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            maxWidth: "100%",
            color: "inherit",
          }}
        >
          <span
            style={{
              fontWeight: 700,
              fontSize: "var(--fs-title)",
              color: "var(--text)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {bot.display_name}
          </span>
          {bot.is_verified && (
            <Icon n="verified" s={14} c="var(--brand)" style={{ flex: "none" }} />
          )}
          <BotFlag is />
        </button>

        <div
          style={{
            fontSize: "var(--fs-caption)",
            color: "var(--text-3)",
            margin: "2px 0 8px",
            // Two lines, then clip. A description is free text and a card in a
            // fixed-height rail cannot grow to fit one.
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: 32,
          }}
          title={bot.description || `@${bot.handle}`}
        >
          {bot.description || `@${bot.handle}`}
        </div>

        <Btn
          block
          size="sm"
          variant={bot.is_followed ? "soft" : "primary"}
          disabled={followBusy}
          onClick={() => onToggleFollow(bot)}
        >
          {bot.is_followed ? "Following" : "Follow"}
        </Btn>
      </div>
    </Card>
  );
}

export default BotCard;
