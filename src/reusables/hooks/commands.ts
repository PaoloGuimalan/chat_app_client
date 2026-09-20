/**
 * "/command" autocomplete in the composer.
 *
 * SHAPED LIKE MENTIONS, SOURCED DIFFERENTLY
 * -----------------------------------------
 * mentions.ts filters members the client already holds. A command is a row
 * the client has never seen - owned by a bot, with a description and a
 * responder - so the menu is FETCHED per conversation rather than derived.
 * The query/filter/insert trio below is deliberately the same shape as the
 * mention one, because the composer treats them identically once the
 * candidates exist.
 *
 * WHY THE SERVER SAYS WHAT TO INSERT
 * ----------------------------------
 * Two bots in one conversation can each own a "summarize". Inserting the bare
 * "/summarize" would run BOTH, which is the exact ambiguity the ":handle"
 * suffix exists to remove. The server knows every command in the room, so it
 * decides per entry whether the bare or targeted form is unambiguous and
 * sends it as `insert`. Nothing here second-guesses that.
 */

export interface ChatCommand {
  /** The bare name, without the leading slash. */
  name: string;
  description: string;
  /** "none" | "system" | "bot" - who answers, if anyone. */
  responds: string;
  /** The owning bot's handle, and its display name for the list. */
  bot: string;
  bot_name: string;
  /** A platform command rather than somebody's bot. */
  is_system: boolean;
  /** Exactly what to put in the composer, decided server-side. */
  insert: string;
}

/**
 * A "/query" in progress at the cursor, or null.
 *
 * ANYWHERE A WORD STARTS, matching the server's parser: "@juanlazy /sum" is
 * the case people actually type, and anchoring this to the start of the
 * message left the menu closed for it. The slash must follow whitespace or
 * begin the message, which is what keeps "and/or" and "/api/v1" from opening
 * anything.
 *
 * "//" is the escape hatch for writing a slash literally, and never opens the
 * menu.
 *
 * `start` is the index of the slash, so insertCommand replaces from there.
 */
export const activeCommandQuery = (
  value: string,
  cursorPosition: number = value.length,
): { start: number; query: string } | null => {
  const beforeCursor = value.slice(0, Math.max(0, cursorPosition));
  const match = beforeCursor.match(/(^|\s)\/([A-Za-z0-9-]*)$/);
  if (!match) return null;

  const start = beforeCursor.length - match[2].length - 1;
  // The escape hatch: a slash immediately before this one.
  if (start > 0 && beforeCursor[start - 1] === "/") return null;

  return { start, query: match[2] ?? "" };
};

/**
 * Entries matching the query, capped at 6 like the mention list.
 *
 * An empty query lists everything - typing "/" alone should show what is
 * available here, which is the whole point of a discoverable menu.
 *
 * A name match ranks above a description match: somebody typing "/mem" wants
 * /members, not a command that merely mentions members in its description.
 */
export const filterCommands = (
  commands: ChatCommand[],
  query: string,
): ChatCommand[] => {
  const normalized = query.trim().toLowerCase();

  const matches = commands.filter((command) => {
    if (!normalized) return true;
    return (
      command.name.toLowerCase().includes(normalized) ||
      (command.description || "").toLowerCase().includes(normalized)
    );
  });

  if (normalized) {
    matches.sort((a, b) => {
      const aName = a.name.toLowerCase().startsWith(normalized) ? 0 : 1;
      const bName = b.name.toLowerCase().startsWith(normalized) ? 0 : 1;
      return aName !== bName ? aName - bName : a.name.localeCompare(b.name);
    });
  }

  return matches.slice(0, 6);
};

/** What the list shows as the owner. */
export const commandOwnerLabel = (command: ChatCommand): string =>
  command.is_system ? "System" : command.bot_name || command.bot;

/**
 * The System bot, as every client and service agrees on it.
 *
 * A FIXED ID, NOT A LOOKUP - the same arrangement the moderator has, so every
 * service agrees who "the platform" is without a config value that drifts
 * between environments. Written by a migration (user_service, bot/migrations/
 * 0004_system_bot.py), so it exists everywhere the schema does.
 *
 * WHY A CLIENT HAS TO KNOW IT: System answers built-in commands in
 * conversations it is NOT a member of. It cannot be added to one, searched
 * for, or removed - which is exactly why its name cannot be resolved the
 * usual way, since every other sender is named by finding them in the
 * participant list.
 */
export const SYSTEM_BOT_ENTITY_ID = "00000000-0000-4000-8000-000000000002";
export const SYSTEM_BOT_DISPLAY_NAME = "System";

export const isSystemBot = (entityId?: string | null): boolean =>
  Boolean(entityId) && entityId === SYSTEM_BOT_ENTITY_ID;
