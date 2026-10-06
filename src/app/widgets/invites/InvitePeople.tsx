/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import { Avatar, Btn, Icon, PageFlag, SegTabs } from "@/reusables/design";
import {
  CreateRealmInviteRequest,
  EntitySuggestRequest,
  GetRealmInviteRequest,
  UpdateRealmInviteRequest,
} from "@/reusables/hooks/requests";
import { resolveErrorMessage } from "@/reusables/hooks/errormessages";
import { EntitySearchResult } from "@/reusables/vars/interfaces";
import {
  entityDisplay,
  InvitableRealmType,
  IRealmInvite,
  invitePurposeLabel,
} from "./invites";
import "@/styles/styles.css";

/**
 * Invite people into a realm by email or by username - the one panel every
 * realm screen uses (members tab, conference room, page team).
 *
 * They are not added: they get an invite they accept or decline (Django
 * community/invites.py). An email nobody has signed up with yet is emailed a
 * link, and the invite waits for them.
 *
 * Typing a name suggests people the way tagging a post does - pick one or
 * several, then Invite. Typing an email suggests nothing: an address is sent
 * as typed, whoever it belongs to.
 *
 * A page invites in two ways - to follow it, or to help run it as an admin or
 * a moderator - so it carries the two choices; every other realm has one.
 */
export interface InvitePeopleProps {
  realmId: string;
  realmType: InvitableRealmType;
  realmName: string;
  /** Show the invites still waiting for an answer, with Revoke. */
  showPending?: boolean;
  /** Told after every invite sent - e.g. to clear a contacts picker. */
  onInvited?: (invite: IRealmInvite) => void;
  /** Bump to re-read the pending list - after invites sent from elsewhere on
   *  the screen, such as the contacts picker. */
  reloadKey?: number;
  /** Entity ids already in the realm: suggested as "Member", not pickable. */
  excludeIDs?: string[];
}

type PagePurpose = "follow" | "manage";
type Feedback = { tone: "ok" | "muted" | "error"; text: string };

/** Started typing an address - "maya@", "maya@mail.com". A leading "@" is a
 *  username. */
const looksLikeEmail = (value: string) => /^[^@\s]+@/.test(value.trim());

const SUGGEST_DELAY_MS = 250;

/** "A", "A and B", "A, B and C". */
const listNames = (names: string[]) =>
  names.length <= 1
    ? (names[0] ?? "")
    : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

