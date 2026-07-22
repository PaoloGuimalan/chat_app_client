import { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import { ITagging } from "@/reusables/vars/interfaces";

// Renders the "is with A, B and C" tagged-entity summary (users or realms) for
// a post header. Kept as inline flow (no block elements) so multiple tags wrap
// within the sentence instead of running together, and capped so a heavily-
// tagged post can't blow out the layout - extras collapse into "and N others".
function TaggingSummary({ tagging }: { tagging: ITagging[] }) {
  const navigate = useNavigate();

  if (!tagging || tagging.length === 0) return null;

  const MAX_VISIBLE = 3;
  const visible = tagging.slice(0, MAX_VISIBLE);
  const remaining = tagging.length - visible.length;

  const renderTag = (mptg: ITagging, key: string) => {
    const isRealm = mptg.entity.type === "realm";
    const details = mptg.entity.details;
    const name = isRealm
      ? details.name || details.slug || ""
      : `${details.first_name || ""}${
          details.middle_name && details.middle_name !== "N/A"
            ? ` ${details.middle_name}`
            : ""
        } ${details.last_name || ""}`
          .replace(/\s+/g, " ")
          .trim();
    const badged = isRealm ? details.is_verified : details.is_badged;

    return (
      <span
        key={key}
        className="cl-feed-card__title tw-font-semibold tw-select-none tw-cursor-pointer tw-inline-block tw-align-middle tw-border-solid tw-border-transparent tw-border-[0px] tw-border-b-[1px]"
        onClick={() =>
          navigate(`/${isRealm ? details.slug : details.username}`)
        }
      >
        <span className="tw-align-middle">{name}</span>
        {badged && (
          <RiVerifiedBadgeFill
            size={16}
            color="var(--brand)"
            style={{ verticalAlign: "middle", marginLeft: 2 }}
          />
        )}
      </span>
    );
  };

  return (
    <span className="tw-text-[14px] tw-min-w-0">
      is with{" "}
      {visible.map((mptg: ITagging, i: number) => {
        let separator = "";
        if (i > 0) {
          const isLastNamed = i === visible.length - 1 && remaining === 0;
          separator = isLastNamed ? " and " : ", ";
        }
        return (
          <Fragment key={i}>
            {separator}
            {renderTag(mptg, `tag-${i}`)}
          </Fragment>
        );
      })}
      {remaining > 0 && ` and ${remaining} other${remaining > 1 ? "s" : ""}`}
    </span>
  );
}

export default TaggingSummary;

