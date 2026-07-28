import {
  RemoveRealmMemberRequest,
  UpdateMemberRoleRequest,
} from "@/reusables/hooks/requests";
import { IRealmMember } from "@/reusables/vars/interfaces";
import { useEffect, useRef, useState } from "react";
import { BsThreeDots } from "react-icons/bs";
import { FaCircleArrowDown, FaCircleArrowUp } from "react-icons/fa6";
import { IoPersonRemove } from "react-icons/io5";

function MembersOptions({
  member,
  hide,
}: {
  member: IRealmMember;
  hide: string[];
}) {
  const [isOptionsToggled, setisOptionsToggled] = useState<boolean>(false);

  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setisOptionsToggled(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const UpdateMemberRoleProcess = (role: string) => {
    setisOptionsToggled(false);
    UpdateMemberRoleRequest(member.realm, member.member_id, role)
      .then((response) => {
        if (response.status) {
          setTimeout(() => {
            document.dispatchEvent(
              new CustomEvent("reload-realm-members", {
                detail: {
                  event: "reload",
                  data: "",
                },
              }),
            );
          }, 1000);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const RemoveRealmMemberProcess = () => {
    setisOptionsToggled(false);
    RemoveRealmMemberRequest(member.realm, [member.entity.id])
      .then((response) => {
        if (response.status) {
          setTimeout(() => {
            document.dispatchEvent(
              new CustomEvent("reload-realm-members", {
                detail: {
                  event: "reload",
                  data: "",
                },
              }),
            );
          }, 1000);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <div ref={wrapperRef} className="tw-relative">
      {isOptionsToggled && (
        <div
          autoFocus
          className="tw-z-[2] tw-flex tw-flex-col tw-gap-[2px] tw-min-w-[100px] tw-fixed tw-mb-[0px] -tw-ml-[170px] tw-bg-white tw-p-[10px] tw-rounded-md tw-border-solid tw-border-[1px] tw-border-[#d2d2d2] tw-shadow-md"
        >
          {member.role === "admin" ? (
            <button
              onClick={() => {
                UpdateMemberRoleProcess("member");
              }}
              className="tw-items-center cl-text-caption tw-flex tw-gap-[2px] tw-cursor-pointer tw-p-[7px] tw-font-Inter tw-border-none tw-rounded-sm tw-bg-transparent hover:tw-bg-[#d2d2d2]"
            >
              <FaCircleArrowDown
                size={15}
                style={{ marginLeft: "-1px", marginRight: "4px" }}
              />
              <span>Demote to Member</span>
            </button>
          ) : (
            <button
              onClick={() => {
                UpdateMemberRoleProcess("admin");
              }}
              className="tw-items-center cl-text-caption tw-flex tw-gap-[2px] tw-cursor-pointer tw-p-[7px] tw-font-Inter tw-border-none tw-rounded-sm tw-bg-transparent hover:tw-bg-[#d2d2d2]"
            >
              <FaCircleArrowUp
                size={15}
                style={{ marginLeft: "-1px", marginRight: "4px" }}
              />
              <span>Promote to Admin</span>
            </button>
          )}
          {!hide.includes("remove-user-btn") && (
            <button
              onClick={RemoveRealmMemberProcess}
              className="tw-items-center cl-text-caption tw-flex tw-gap-[2px] tw-cursor-pointer tw-p-[7px] tw-font-Inter tw-border-none tw-rounded-sm tw-bg-transparent hover:tw-bg-[#d2d2d2]"
            >
              <IoPersonRemove
                size={15}
                style={{ marginLeft: "-1px", marginRight: "4px" }}
              />
              <span>Remove</span>
            </button>
          )}
        </div>
      )}
      <button
        onClick={() => {
          setisOptionsToggled(!isOptionsToggled);
        }}
        className="tw-w-[25px] tw-h-[20px] tw-border-none tw-bg-transparent tw-cursor-pointer"
      >
        <BsThreeDots style={{ fontSize: "17px" }} />
      </button>
    </div>
  );
}

export default MembersOptions;