function InvitePeople({
  realmId,
  realmType,
  realmName,
  showPending = true,
  onInvited,
  reloadKey = 0,
  excludeIDs = [],
}: InvitePeopleProps) {
  const [target, setTarget] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [pagePurpose, setPagePurpose] = useState<PagePurpose>("follow");
  const [role, setRole] = useState<"moderator" | "admin">("moderator");
  const [pending, setPending] = useState<IRealmInvite[]>([]);
  const [revoking, setRevoking] = useState<string | null>(null);

  // People picked from the suggestions, invited together on Invite.
  const [picked, setPicked] = useState<EntitySearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<EntitySearchResult[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const isPage = realmType === "page";

  const loadPending = () => {
    if (!showPending) return;
    GetRealmInviteRequest({ realm_id: realmId, kind: "invite", status: "pending" })
      .then((response) => setPending(response?.result ?? []))
      // No permission to see them (a plain member of a page, say) is not an
      // error worth showing - the list simply stays empty.
      .catch(() => setPending([]));
  };

  useEffect(loadPending, [realmId, showPending, reloadKey]);

  // A page's team is people; anything else can also take a page as a member,
  // as the contacts picker allows. Never bots - the server refuses them.
  const suggestTypes = isPage && pagePurpose === "manage" ? "user" : "user,realm";

  const query = target.trim().replace(/^@/, "");
  const wantsSuggestions = query !== "" && !looksLikeEmail(target);

  useEffect(() => {
    if (!wantsSuggestions) {
      setSuggestions([]);
      setSuggesting(false);
      return;
    }
    const controller = new AbortController();
    setSuggesting(true);
    const timer = window.setTimeout(() => {
      EntitySuggestRequest(query, { types: suggestTypes, signal: controller.signal })
        .then((results) => {
          setSuggestions(results.filter((r) => r.type !== "bot"));
          setActiveIndex(-1);
        })
        .catch(() => {
          if (!controller.signal.aborted) setSuggestions([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setSuggesting(false);
        });
    }, SUGGEST_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, wantsSuggestions, suggestTypes]);

  const isPicked = (entity: EntitySearchResult) =>
    picked.some((p) => p.entity_id === entity.entity_id);
  const isMember = (entity: EntitySearchResult) =>
    excludeIDs.includes(entity.entity_id);

  const pick = (entity: EntitySearchResult) => {
    if (isMember(entity)) return;
    setPicked((prev) =>
      isPicked(entity)
        ? prev.filter((p) => p.entity_id !== entity.entity_id)
        : [...prev, entity],
    );
    // Cleared for the next name, as tagging a post does.
    setTarget("");
    setSuggestions([]);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const unpick = (entity: EntitySearchResult) =>
    setPicked((prev) => prev.filter((p) => p.entity_id !== entity.entity_id));

  const showSuggestions = suggestOpen && wantsSuggestions;

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && target === "" && picked.length > 0) {
      setPicked((prev) => prev.slice(0, -1));
      return;
    }
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      // Picks the highlighted person rather than submitting the form.
      e.preventDefault();
      pick(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setSuggestOpen(false);
    }
  };

  /** Shared with the contacts picker - see sendTo. */
  const purposeFields = () =>
    isPage
      ? {
          purpose: pagePurpose,
          ...(pagePurpose === "manage" ? { role } : {}),
        }
      : {};

  const sendTo = (fields: Record<string, string>) =>
    CreateRealmInviteRequest({
      realm_id: realmId,
      kind: "invite",
      ...purposeFields(),
      ...fields,
    });

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    const value = target.trim();
    if ((!value && picked.length === 0) || sending) return;
    setSending(true);
    setFeedback([]);
    setSuggestOpen(false);

    const lines: Feedback[] = [];
    const sent: string[] = [];
    const waiting: string[] = [];
    const keep: EntitySearchResult[] = [];

    // The people picked from the suggestions, by entity - a page has no
    // username to look up.
    const results = await Promise.allSettled(
      picked.map((entity) => sendTo({ target_entity_id: entity.entity_id })),
    );
    results.forEach((result, i) => {
      const entity = picked[i];
      if (result.status === "fulfilled") {
        (result.value?.already_invited ? waiting : sent).push(entity.display_name);
        if (result.value?.result) onInvited?.(result.value.result);
      } else {
        keep.push(entity);
        lines.push({
          tone: "error",
          text: `${entity.display_name}: ${resolveErrorMessage(
            result.reason,
            "We couldn't send that invite.",
          )}`,
        });
      }
    });

    // Whatever is still typed - an email, or a username nobody picked.
    let typedFailed = false;
    if (value) {
      try {
        const response = await sendTo({ target: value });
        const invite: IRealmInvite | undefined = response?.result;
        const who = invite?.target_entity
          ? `@${entityDisplay(invite.target_entity).handle ?? value}`
          : value;
        if (response?.already_invited) waiting.push(who);
        else if (invite?.target_entity) sent.push(who);
        else
          lines.push({
            tone: "ok",
            text: `Invite emailed to ${who}. It waits for them if they're new.`,
          });
        if (invite) onInvited?.(invite);
      } catch (err) {
        typedFailed = true;
        lines.push({
          tone: "error",
          text: resolveErrorMessage(err, "We couldn't send that invite."),
        });
      }
    }

    if (sent.length > 0) {
      lines.unshift({
        tone: "ok",
        text: `${sent.length === 1 ? "Invite" : "Invites"} sent to ${listNames(sent)}.`,
      });
    }
    if (waiting.length > 0) {
      lines.push({
        tone: "muted",
        text: `${listNames(waiting)} ${
          waiting.length === 1 ? "already has an invite" : "already have invites"
        } waiting.`,
      });
    }

    setFeedback(lines);
    // Failures stay, to fix or remove; everything that went is cleared.
    setPicked(keep);
    if (!typedFailed) setTarget("");
    setSending(false);
    loadPending();
  };

  const revoke = async (invite: IRealmInvite) => {
    setRevoking(invite.invite_token);
    try {
      await UpdateRealmInviteRequest({
        invite_token: invite.invite_token,
        status: "revoked",
      });
      setPending((prev) => prev.filter((p) => p.id !== invite.id));
    } catch (err) {
      setFeedback([
        {
          tone: "error",
          text: resolveErrorMessage(err, "We couldn't revoke that invite."),
        },
      ]);
    } finally {
      setRevoking(null);
    }
  };

  const intro = isPage
    ? pagePurpose === "follow"
      ? `Invite people to follow ${realmName}.`
      : `Invite people to help run ${realmName}. They join its team once they accept.`
    : `They're added to ${realmName} once they accept.`;

  const canSend = (target.trim() !== "" || picked.length > 0) && !sending;

  return (
    <div className="cl-invite-people">
      <div className="cl-invite-people__head">
        <Icon n="person_add" s={19} c="var(--brand)" />
        <span className="cl-invite-people__title">Invite people</span>
      </div>
      <p className="cl-invite-people__intro">{intro}</p>

      {isPage && (
        <div className="cl-invite-people__choices">
          <SegTabs
            tabs={[
              { key: "follow", label: "Follow" },
              { key: "manage", label: "Help run" },
            ]}
            value={pagePurpose}
            onChange={(k) => setPagePurpose(k as PagePurpose)}
          />
          {pagePurpose === "manage" && (
            <SegTabs
              tabs={[
                { key: "moderator", label: "Moderator" },
                { key: "admin", label: "Admin" },
              ]}
              value={role}
              onChange={(k) => setRole(k as "moderator" | "admin")}
            />
          )}
        </div>
      )}

      {picked.length > 0 && (
        <div className="cl-tag-chips">
          {picked.map((entity) => (
            <span className="cl-tag-chip" key={entity.entity_id}>
              <Avatar
                id={entity.entity_id}
                entityId={entity.entity_id}
                name={entity.display_name}
                src={entity.profile ?? undefined}
                size={20}
                kind={entity.type}
                shape={entity.type === "user" ? "circle" : "rounded"}
              />
              <span className="cl-tag-chip__name">{entity.display_name}</span>
              {entity.is_verified && (
                <RiVerifiedBadgeFill
                  size={13}
                  color="var(--brand)"
                  style={{ flexShrink: 0 }}
                />
              )}
              <PageFlag realmType={entity.realm_type} size={12} />
              <button
                type="button"
                disabled={sending}
                onClick={() => unpick(entity)}
                aria-label={`Remove ${entity.display_name}`}
              >
                <Icon n="close" s={13} />
              </button>
            </span>
          ))}
        </div>
      )}

      <form className="cl-invite-people__form" onSubmit={submit}>
        <div className="cl-invite-people__field">
          <Icon n="alternate_email" s={17} c="var(--text-3)" />
          <input
            ref={inputRef}
            value={target}
            onChange={(e) => {
              setTarget(e.target.value);
              setSuggestOpen(true);
            }}
            onFocus={() => setSuggestOpen(true)}
            onBlur={() => setSuggestOpen(false)}
            onKeyDown={onKeyDown}
            placeholder={
              picked.length > 0 ? "Add another, or an email" : "Name, @username or email"
            }
            aria-label="Name, username or email to invite"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showSuggestions}
            aria-controls={listId}
            aria-activedescendant={
              showSuggestions && activeIndex >= 0
                ? `${listId}-${activeIndex}`
                : undefined
            }
            autoComplete="off"
            spellCheck={false}
            disabled={sending}
          />
        </div>
        <Btn type="submit" disabled={!canSend}>
          {sending ? "Sending…" : "Invite"}
        </Btn>
      </form>

      {showSuggestions && (
        <div
          className="cl-invite-people__suggest thinscroller"
          id={listId}
          role="listbox"
          aria-label="People to invite"
          // Keeps the input focused, so picking does not first close the list.
          onMouseDown={(e) => e.preventDefault()}
        >
          {suggesting && suggestions.length === 0 ? (
            <div className="cl-tag-loading">Searching…</div>
          ) : suggestions.length === 0 ? (
            <div className="cl-tag-empty">
              No one found. Type their email to invite them.
            </div>
          ) : (
            suggestions.map((entity, i) => {
              const member = isMember(entity);
              const selected = isPicked(entity);
              return (
                <button
                  type="button"
                  key={entity.entity_id}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={selected}
                  aria-disabled={member}
                  disabled={member}
                  onClick={() => pick(entity)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`cl-tag-result ${
                    selected || i === activeIndex ? "cl-tag-result--active" : ""
                  } ${member ? "cl-invite-people__suggest--member" : ""}`}
                >
                  <Avatar
                    id={entity.entity_id}
                    entityId={entity.entity_id}
                    name={entity.display_name}
                    src={entity.profile ?? undefined}
                    size={34}
                    kind={entity.type}
                    shape={entity.type === "user" ? "circle" : "rounded"}
                  />
                  <div className="cl-tag-result__meta">
                    <span className="cl-tag-result__title">
                      <span className="cl-tag-result__name">
                        {entity.display_name}
                      </span>
                      {entity.is_verified && (
                        <RiVerifiedBadgeFill
                          size={14}
                          color="var(--brand)"
                          style={{ flexShrink: 0 }}
                        />
                      )}
                      <PageFlag realmType={entity.realm_type} size={14} />
                    </span>
                    <span className="cl-tag-result__handle">
                      {member
                        ? "Already a member"
                        : entity.type === "realm"
                          ? `${entity.handle} · page`
                          : `@${entity.handle}`}
                    </span>
                  </div>
                  {!member && (
                    <span className="cl-tag-result__action">
                      <Icon n={selected ? "check" : "add"} s={16} />
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}

      {feedback.map((line, i) => (
        <div
          key={i}
          className={`cl-invite-people__feedback cl-invite-people__feedback--${line.tone}`}
          role={line.tone === "error" ? "alert" : "status"}
        >
          {line.text}
        </div>
      ))}

      {showPending && pending.length > 0 && (
        <div className="cl-invite-people__pending">
          <span className="cl-invite-people__pending-title">
            Waiting for an answer
          </span>
          {pending.map((invite) => {
            const who = invite.target_entity
              ? entityDisplay(invite.target_entity)
              : null;
            const label = who?.name ?? invite.target_email ?? "Someone";
            return (
              <div key={invite.id} className="cl-invite-people__pending-row">
                <Avatar
                  id={invite.target_entity?.id ?? invite.target_email ?? invite.id}
                  name={label}
                  src={who?.profile}
                  size={30}
                />
                <div className="cl-invite-people__pending-text">
                  <span className="cl-invite-people__pending-name">{label}</span>
                  <span className="cl-invite-people__pending-meta">
                    Invited {invitePurposeLabel(invite)}
                    {!invite.target_entity && " · by email"}
                  </span>
                </div>
                <Btn
                  size="sm"
                  variant="outline"
                  disabled={revoking === invite.invite_token}
                  onClick={() => revoke(invite)}
                >
                  Revoke
                </Btn>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default InvitePeople;
