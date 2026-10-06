import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Avatar, Btn, Icon, useTheme } from "@/reusables/design";
import {
  GetRealmInviteRequest,
  UpdateRealmInviteRequest,
} from "@/reusables/hooks/requests";
import { resolveErrorMessage } from "@/reusables/hooks/errormessages";
import PageLoader from "@/app/reusables/loaders/PageLoader";
import BrokenLink from "@/app/reusables/catchers/BrokenLink";
import {
  entityDisplay,
  IRealmInvite,
  inviteDestination,
  inviteSentence,
} from "./invites";
import "@/styles/styles.css";

/**
 * An invite at its own URL - `/invite/:token`.
 *
 * Where an invite's notification, its push and its email all lead (Django
 * community/invite_rules.py invite_route). It says who invited you to what,
 * and takes the answer; accepting goes on to the realm.
 *
 * A conference has a page of its own for this - its lobby takes
 * ?invite_token= and lets guests in - so a conference invite opened here is
 * handed on to it rather than answered twice over.
 *
 * Logged out, App.tsx carries this path through /login (and sign-up) and back.
 */
function InvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [invite, setInvite] = useState<IRealmInvite | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isBroken, setIsBroken] = useState(false);
  const [answering, setAnswering] = useState<"accepted" | "declined" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setIsBroken(true);
      setIsLoaded(true);
      return;
    }
    setIsLoaded(false);
    setIsBroken(false);
    GetRealmInviteRequest({ invite_token: token })
      .then((response) => {
        if (cancelled) return;
        const found: IRealmInvite | null = response?.result ?? null;
        if (!found || found.kind !== "invite") {
          setIsBroken(true);
        } else if (found.realm_type === "conference" && found.realm_slug) {
          navigate(
            `/conference/${found.realm_slug}?invite_token=${encodeURIComponent(token)}`,
            { replace: true },
          );
          return;
        } else {
          setInvite(found);
        }
        setIsLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setIsBroken(true);
        setIsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [token, navigate]);

  const answer = async (status: "accepted" | "declined") => {
    if (!invite || answering) return;
    setAnswering(status);
    setError(null);
    try {
      const response = await UpdateRealmInviteRequest({
        invite_token: invite.invite_token,
        status,
      });
      const settled: IRealmInvite = response?.result ?? { ...invite, status };
      setInvite(settled);
      if (status === "accepted") {
        const destination = inviteDestination(settled);
        if (destination) navigate(destination, { replace: true });
      }
    } catch (err) {
      setError(resolveErrorMessage(err, "We couldn't answer that invite."));
    } finally {
      setAnswering(null);
    }
  };

  const inviter = invite ? entityDisplay(invite.inviter) : null;
  const destination = invite ? inviteDestination(invite) : null;
  const realmPicture =
    invite?.realm_profile &&
    invite.realm_profile !== "none" &&
    invite.realm_profile !== "N/A"
      ? invite.realm_profile
      : undefined;

  return (
    <div className="cl-redesign cl-invite-page" data-theme={theme}>
      {!isLoaded ? (
        <PageLoader />
      ) : isBroken || !invite ? (
        <BrokenLink
          label="This invite can't be opened."
          secondaryLabel="It may have been revoked, or the link is wrong."
        />
      ) : (
        <div className="cl-invite-page__card">
          <div className="cl-invite-page__faces">
            <Avatar
              id={invite.realm_id}
              name={invite.realm_name}
              src={realmPicture}
              kind="realm"
              size={72}
              shape={invite.realm_type === "page" ? "circle" : "rounded"}
            />
            {inviter && (
              <span className="cl-invite-page__inviter">
                <Avatar
                  id={invite.inviter?.id ?? "inviter"}
                  name={inviter.name}
                  src={inviter.profile}
                  kind={invite.inviter?.type}
                  size={30}
                />
              </span>
            )}
          </div>

          <h1 className="cl-invite-page__title">{invite.realm_name}</h1>
          <p className="cl-invite-page__sentence">{inviteSentence(invite)}</p>

          {invite.status === "pending" ? (
            <div className="cl-invite-page__actions">
              <Btn
                variant="outline"
                disabled={answering !== null}
                onClick={() => answer("declined")}
              >
                {answering === "declined" ? "Declining…" : "Decline"}
              </Btn>
              <Btn
                disabled={answering !== null}
                onClick={() => answer("accepted")}
              >
                {answering === "accepted" ? "Accepting…" : "Accept"}
              </Btn>
            </div>
          ) : (
            <div className="cl-invite-page__settled">
              <Icon
                n={
                  invite.status === "accepted"
                    ? "check_circle"
                    : invite.status === "revoked"
                      ? "block"
                      : "do_not_disturb_on"
                }
                s={18}
                c="var(--text-2)"
              />
              <span>
                {invite.status === "accepted"
                  ? "You accepted this invite."
                  : invite.status === "declined"
                    ? "You declined this invite."
                    : "This invite was withdrawn."}
              </span>
              {invite.status === "accepted" && destination && (
                <Btn size="sm" onClick={() => navigate(destination)}>
                  Open
                </Btn>
              )}
            </div>
          )}

          {error && (
            <div className="cl-invite-page__error" role="alert">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default InvitePage;
