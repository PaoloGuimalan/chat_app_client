/**
 * A message's text, formatted.
 *
 * WHY THIS EXISTS
 * ---------------
 * Message bodies were rendered as one flat run of text. That was fine while
 * every message was typed by a person, and stopped being fine when bots
 * started answering in conversations and channels: a bot reply is model prose,
 * which means Markdown, and `**bold**`, fenced code, tables and numbered steps
 * all arrived as literal punctuation in the middle of a wall of text.
 *
 * REACT ELEMENTS, NOT AN HTML STRING
 * ----------------------------------
 * The previous renderer built an HTML string - escape, linkify, wrap mentions,
 * DOMPurify - and handed it to `dangerouslySetInnerHTML`. That was safe, and
 * the escaping was doing real work, but it is safe by construction here
 * instead: this file only ever puts message text in as an element child or a
 * validated `href`, so there is no path from message content to markup. No
 * sanitizer to keep configured, and a parsing bug can only ever look wrong
 * rather than execute.
 *
 * WHAT IT DELIBERATELY KEEPS FROM THE OLD PIPELINE
 * ------------------------------------------------
 *   * `@mentions` of conversation members, still carrying `cl-message-mention`
 *     so they pick up the same styling in both themes.
 *   * Bare URLs made clickable, still with `color: inherit` - see the note on
 *     the link rule for why they must not be given a colour of their own.
 *
 * EVERY BLOCK ELEMENT CARRIES `tw-m-0`
 * -------------------------------------
 * This app has no CSS reset: `tailwind.config.js` sets `preflight: false` and
 * `@tailwind base` is commented out of index.css. So browser defaults are
 * live - `p` has `margin: 1em 0`, `ul`/`ol` have `padding-left: 40px`,
 * `blockquote` has `margin: 1em 40px`, `pre` and `hr` have margins of their
 * own. The renderer this replaced emitted a single inline `<span>`, which has
 * none of those, so the defaults never showed; the first version of this file
 * emitted a `<p>` and opened a ~16px gap above and below every message.
 *
 * Spacing between blocks is the container's `gap`, so each block is reset
 * explicitly. `important: true` is set in the Tailwind config, which is what
 * makes a utility class reliably beat a browser default here.
 *
 * EMPHASIS IS FLANKING-AWARE, BECAUSE PEOPLE TYPE HERE
 * ----------------------------------------------------
 * This renders human chat, not just model output, so a naive `\*(.+?)\*` is
 * not acceptable: "it cost 5 * 3 * 4 pesos" would come out with " 3 " in
 * italics. Every emphasis rule therefore requires its delimiters to hug
 * non-whitespace, the way CommonMark's flanking rules do. That is the single
 * biggest source of false positives in a chat app and it is worth the extra
 * characters in each pattern.
 */
import { Fragment, ReactNode, useMemo } from "react";

/**
 * Just the parts of a conversation member this file reads.
 *
 * Typed rather than `any` - the shape is only ever used to derive a display
 * name, and both fields are optional because the two message shells disagree
 * about which one they populate.
 */
export type MessageMember = {
  userID?: string;
  fullname?: { firstName?: string };
};

/** Protocols we will turn into a real link. */
const SAFE_LINK = /^(https?:\/\/|mailto:)/i;

/**
 * Styling is expressed against `currentColor`, never in fixed colours.
 *
 * A bubble is either the theme colour with white text (your own messages) or
 * `var(--surface)` with `var(--text)` (everyone else's), in either light or
 * dark mode. A fixed grey that reads correctly on white is invisible on the
 * theme colour, so every tint here is mixed from the text colour already in
 * force and works on all four combinations without a single conditional.
 */
const TINT = (percent: number) =>
  `color-mix(in srgb, currentColor ${percent}%, transparent)`;

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getDisplayName = (member: MessageMember) =>
  member?.userID || member?.fullname?.firstName || "someone";

/**
 * The same mention matcher the HTML pipeline used, with one change: NO `g`
 * flag.
 *
 * `exec` on a global regex advances `lastIndex` on the object itself, and the
 * walker below runs every pattern against many different substrings - so a
 * sticky index would make matches start skipping text unpredictably. Every
 * pattern in this file is non-global for that reason.
 */
const buildMentionRegex = (members: MessageMember[]) => {
  const labels = members
    .map((member) => getDisplayName(member))
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map((label) => escapeRegExp(label));

  if (labels.length === 0) return null;
  return new RegExp(`(^|\\s)@(${labels.join("|")})(?=(?:\\s|[.,!?;:])|$)`);
};

// ------------------------------------------------------------------ inline --

type InlineRule = {
  pattern: RegExp;
  render: (match: RegExpExecArray, key: string, ctx: Ctx) => ReactNode;
};

type Ctx = { rules: InlineRule[] };

