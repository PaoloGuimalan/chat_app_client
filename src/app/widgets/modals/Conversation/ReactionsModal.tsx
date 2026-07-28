/* eslint-disable @typescript-eslint/no-explicit-any */
import Modal from "@/app/reusables/Modal";
import { IoMdClose } from "react-icons/io";
import { Avatar, Icon } from "@/reusables/design";

// A reactor may be a person OR a page (you can react while switched to one),
// so every row is built from one normalized shape. The middle name arrives as
// the "N/A" sentinel for realms, which the join below skips.
const reactorName = (mp: any) => {
  const parts = [
    mp.fullname?.firstName,
    mp.fullname?.middleName && mp.fullname.middleName !== "N/A"
      ? mp.fullname.middleName
      : "",
    mp.fullname?.lastName,
  ].filter(Boolean);

  const name = parts.join(" ").trim();
  // Falls back to the handle so an unresolved reactor never renders a blank
  // row with a lone emoji floating in it.
  return name || mp.username || "Someone";
};

function ReactionsModal({ reactions, onclose }: any) {
  return (
    <Modal
      component={
        <div className="div_modal_container cl-reactions-modal tw-max-w-[400px] tw-max-h-[300px] tw-items-center">
          <div className="tw-w-[calc(100%-20px)] tw-p-[10px] tw-pl-[10px] tw-pr-[10px] tw-pt-[7px] tw-flex tw-items-center tw-justify-start tw-bg-transparent">
            <span className="tw-text-[14px] tw-font-semibold tw-flex tw-flex-1">
              Reactions
            </span>
            <button
              onClick={() => {
                onclose(false);
              }}
              className="cl-reactions-modal-close tw-w-[25px] tw-h-[20px] tw-border-none tw-bg-transparent tw-cursor-pointer"
            >
              <IoMdClose style={{ fontSize: "17px" }} />
            </button>
          </div>
          <div className="tw-bg-transparent tw-w-full tw-flex tw-flex-col tw-flex-1 tw-overflow-y-auto thinscroller">
            {reactions.map((mp: any, i: number) => {
              const isRealm = mp.entityType === "realm";
              const name = reactorName(mp);

              return (
                <div
                  key={i}
                  className="tw-w-[calc(100%-10px)] tw-flex tw-p-[5px] tw-h-[40px] tw-items-center tw-gap-[8px]"
                >
                  <div id="div_img_search_profiles_container_cncts">
                    <Avatar
                      // Keyed on the entity so a page's fallback gradient is
                      // stable and distinct from its owner's.
                      id={mp.entityID || mp.userID || String(i)}
                      name={name}
                      src={
                        mp.profile && mp.profile !== "none"
                          ? mp.profile
                          : undefined
                      }
                    />
                  </div>
                  <div className="tw-flex tw-flex-1 span_userdetails_ellipsis tw-items-center tw-gap-[4px]">
                    <span className="tw-flex tw-flex-1 tw-text-[14px] tw-font-Inter tw-items-center tw-gap-[4px]">
                      {name}
                      {isRealm && (
                        <span title="Page" style={{ display: "inline-flex" }}>
                          <Icon n="flag" s={13} c="var(--text-3)" />
                        </span>
                      )}
                    </span>
                    <span className="tw-text-[18px]">{mp.emoji}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      }
    />
  );
}

export default ReactionsModal;
