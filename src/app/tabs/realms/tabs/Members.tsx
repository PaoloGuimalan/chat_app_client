import ContactMember from "@/app/widgets/members/ContactMember";
import RealmMembers from "@/app/widgets/members/RealmMembers";
import {
  AddNewMemberRequest,
  AddNewMemberToServer,
} from "@/reusables/hooks/requests";
import { IRealmProfileInfo } from "@/reusables/vars/interfaces";
import { useState } from "react";

function Members({ realm }: { realm: IRealmProfileInfo }) {
  const realmTypeLabel =
    realm.type === "group" && realm.parent ? "channel" : realm.type;

  const addableMember = !(
    (realmTypeLabel === "channel" || realmTypeLabel === "voice") &&
    !realm.is_private
  );

  const [memberIDs, setmemberIDs] = useState<string[]>([]);

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
          if (response.data.status) {
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
          }
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      const initialpayload = {
        conversationID: realm.realm_id,
        memberstoadd: markedMembers,
        receivers: [...markedMembers.map((mp) => mp.id)],
      };
      AddNewMemberRequest(initialpayload)
        .then((response) => {
          if (response.data.status) {
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
          }
        })
        .catch((err) => {
          console.log(err);
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
            // Who may act on whom - see RealmMembers. created_by is the
            // creator's ENTITY id (Realm.created_by is an Entity FK), which
            // is the same entity that gets the sole "owner" member row.
            ownerEntityID={realm.created_by}
            realmEntityID={realm.entity}
            hide={!addableMember ? ["remove-user-btn"] : []}
            onList={(list: string[]) => {
              setmemberIDs(list);
            }}
          />
        </div>
        {addableMember && (
          <div className="tw-flex tw-flex-1 tw-bg-[var(--surface)] tw-border tw-border-[var(--border)] tw-shadow-[var(--shadow-sm)] tw-rounded-[var(--r-md)] tw-overflow-hidden">
            <ContactMember
              parentRealmID={realm.parent?.id ?? null}
              isRealm={true}
              type={
                realm.type === "group" && realm.parent ? "channel" : realm.type
              }
              label={
                realm.type === "page"
                  ? `Add Page Admin/Moderators`
                  : `People you may want to add from ${realmTypeLabel === "channel" || realmTypeLabel === "voice" ? "server" : "contacts"}`
              }
              excludeIDs={memberIDs}
              onAdd={AddNewMemberProcess}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default Members;
