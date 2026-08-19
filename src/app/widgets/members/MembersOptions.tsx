/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  RemoveRealmMemberRequest,
  TransferRealmOwnershipRequest,
  UpdateMemberRoleRequest,
} from "@/reusables/hooks/requests";
import { IRealmMember } from "@/reusables/vars/interfaces";
import ConfirmModal from "@/app/widgets/modals/ConfirmModal";
import type { ConfirmPrompt } from "@/app/widgets/modals/confirmPrompts";
import {
  leaveKindFromRealmNoun,
  leaveRealmPrompt,
  ownerMustTransferPrompt,
  removeMemberPrompt,
  transferOwnershipPrompt,
} from "@/app/widgets/modals/confirmPrompts";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { SET_ALERTS } from "@/redux/types";
import { BsThreeDots } from "react-icons/bs";
import { FaCircleArrowDown, FaCircleArrowUp } from "react-icons/fa6";
import { IoPersonRemove } from "react-icons/io5";
import { GiQueenCrown } from "react-icons/gi";
import { BiLogOut } from "react-icons/bi";

function MembersOptions({
  member,
  hide,
  realmNoun,
  viewerIsOwner,
  isSelf,
}: {
  member: IRealmMember;
  hide: string[];
  /** "server" | "group" | "channel" - what they lose access to. */
  realmNoun: string;
  /**
   * Only an owner sees Transfer ownership - realm.ownership.transfer is
   * owner-exclusive in the seeded role matrix, so it is the one action here
   * an admin can never perform.
   */
  viewerIsOwner: boolean;
  /**
   * This row is the ACTING entity - so the menu is about yourself, and the
   * only thing you can do to yourself here is leave. Promote/demote/remove
   * and Transfer all target someone else by definition.
   */
  isSelf: boolean;
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const alerts = useSelector((state: any) => state.alerts);

  const [isOptionsToggled, setisOptionsToggled] = useState<boolean>(false);
  // Removing someone else is the same one-way call as leaving, and it is
  // silent from their side, so it confirms first - mirrors the app's
  // realm_sections dialog.
  const [isRemoveConfirmOpen, setisRemoveConfirmOpen] =
    useState<boolean>(false);
  // One slot for whichever confirm is pending, carrying its action - the two
  // never overlap, since opening either closes the menu.
  const [confirmAction, setconfirmAction] = useState<{
    prompt: ConfirmPrompt;
    /** Omitted for an informational prompt - see ConfirmModal's onConfirm. */
    run?: () => void;
  } | null>(null);

  const notify = (status: boolean, content: string) =>
    dispatch({
      type: SET_ALERTS,
      payload: {
        alerts: {
          id: alerts.length,
          type: status ? "success" : "warning",
          content,
        },
      },
    });

  // Same name the row above this menu renders: realms carry a `name`, people
  // carry first/last.
  const memberName =
    member.entity.type === "realm"
      ? (member.entity.details.name ?? "this page")
      : `${member.entity.details.first_name} ${member.entity.details.last_name}`;

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

  // Leaving IS removing yourself - the same /realms/remove-user call, which
  // the server always allows for the acting entity (its permission check
  // only applies to the ids that are NOT you). The one refusal is the sole
  // owner, and that is caught before we get here.
  const LeaveRealmProcess = () => {
    setisOptionsToggled(false);
    RemoveRealmMemberRequest(member.realm, [member.entity.id])
      .then((response) => {
        if (!response?.status) {
          notify(false, response?.message || "Could not leave. Please try again.");
          return;
        }
        // No refetch: this page is admin-only and we are no longer a member
        // of anything here, so staying would just render a restricted page.
        navigate(realmNoun === "server" ? "/servers" : "/");
      })
      .catch((err) => {
        console.log(err);
        notify(false, "Could not leave. Please try again.");
      });
  };

  const TransferOwnershipProcess = () => {
    setisOptionsToggled(false);
    TransferRealmOwnershipRequest(member.realm, member.member_id)
      .then((response) => {
        // The refusals ("They already own this realm", "Only the realm owner
        // can transfer ownership") come back as data now, so say them out
        // loud rather than leaving the menu looking broken.
        notify(
          Boolean(response?.status),
          response?.message ||
            (response?.status
              ? "Ownership transferred"
              : "Could not transfer ownership"),
        );
        if (response?.status) {
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
        notify(false, "Could not transfer ownership");
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
      {isRemoveConfirmOpen && (
        <ConfirmModal
          {...removeMemberPrompt(memberName, realmNoun)}
          onClose={() => setisRemoveConfirmOpen(false)}
          onConfirm={() => {
            setisRemoveConfirmOpen(false);
            RemoveRealmMemberProcess();
          }}
        />
      )}
      {confirmAction && (
        <ConfirmModal
          {...confirmAction.prompt}
          onClose={() => setconfirmAction(null)}
          onConfirm={
            confirmAction.run &&
            (() => {
              const run = confirmAction.run;
              setconfirmAction(null);
              run?.();
            })
          }
        />
      )}
      {isOptionsToggled && (
        <div
          autoFocus
          className="tw-z-[2] tw-flex tw-flex-col tw-gap-[2px] tw-min-w-[100px] tw-fixed tw-mb-[0px] -tw-ml-[170px] tw-bg-[var(--surface)] tw-p-[10px] tw-rounded-md tw-border-solid tw-border-[1px] tw-border-[var(--border)] tw-shadow-md"
        >
          {isSelf ? (
            <button
              onClick={() => {
                setisOptionsToggled(false);
                setconfirmAction(
                  viewerIsOwner
                    ? {
                        // Informational: no run, so the dialog offers a
                        // single dismiss rather than a Leave that would 400.
                        prompt: ownerMustTransferPrompt(realmNoun),
                      }
                    : {
                        prompt: leaveRealmPrompt(
                          leaveKindFromRealmNoun(realmNoun),
                        ),
                        run: LeaveRealmProcess,
                      },
                );
              }}
              className="tw-items-center cl-text-caption tw-flex tw-gap-[2px] tw-cursor-pointer tw-p-[7px] tw-font-Inter tw-border-none tw-rounded-sm tw-bg-transparent tw-text-[var(--pink)] hover:tw-bg-[var(--surface-hover)]"
            >
              <BiLogOut
                size={15}
                style={{ marginLeft: "-1px", marginRight: "4px" }}
              />
              <span>Leave {realmNoun}</span>
            </button>
          ) : member.role === "admin" ? (
            <button
              onClick={() => {
                UpdateMemberRoleProcess("member");
              }}
              className="tw-items-center cl-text-caption tw-flex tw-gap-[2px] tw-cursor-pointer tw-p-[7px] tw-font-Inter tw-border-none tw-rounded-sm tw-bg-transparent tw-text-[var(--text)] hover:tw-bg-[var(--surface-hover)]"
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
              className="tw-items-center cl-text-caption tw-flex tw-gap-[2px] tw-cursor-pointer tw-p-[7px] tw-font-Inter tw-border-none tw-rounded-sm tw-bg-transparent tw-text-[var(--text)] hover:tw-bg-[var(--surface-hover)]"
            >
              <FaCircleArrowUp
                size={15}
                style={{ marginLeft: "-1px", marginRight: "4px" }}
              />
              <span>Promote to Admin</span>
            </button>
          )}
          {!isSelf && viewerIsOwner && (
            <button
              onClick={() => {
                setisOptionsToggled(false);
                setconfirmAction({
                  prompt: transferOwnershipPrompt(memberName, realmNoun),
                  run: TransferOwnershipProcess,
                });
              }}
              className="tw-items-center cl-text-caption tw-flex tw-gap-[2px] tw-cursor-pointer tw-p-[7px] tw-font-Inter tw-border-none tw-rounded-sm tw-bg-transparent tw-text-[var(--text)] hover:tw-bg-[var(--surface-hover)]"
            >
              <GiQueenCrown
                size={15}
                style={{ marginLeft: "-1px", marginRight: "4px" }}
              />
              <span>Transfer ownership</span>
            </button>
          )}
          {!isSelf && !hide.includes("remove-user-btn") && (
            <button
              onClick={() => {
                setisOptionsToggled(false);
                setisRemoveConfirmOpen(true);
              }}
              className="tw-items-center cl-text-caption tw-flex tw-gap-[2px] tw-cursor-pointer tw-p-[7px] tw-font-Inter tw-border-none tw-rounded-sm tw-bg-transparent tw-text-[var(--pink)] hover:tw-bg-[var(--surface-hover)]"
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
        <BsThreeDots style={{ fontSize: "17px", color: "var(--text)" }} />
      </button>
    </div>
  );
}

export default MembersOptions;
