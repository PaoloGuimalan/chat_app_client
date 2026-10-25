/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { GetRealmInviteRequest, UpdateRealmInviteRequest } from "@/reusables/hooks/requests";
import { resolveErrorMessage } from "@/reusables/hooks/errormessages";
import { Avatar, Btn, Card, Icon } from "@/reusables/design";
import "@/styles/community-requests.css";
import { entityDisplay, type IRealmInvite } from "./invites";
export default function CommunityRequests({ realmId, compact = false, className = "" }: {
  realmId: string;
  compact?: boolean;
  className?: string;
}) {
  const actor = useSelector((state: any) => state.authentication.active_entity_context?.id ?? state.authentication.user.entity_id);
  const [requests, setRequests] = useState<IRealmInvite[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const epoch = useRef(0);
  const mutation = useRef(false);
  useEffect(() => {
    const version = ++epoch.current;
    let active = true;
    setBusy(true);
    setError("");
    setRequests([]);
    GetRealmInviteRequest({ realm_id: realmId, kind: "request", status: "pending" }).then(response => {
      if (active && version === epoch.current)
        setRequests(response?.result ?? []);
    }).catch(error => {
      if (active)
        setError(resolveErrorMessage(error, "Join requests could not be loaded."));
    }).finally(() => {
      if (active)
        setBusy(false);
    });
    const changed = (event: Event) => {
      const id = (event as CustomEvent).detail?.realm_id;
      if (!id || id === realmId) {
        epoch.current++;
        setRequests([]);
        setRevision(value => value + 1);
      }
    };
    document.addEventListener("community-changed", changed);
    return () => {
      active = false;
      // Invalidate async requests, including a pending role mutation.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      epoch.current++;
      document.removeEventListener("community-changed", changed);
    };
  }, [realmId, actor, revision]);
  const respond = async (invite: IRealmInvite, status: "accepted" | "declined") => {
    if (mutation.current)
      return;
    mutation.current = true;
    setPending(invite.invite_token);
    setError("");
    const version = epoch.current;
    try {
      const response = await UpdateRealmInviteRequest({ invite_token: invite.invite_token, status });
      if (response?.status === false)
        throw new Error(response.message || "The request could not be updated.");
      if (version === epoch.current) {
        setRequests(previous => previous.filter(row => row.invite_token !== invite.invite_token));
        document.dispatchEvent(new CustomEvent("reload-realm-members"));
        document.dispatchEvent(new CustomEvent("community-changed", { detail: { realm_id: realmId } }));
      }
    }
    catch (error) {
      if (version === epoch.current)
        setError(resolveErrorMessage(error, "The request could not be updated."));
    }
    finally {
      mutation.current = false;
      setPending(null);
    }
  };
  return <Card pad={0} style={{ borderRadius: "var(--r-md)", boxShadow: "none" }} className={`cl-community-requests ${className}${compact ? " cl-community-requests--compact" : ""}`}>
    <div className="cl-community-requests__head">
      <Icon n="person_add" s={18} c="var(--brand)" />
      <h3>Join requests</h3>
      {!busy && requests.length > 0 && <span>{requests.length}</span>}
    </div>
    <div className="cl-community-requests__body">
      {busy && <p role="status">Loading requests…</p>}
      {error && <p role="alert">
        {error} <Btn size="sm" variant="ghost" onClick={() => setRevision(value => value + 1)}>Try again</Btn>
      </p>}
      {!busy && !error && requests.length === 0 && <p>No pending requests.</p>}
      {requests.map(invite => {
        const person = entityDisplay(invite.target_entity);
        return <div className="cl-community-request" key={invite.invite_token} aria-busy={pending === invite.invite_token}>
          <Avatar id={invite.target_entity?.id} name={person.name} src={person.profile} size={32} />
          <span className="cl-community-request__name">
            {person.name}
          </span>
          <div className="cl-community-request__actions">
            <Btn size="sm" disabled={Boolean(pending)} onClick={() => respond(invite, "accepted")}>Approve</Btn>
            <Btn size="sm" variant="outline" disabled={Boolean(pending)} onClick={() => respond(invite, "declined")}>Decline</Btn>
          </div>
        </div>;
      })}
    </div>
  </Card>;
}
