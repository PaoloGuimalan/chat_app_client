import { useState } from "react";
import { IoClose } from "react-icons/io5";
import { FaUserTag } from "react-icons/fa";
import Modal from "@/app/reusables/Modal";
import { Avatar } from "@/reusables/design";
import { taggedEntityName } from "@/app/reusables/TaggingSummary";
import { RemovePostTagRequest } from "@/reusables/hooks/requests";
import { notifyRequestError } from "@/reusables/hooks/errormessages";
import { ITagging } from "@/reusables/vars/interfaces";

/**
 * The author's list of who a post is tagged with, each one removable.
 *
 * Every removal is its own request and answers with the tags that remain, so
 * the post's "is with ..." line follows along while this stays open - and it
 * closes itself once nobody is left to list.
 */
function EditTagsModal({
  postId,
  tagging,
  onChange,
  onClose,
}: {
  postId: string;
  tagging: ITagging[];
  onChange: (tagging: ITagging[]) => void;
  onClose: () => void;
}) {
  const [removingId, setremovingId] = useState<string | null>(null);

  const removeTag = (entityId: string) => {
    setremovingId(entityId);
    RemovePostTagRequest(postId, entityId)
      .then((remaining) => {
        onChange(remaining);
        if (remaining.length === 0) onClose();
      })
      .catch((err) => {
        console.log(err);
        notifyRequestError(err, "We couldn't remove that tag.");
      })
      .finally(() => setremovingId(null));
  };

  return (
    <Modal
      component={
        <div className="cl-profile-surface tw-w-[calc(100%-24px)] tw-max-w-[420px] tw-p-[18px] tw-flex tw-flex-col tw-gap-[10px] tw-rounded-[12px]">
          <div className="tw-w-full tw-flex tw-items-center tw-gap-[8px]">
            <FaUserTag style={{ fontSize: "17px", color: "var(--text)" }} />
            <span className="tw-flex-1 cl-text-body tw-font-semibold">
              Tagged people
            </span>
            <button
              onClick={onClose}
              aria-label="Close"
              className="tw-w-[28px] tw-h-[28px] tw-flex tw-items-center tw-justify-center tw-rounded-full tw-border-none tw-bg-transparent hover:tw-bg-[var(--surface-hover)] tw-cursor-pointer"
            >
              <IoClose style={{ fontSize: "18px", color: "var(--text)" }} />
            </button>
          </div>
          <div className="tw-w-full tw-flex tw-flex-col tw-gap-[4px] tw-max-h-[320px] tw-overflow-y-auto">
            {tagging.map((tag) => {
              const details = tag.entity.details;
              const name = taggedEntityName(tag.entity);
              return (
                <div
                  key={tag.post_tag_id}
                  className="tw-w-full tw-flex tw-items-center tw-gap-[10px] tw-py-[6px]"
                >
                  <Avatar
                    id={details.username ?? details.slug ?? tag.entity.id}
                    entityId={tag.entity.id}
                    name={name}
                    src={
                      details.profile && details.profile !== "none"
                        ? details.profile
                        : undefined
                    }
                    kind={tag.entity.type}
                    size={32}
                  />
                  <span className="tw-flex-1 tw-min-w-0 tw-truncate cl-text-body-sm tw-font-semibold">
                    {name}
                  </span>
                  <button
                    disabled={removingId !== null}
                    onClick={() => removeTag(tag.entity.id)}
                    className="cl-profile-action-button--secondary tw-cursor-pointer tw-font-semibold tw-font-Inter tw-p-[6px] tw-pl-[10px] tw-pr-[10px] tw-rounded-[12px] cl-text-caption disabled:tw-opacity-[0.6] disabled:tw-cursor-not-allowed"
                  >
                    {removingId === tag.entity.id ? "Removing…" : "Remove"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      }
    />
  );
}

export default EditTagsModal;
