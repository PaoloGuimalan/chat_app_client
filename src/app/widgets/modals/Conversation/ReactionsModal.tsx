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

function ReactionsModal({
  reactions,
  onclose,
  selfEntityID,
  onRemoveOwn,
}: any) {
  return (
    <Modal
      component={
        <div className="div_modal_container cl-reactions-modal tw-max-w-[400px] tw-max-h-[340px] tw-items-center">
          <div
            className="tw-w-full tw-flex tw-items-center tw-justify-start tw-bg-transparent"
            style={{
              padding: "12px 14px 10px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <span className="cl-text-body tw-font-semibold tw-flex tw-flex-1">
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
          {/* Rows were flush against each other: the column had no gap and
              each row was a fixed 40px with 5px of padding. */}
          <div
            className="tw-bg-transparent tw-w-full tw-flex tw-flex-col tw-flex-1 tw-overflow-y-auto thinscroller"
            style={{ gap: 0, padding: "8px 10px 12px" }}
          >
            {reactions.map((mp: any, i: number) => {
              const isRealm = mp.entityType === "realm";
              const name = reactorName(mp);
              // Your own row is the undo affordance: tap it to take the
              // reaction back.
              const isMine =
                !!selfEntityID &&
                String(mp.entityID) === String(selfEntityID) &&
                !!onRemoveOwn;

              return (
                <div
                  key={i}
                  role={isMine ? "button" : undefined}
                  tabIndex={isMine ? 0 : undefined}
                  title={isMine ? "Tap to remove your reaction" : undefined}
                  onClick={isMine ? () => onRemoveOwn() : undefined}
                  onKeyDown={
                    isMine
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onRemoveOwn();
                          }
                        }
                      : undefined
                  }
                  style={{
                    padding: "8px 10px",
                    minHeight: 52,
                    borderRadius: "var(--r-sm)",
                    ...(isMine
                      ? {
                          cursor: "pointer",
                          background: "var(--surface-2)",
                        }
                      : {}),
                  }}
                  className="tw-w-full tw-flex tw-items-center tw-gap-[10px] tw-flex-none"
                >
                  <div
                    id="div_img_search_profiles_container_cncts"
                    className="tw-flex-none"
                  >
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
                      size={36}
                    />
                  </div>
                  <div className="tw-flex tw-flex-1 tw-min-w-0 span_userdetails_ellipsis tw-items-center tw-gap-[8px]">
                    <span className="tw-flex tw-flex-1 tw-min-w-0 cl-text-body tw-font-Inter tw-items-center tw-gap-[4px] tw-text-left">
                      <span className="tw-truncate">{name}</span>
                      {isRealm && (
                        <span
                          title="Page"
                          className="tw-flex-none"
                          style={{ display: "inline-flex" }}
                        >
                          <Icon n="flag" s={13} c="var(--text-3)" />
                        </span>
                      )}
                    </span>
                    {isMine && (
                      <span
                        className="cl-text-micro tw-flex-none"
                        style={{ color: "var(--brand)", whiteSpace: "nowrap" }}
                      >
                        Tap to undo
                      </span>
                    )}
                    {/* Not a type step: the emoji is content sized to the
                        row, not text in the hierarchy. */}
                    <span className="tw-text-[18px] tw-flex-none tw-leading-none">
                      {mp.emoji}
                    </span>
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

