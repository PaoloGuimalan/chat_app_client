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
    <div className="tw-flex tw-flex-1 tw-flex-col tw-items-start tw-p-[20px] tw-gap-[20px]">
      <div className="tw-flex tw-flex-col tw-items-start">
        <span className="tw-text-[#383838] tw-text-[16px] tw-font-semibold tw-font-Inter">
          Members
        </span>
        <span className="tw-text-[#383838] tw-text-[14px] tw-font-Inter">
          Manage your{" "}
          {realm.type === "group" && realm.parent ? "channel" : realm.type}{" "}
          members and their roles
        </span>
      </div>
      <div className="tw-flex tw-flex-wrap tw-w-full tw-gap-[10px] tw-h-full">
        <div className="tw-w-full sm:tw-max-w-[450px] tw-h-full tw-flex">
          <RealmMembers
            realm_id={realm.id}
            onList={(list: string[]) => {
              setmemberIDs(list);
            }}
          />
        </div>
        <ContactMember
          parentRealmID={realm.parent?.id ?? null}
          isRealm={true}
          type={realm.type === "group" && realm.parent ? "channel" : realm.type}
          label={
            realm.type === "page"
              ? `Add Page Admin/Moderators`
              : `People you may want to add from ${realmTypeLabel === "channel" ? "server" : "contacts"}`
          }
          excludeIDs={memberIDs}
          onAdd={AddNewMemberProcess}
        />
      </div>
    </div>
  );
}

export default Members;
