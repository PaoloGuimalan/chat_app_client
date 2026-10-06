import ContactMember from "@/app/widgets/members/ContactMember";
import RealmMembers from "@/app/widgets/members/RealmMembers";
import {
  AddNewMemberRequest,
  AddNewMemberToServer,
} from "@/reusables/hooks/requests";
import { IRealmProfileInfo } from "@/reusables/vars/interfaces";
import { useState } from "react";
import {
  notify,
  notifyRequestError,
  notifyResponseFailure,
} from "@/reusables/hooks/errormessages";
import InvitePeople from "@/app/widgets/invites/InvitePeople";
import {
  InvitableRealmType,
  inviteEntities,
} from "@/app/widgets/invites/invites";

const ADD_MEMBERS_FAILED = "We couldn't add those members. Please try again.";
const INVITE_FAILED = "We couldn't send those invites. Please try again.";

function Members({ realm }: { realm: IRealmProfileInfo }) {
  const realmTypeLabel =
    realm.type === "group" && realm.parent ? "channel" : realm.type;

  const addableMember = !(
    (realmTypeLabel === "channel" || realmTypeLabel === "voice") &&
    !realm.is_private
  );

  const [memberIDs, setmemberIDs] = useState<string[]>([]);

  // Groups, servers, conferences and pages INVITE: the person accepts or
  // declines (Django community/invites.py). A channel still adds directly -
  // it takes people already in its server, who have said yes once.
  const invitable: InvitableRealmType | null =
    realmTypeLabel === "group" ||
    realmTypeLabel === "server" ||
    realmTypeLabel === "conference" ||
    realmTypeLabel === "page"
      ? realmTypeLabel
      : null;

  // People invited from the picker this visit: kept out of it, and the
  // panel's pending list re-read so they show up there instead.
  const [invitedIDs, setinvitedIDs] = useState<string[]>([]);
  const [inviteReload, setinviteReload] = useState(0);

  const InviteMarkedProcess = (
    markedMembers: { entityID: string; fullName: string }[],
    callback: () => void,
  ) => {
    // A page's picker is for its team ("Add Page Admin/Moderators"), invited
    // as moderators - the owner can make one an admin once they are in, or
    // invite an admin directly from the panel.
    const extra: Record<string, string> =
      invitable === "page" ? { purpose: "manage", role: "moderator" } : {};
    inviteEntities(
      realm.realm_id,
      markedMembers.map((m) => m.entityID),
      extra,
    ).then(({ sent, firstError }) => {
      if (sent > 0) {
        setinvitedIDs((prev) => [
          ...prev,
          ...markedMembers.map((m) => m.entityID),
        ]);
        setinviteReload((n) => n + 1);
        callback();
        notify(
          "success",
          sent === 1
            ? `Invite sent to ${markedMembers[0].fullName.trim()}.`
            : `${sent} invites sent.`,
        );
      }
      if (firstError) notifyRequestError(firstError, INVITE_FAILED);
    });
  };

  const AddNewMemberProcess = (
    markedMembers: {
      id: string;
      userID: string;
      fullName: string;
    }[],
    callback: () => void,
  ) => {
    if (realm.type === "server") {
      const initialpayload = {
        serverID: realm.realm_id,
        memberstoadd: markedMembers,
        receivers: [...markedMembers.map((mp) => mp.id)],
      };
      AddNewMemberToServer(initialpayload)
        .then((response) => {
          if (!response.data.status) {
            notifyResponseFailure(response, ADD_MEMBERS_FAILED);
            return;
          }
          setmemberIDs((prev) => {
            return [...prev, ...markedMembers.map((mp) => mp.id)];
          });
          callback();
          document.dispatchEvent(
            new CustomEvent("reload-realm-members", {
              detail: {
                event: "reload",
                data: "",
              },
            }),
          );
        })
        .catch((err) => {
          console.log(err);
          notifyRequestError(err, ADD_MEMBERS_FAILED);
        });
    } else {
      const initialpayload = {
        conversationID: realm.realm_id,
        memberstoadd: markedMembers,
        receivers: [...markedMembers.map((mp) => mp.id)],
      };
      AddNewMemberRequest(initialpayload)
        .then((response) => {
          if (!response.data.status) {
            notifyResponseFailure(response, ADD_MEMBERS_FAILED);
            return;
          }
          setmemberIDs((prev) => {
            return [...prev, ...markedMembers.map((mp) => mp.id)];
          });
          callback();
          document.dispatchEvent(
            new CustomEvent("reload-realm-members", {
              detail: {
                event: "reload",
                data: "",
              },
            }),
          );
        })
        .catch((err) => {
          console.log(err);
          notifyRequestError(err, ADD_MEMBERS_FAILED);
        });
    }
  };

  return (
    <div className="tw-flex tw-flex-1 tw-flex-col tw-items-start tw-p-[18px] sm:tw-p-[24px] tw-gap-[18px] tw-bg-[var(--background)] tw-min-h-0">
      <div className="tw-flex tw-flex-col tw-items-start tw-gap-[4px]">
        <span className="tw-text-[var(--text)] tw-text-[20px] tw-font-semibold tw-font-Inter">
          Members
        </span>
        <span className="tw-text-[var(--text-2)] tw-text-[14px] tw-font-Inter tw-max-w-[760px]">
          Manage your{" "}
          {realm.type === "group" && realm.parent ? "channel" : realm.type}{" "}
          members and their roles
        </span>
      </div>
      <div className="tw-flex tw-flex-wrap tw-w-full tw-gap-[12px] tw-h-full">
        <div
          className={`tw-w-full ${addableMember && "xl:tw-max-w-[450px]"} tw-h-full tw-flex tw-bg-[var(--surface)] tw-border tw-border-[var(--border)] tw-shadow-[var(--shadow-sm)] tw-rounded-[var(--r-md)] tw-overflow-hidden`}
        >
          <RealmMembers
            realm_id={realm.id}
            // Same refinement ContactMember gets below: a group WITH a parent
            // is a channel, and calling it a group in the prompt would name
            // the wrong thing.
            realmNoun={
              realm.type === "group" && realm.parent ? "channel" : realm.type
            }
            // Who may act on whom - see RealmMembers.
            myRole={realm.my_role}
            hide={!addableMember ? ["remove-user-btn"] : []}
            onList={(list: string[]) => {
              setmemberIDs(list);
            }}
          />
        </div>
        {addableMember && (
          <div className="tw-flex tw-flex-1 tw-flex-col tw-gap-[12px] tw-min-w-0">
            {invitable && (
              <div className="tw-bg-[var(--surface)] tw-border tw-border-[var(--border)] tw-shadow-[var(--shadow-sm)] tw-rounded-[var(--r-md)] tw-overflow-hidden">
                <InvitePeople
                  realmId={realm.realm_id}
                  realmType={invitable}
                  realmName={realm.name}
                  reloadKey={inviteReload}
                  excludeIDs={memberIDs}
                />
              </div>
            )}
            <div className="tw-flex tw-flex-1 tw-bg-[var(--surface)] tw-border tw-border-[var(--border)] tw-shadow-[var(--shadow-sm)] tw-rounded-[var(--r-md)] tw-overflow-hidden">
              <ContactMember
                parentRealmID={realm.parent?.id ?? null}
                isRealm={true}
                type={
                  realm.type === "group" && realm.parent ? "channel" : realm.type
                }
                label={
                  realm.type === "page"
                    ? `Invite Page Admin/Moderators`
                    : invitable
                      ? `People you may want to invite from contacts`
                      : `People you may want to add from ${realmTypeLabel === "channel" || realmTypeLabel === "voice" ? "server" : "contacts"}`
                }
                excludeIDs={[...memberIDs, ...invitedIDs]}
                onAdd={invitable ? InviteMarkedProcess : AddNewMemberProcess}
                actionLabel={invitable ? "Invite" : "Add"}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Members;