const linkStyle = { color: "inherit" } as const;
const linkClass = "tw-underline tw-underline-offset-2 tw-break-words";

/**
 * Order matters. Inline code comes first so backticks win over the emphasis
 * characters inside them - `` `a*b*c` `` is code containing asterisks, not code
 * containing italics - and `**` before `*` so the bold rule claims its own
 * delimiters before the italic rule can eat half of one.
 */
const BASE_RULES: InlineRule[] = [
  {
    pattern: /`([^`\n]+)`/,
    render: (m, key) => (
      <code
        key={key}
        className="tw-rounded-[4px] tw-px-[5px] tw-py-[1px] tw-font-mono tw-text-[0.9em] tw-break-words"
        style={{ background: TINT(12) }}
      >
        {m[1]}
      </code>
    ),
  },
  {
    // `(?!\s)` opens on non-space and `[^\s*]` closes on non-space: the
    // flanking requirement described in the file header.
    pattern: /\*\*(?!\s)([^\n]*?[^\s*])\*\*/,
    render: (m, key, ctx) => (
      <strong key={key}>{renderInline(m[1], `${key}-i`, ctx)}</strong>
    ),
  },
  {
    pattern: /__(?!\s)([^\n]*?[^\s_])__/,
    render: (m, key, ctx) => (
      <strong key={key}>{renderInline(m[1], `${key}-i`, ctx)}</strong>
    ),
  },
  {
    pattern: /~~(?!\s)([^\n]*?[^\s~])~~/,
    render: (m, key, ctx) => (
      <del key={key}>{renderInline(m[1], `${key}-i`, ctx)}</del>
    ),
  },
  {
    // Single `*`. `[^*\n]*[^\s*]` cannot start or end on whitespace, which is
    // what keeps "5 * 3 * 4" out of italics.
    pattern: /\*(?!\s)([^*\n]*[^\s*])\*/,
    render: (m, key, ctx) => (
      <em key={key}>{renderInline(m[1], `${key}-i`, ctx)}</em>
    ),
  },
  {
    // `_italic_` only at a non-word boundary, so snake_case_identifiers - far
    // more common here than underscore emphasis - survive intact.
    //
    // The boundary is CAPTURED and re-emitted rather than matched with a
    // lookbehind: lookbehind is a parse-time syntax error on Safari before
    // 16.4, and one bad regex takes down the whole bundle, not just this
    // component.
    pattern: /(^|\W)_(?!\s)([^_\n]*[^\s_])_(?=\W|$)/,
    render: (m, key, ctx) => (
      <Fragment key={key}>
        {m[1]}
        <em>{renderInline(m[2], `${key}-i`, ctx)}</em>
      </Fragment>
    ),
  },
  {
    pattern: /\[([^\]\n]*)\]\(([^)\s]+)\)/,
    render: (m, key) => {
      const [, text, href] = m;
      // A `javascript:` or `data:` href is an injection wearing Markdown
      // syntax. Left as the literal text the sender typed.
      if (!SAFE_LINK.test(href)) return <Fragment key={key}>{m[0]}</Fragment>;
      return (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className={linkClass}
          style={linkStyle}
        >
          {text || href}
        </a>
      );
    },
  },
  {
    // Bare URLs, matching what `urlify` did before.
    //
    // `color: inherit`, deliberately, and not a link colour: your own messages
    // sit on the theme colour with white text, where a blue link is
    // unreadable. The underline is what marks it as a link instead.
    pattern: /(^|\s)(https?:\/\/[^\s<>()]+[^\s<>().,;:!?])/,
    render: (m, key) => (
      <Fragment key={key}>
        {m[1]}
        <a
          href={m[2]}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className={linkClass}
          style={linkStyle}
        >
          {m[2]}
        </a>
      </Fragment>
    ),
  },
];

/**
 * Inline markup inside one block of text.
 *
 * Finds whichever rule matches EARLIEST rather than applying each rule over
 * the whole string in turn. Sequential application would let a later rule
 * reach inside an earlier one's output, which is exactly how a code span
 * containing asterisks ends up italicised.
 */
function renderInline(text: string, keyPrefix: string, ctx: Ctx): ReactNode[] {
  const out: ReactNode[] = [];
  let rest = text;
  let index = 0;

  while (rest) {
    let earliest: { at: number; match: RegExpExecArray; rule: InlineRule } | null =
      null;

    for (const rule of ctx.rules) {
      const match = rule.pattern.exec(rest);
      if (match && (earliest === null || match.index < earliest.at)) {
        earliest = { at: match.index, match, rule };
      }
    }

    if (earliest === null) {
      out.push(...withLineBreaks(rest, `${keyPrefix}-t${index}`));
      break;
    }

    if (earliest.at > 0) {
      out.push(
        ...withLineBreaks(rest.slice(0, earliest.at), `${keyPrefix}-t${index}`),
      );
    }
    out.push(earliest.rule.render(earliest.match, `${keyPrefix}-m${index}`, ctx));
    rest = rest.slice(earliest.at + earliest.match[0].length);
    index += 1;
  }

  return out;
}

/**
 * Single newlines inside a block, kept visible.
 *
 * This is what `tw-whitespace-pre-line` used to do for the whole bubble. It is
 * done here instead because the bubble now contains block elements, and
 * `pre-line` on a container full of paragraphs and lists doubles their
 * spacing.
 */
function withLineBreaks(text: string, keyPrefix: string): ReactNode[] {
  return text
    .split("\n")
    .flatMap((line, i) =>
      i === 0
        ? [<Fragment key={`${keyPrefix}-l${i}`}>{line}</Fragment>]
        : [
            <br key={`${keyPrefix}-br${i}`} />,
            <Fragment key={`${keyPrefix}-l${i}`}>{line}</Fragment>,
          ],
    );
}

// ------------------------------------------------------------------- block --

const FENCE = /^```(\w*)\s*$/;
const HEADING = /^(#{1,6})\s+(.*)$/;
const BULLET = /^\s*[-*+]\s+(.*)$/;
const NUMBERED = /^\s*(\d+)[.)]\s+(.*)$/;
const QUOTE = /^>\s?(.*)$/;
const RULE = /^\s*([-*_])(?:\s*\1){2,}\s*$/;
const TABLE_DIVIDER = /^\s*\|?[\s:|-]+\|[\s:|-]*$/;

