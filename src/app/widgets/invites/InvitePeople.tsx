/* eslint-disable @typescript-eslint/no-explicit-any */
import { FormEvent, useEffect, useState } from "react";
import { Avatar, Btn, Icon, SegTabs } from "@/reusables/design";
import {
  CreateRealmInviteRequest,
  GetRealmInviteRequest,
  UpdateRealmInviteRequest,
} from "@/reusables/hooks/requests";
import { resolveErrorMessage } from "@/reusables/hooks/errormessages";
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
}

type PagePurpose = "follow" | "manage";

function InvitePeople({
  realmId,
  realmType,
  realmName,
  showPending = true,
  onInvited,
  reloadKey = 0,
}: InvitePeopleProps) {
  const [target, setTarget] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{
    tone: "ok" | "muted" | "error";
    text: string;
  } | null>(null);
  const [pagePurpose, setPagePurpose] = useState<PagePurpose>("follow");
  const [role, setRole] = useState<"moderator" | "admin">("moderator");
  const [pending, setPending] = useState<IRealmInvite[]>([]);
  const [revoking, setRevoking] = useState<string | null>(null);

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

  /** Shared with the contacts picker - see sendTo. */
  const purposeFields = () =>
    isPage
      ? {
          purpose: pagePurpose,
          ...(pagePurpose === "manage" ? { role } : {}),
        }
      : {};

  const sendTo = async (fields: Record<string, string>) => {
    const response = await CreateRealmInviteRequest({
      realm_id: realmId,
      kind: "invite",
      ...purposeFields(),
      ...fields,
    });
    return response;
  };

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    const value = target.trim();
    if (!value || sending) return;
    setSending(true);
    setFeedback(null);
    try {
      const response = await sendTo({ target: value });
      const invite: IRealmInvite | undefined = response?.result;
      const who = invite?.target_entity
        ? `@${entityDisplay(invite.target_entity).handle ?? value}`
        : value;
      setFeedback(
        response?.already_invited
          ? { tone: "muted", text: `${who} already has an invite waiting.` }
          : {
              tone: "ok",
              text: invite?.target_entity
                ? `Invite sent to ${who}.`
                : `Invite emailed to ${who}. It waits for them if they're new.`,
            },
      );
      setTarget("");
      if (invite) onInvited?.(invite);
      loadPending();
    } catch (err) {
      setFeedback({
        tone: "error",
        text: resolveErrorMessage(err, "We couldn't send that invite."),
      });
    } finally {
      setSending(false);
    }
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
      setFeedback({
        tone: "error",
        text: resolveErrorMessage(err, "We couldn't revoke that invite."),
      });
    } finally {
      setRevoking(null);
    }
  };

  const intro = isPage
    ? pagePurpose === "follow"
      ? `Invite people to follow ${realmName}.`
      : `Invite people to help run ${realmName}. They join its team once they accept.`
    : `They're added to ${realmName} once they accept.`;

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

      <form className="cl-invite-people__form" onSubmit={submit}>
        <div className="cl-invite-people__field">
          <Icon n="alternate_email" s={17} c="var(--text-3)" />
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="Email or @username"
            aria-label="Email or username to invite"
            autoComplete="off"
            spellCheck={false}
            disabled={sending}
          />
        </div>
        <Btn type="submit" disabled={!target.trim() || sending}>
          {sending ? "Sending…" : "Invite"}
        </Btn>
      </form>

      {feedback && (
        <div
          className={`cl-invite-people__feedback cl-invite-people__feedback--${feedback.tone}`}
          role={feedback.tone === "error" ? "alert" : "status"}
        >
          {feedback.text}
        </div>
      )}

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