// Rendered as `div`s, not `h1`-`h6`: a message is not a document outline, and
// without a reset the real heading tags would each bring their own margin and
// font-size. If these ever become real headings, they need `tw-m-0` too.
const HEADING_SIZES = [
  "tw-text-[1.25em] tw-font-bold",
  "tw-text-[1.15em] tw-font-bold",
  "tw-text-[1.08em] tw-font-semibold",
  "tw-text-[1em] tw-font-semibold",
  "tw-text-[1em] tw-font-semibold",
  "tw-text-[0.95em] tw-font-semibold tw-uppercase tw-tracking-wide",
];

const splitRow = (line: string) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());

function renderBlocks(source: string, ctx: Ctx): ReactNode[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;
  const next = () => `b${key++}`;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i += 1;
      continue;
    }

    // --- fenced code ------------------------------------------------------
    const fence = FENCE.exec(line);
    if (fence) {
      const language = fence[1];
      const body: string[] = [];
      i += 1;
      while (i < lines.length && !FENCE.test(lines[i])) {
        body.push(lines[i]);
        i += 1;
      }
      // An unterminated fence is common in a truncated reply; what follows is
      // still shown as code rather than dropped.
      i += 1;
      blocks.push(
        <div
          key={next()}
          className="tw-overflow-hidden tw-rounded-[8px]"
          style={{ background: TINT(10), border: `1px solid ${TINT(18)}` }}
        >
          {language && (
            <div
              className="tw-px-[10px] tw-pt-[6px] tw-font-mono tw-text-[10px] tw-uppercase tw-tracking-wide"
              style={{ opacity: 0.65 }}
            >
              {language}
            </div>
          )}
          <pre className="tw-m-0 tw-overflow-x-auto tw-px-[10px] tw-py-[8px]">
            <code className="tw-whitespace-pre tw-font-mono tw-text-[0.88em] tw-leading-[1.55]">
              {body.join("\n")}
            </code>
          </pre>
        </div>,
      );
      continue;
    }

    // --- horizontal rule --------------------------------------------------
    if (RULE.test(line)) {
      blocks.push(
        <hr
          key={next()}
          className="tw-mx-0 tw-my-[2px] tw-border-0 tw-border-t"
          style={{ borderColor: TINT(25) }}
        />,
      );
      i += 1;
      continue;
    }

    // --- heading ----------------------------------------------------------
    const heading = HEADING.exec(line);
    if (heading) {
      blocks.push(
        <div key={next()} className={HEADING_SIZES[heading[1].length - 1]}>
          {renderInline(heading[2], `h${key}`, ctx)}
        </div>,
      );
      i += 1;
      continue;
    }

    // --- table ------------------------------------------------------------
    // Requires the divider row, so a single line that merely contains a pipe
    // is not mistaken for one.
    if (
      line.includes("|") &&
      i + 1 < lines.length &&
      TABLE_DIVIDER.test(lines[i + 1])
    ) {
      const header = splitRow(line);
      i += 2;
      const rows: string[][] = [];
      while (
        i < lines.length &&
        lines[i].includes("|") &&
        lines[i].trim() !== ""
      ) {
        rows.push(splitRow(lines[i]));
        i += 1;
      }
      const cell = { border: `1px solid ${TINT(25)}` };
      blocks.push(
        <div key={next()} className="tw-overflow-x-auto">
          <table className="tw-m-0 tw-border-collapse tw-text-[0.92em]">
            <thead>
              <tr>
                {header.map((text, c) => (
                  <th
                    key={c}
                    className="tw-px-[8px] tw-py-[5px] tw-text-left tw-font-semibold"
                    style={{ ...cell, background: TINT(8) }}
                  >
                    {renderInline(text, `th${key}-${c}`, ctx)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, r) => (
                <tr key={r}>
                  {header.map((_, c) => (
                    <td
                      key={c}
                      className="tw-px-[8px] tw-py-[5px] tw-align-top"
                      style={cell}
                    >
                      {renderInline(row[c] ?? "", `td${key}-${r}-${c}`, ctx)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    // --- blockquote -------------------------------------------------------
    if (QUOTE.test(line)) {
      const body: string[] = [];
      while (i < lines.length && QUOTE.test(lines[i])) {
        body.push(QUOTE.exec(lines[i])![1]);
        i += 1;
      }
      blocks.push(
        <blockquote
          key={next()}
          className="tw-m-0 tw-border-l-[3px] tw-pl-[10px] tw-italic"
          style={{ borderColor: TINT(35), opacity: 0.85 }}
        >
          {renderInline(body.join("\n"), `q${key}`, ctx)}
        </blockquote>,
      );
      continue;
    }

    // --- lists ------------------------------------------------------------
    if (BULLET.test(line) || NUMBERED.test(line)) {
      const ordered = !BULLET.test(line) && NUMBERED.test(line);
      const items: string[] = [];
      // A list ends at the first line that is not an item of the SAME kind, so
      // a bulleted list right after a numbered one stays two lists.
      while (i < lines.length) {
        const bullet = BULLET.exec(lines[i]);
        const numbered = NUMBERED.exec(lines[i]);
        if (!ordered && bullet) items.push(bullet[1]);
        else if (ordered && numbered) items.push(numbered[2]);
        else if (
          items.length &&
          lines[i].startsWith("  ") &&
          lines[i].trim() !== ""
        ) {
          // A wrapped continuation line belongs to the item above it.
          items[items.length - 1] += `\n${lines[i].trim()}`;
        } else break;
        i += 1;
      }

      const ListTag = ordered ? "ol" : "ul";
      blocks.push(
        <ListTag
          key={next()}
          start={ordered ? Number(NUMBERED.exec(line)![1]) : undefined}
          className={`${
            ordered ? "tw-list-decimal" : "tw-list-disc"
          } tw-m-0 tw-flex tw-flex-col tw-gap-[2px] tw-pl-[20px]`}
        >
          {items.map((item, index) => (
            <li key={index} className="tw-leading-[1.5]">
              {renderInline(item, `li${key}-${index}`, ctx)}
            </li>
          ))}
        </ListTag>,
      );
      continue;
    }

    // --- paragraph --------------------------------------------------------
    const body: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !FENCE.test(lines[i]) &&
      !HEADING.test(lines[i]) &&
      !QUOTE.test(lines[i]) &&
      !RULE.test(lines[i]) &&
      !BULLET.test(lines[i]) &&
      !NUMBERED.test(lines[i])
    ) {
      body.push(lines[i]);
      i += 1;
    }
    blocks.push(
      <p key={next()} className="tw-m-0 tw-break-words tw-leading-[1.5]">
        {renderInline(body.join("\n"), `p${key}`, ctx)}
      </p>,
    );
  }

  return blocks;
}

/**
 * One message body.
 *
 * `content` is untrusted - it is whatever another person or another service's
 * bot sent - and is only ever placed as an element child or as an `href` that
 * passed `SAFE_LINK`.
 */
function MessageContent({
  content,
  members = [],
  className = "",
}: {
  content: string;
  members?: MessageMember[];
  className?: string;
}) {
  // Rebuilt only when the member list changes: the mention pattern is derived
  // from every member's display name, and rebuilding it per message would mean
  // recompiling one regex per bubble on every render.
  const ctx = useMemo<Ctx>(() => {
    const mentionRegex = buildMentionRegex(members);
    if (!mentionRegex) return { rules: BASE_RULES };

    const mentionRule: InlineRule = {
      pattern: mentionRegex,
      render: (m, key) => (
        <Fragment key={key}>
          {m[1]}
          <span className="cl-message-mention">@{m[2]}</span>
        </Fragment>
      ),
    };
    // After the code rule, so an @name inside a code span stays literal.
    return { rules: [BASE_RULES[0], mentionRule, ...BASE_RULES.slice(1)] };
  }, [members]);

  if (!content?.trim()) return null;

  return (
    <div className={`tw-flex tw-flex-col tw-gap-[6px] ${className}`}>
      {renderBlocks(content, ctx)}
    </div>
  );
}

export default MessageContent;
