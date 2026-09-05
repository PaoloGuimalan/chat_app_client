import { IFeedReason, IFlexibleEntity } from "@/reusables/vars/interfaces";
import { Avatar } from "@/reusables/design";
import { useNavigate } from "react-router-dom";

/**
 * "Paolo Guimalan commented on this post" - the line above a feed card saying
 * why it is in front of you.
 *
 * The newsfeed is fan-out-on-write, and MOST rows are there because you follow
 * the author, which needs no explanation. The rows that do are the ones a third
 * party caused: somebody you follow commented on a post by someone you may not
 * follow at all, and without a line like this the post reads as if it arrived
 * from nowhere. The backend only sends `feed_reason` for those (see
 * SILENT_FEED_REASONS in newsfeed/helpers/query_functions.py), so this renders
 * whenever it is present and nothing when it is not.
 *
 * A reason `type` this build does not recognise renders NOTHING rather than
 * raw text: a newer server may start sending reasons this one has no phrasing
 * for, and "sponsored on this post" is worse than silence.
 */

const PHRASES: Record<string, string> = {
  comment: "commented on this post",
};

/** The name to show: what the card header would call them, handle as fallback. */
const displayNameOf = (entity: IFlexibleEntity): string => {
  const details = entity?.details;
  if (!details) return "";

  if (entity.type === "user") {
    const full = `${details.first_name ?? ""} ${details.last_name ?? ""}`.trim();
    return full || (details.username ? `@${details.username}` : "");
  }

  return details.name || (details.slug ? `@${details.slug}` : "");
};

const profilePathOf = (entity: IFlexibleEntity): string | null => {
  const details = entity?.details;
  if (!details) return null;

  const handle = entity.type === "user" ? details.username : details.slug;
  return handle ? `/${handle}` : null;
};

function FeedReasonBanner({ reason }: { reason: IFeedReason }) {
  const navigate = useNavigate();

  const phrase = PHRASES[reason?.type];
  const name = displayNameOf(reason?.entity);
  if (!phrase || !name) return null;

  const path = profilePathOf(reason.entity);
  const details = reason.entity.details;

  return (
    <div className="cl-feed-reason">
      {/* No leading glyph. The avatar already says this line is about a
          PERSON, and a second icon beside it only competed with the author
          avatar directly below - two icons stacked six pixels apart read as
          one control, not two pieces of information. */}
      <Avatar
        id={details.username ?? details.slug ?? reason.entity.id}
        name={name}
        src={details.profile && details.profile !== "none" ? details.profile : undefined}
        size={20}
      />
      <span className="cl-feed-reason__text cl-text-caption">
        <button
          type="button"
          className="cl-feed-reason__name"
          disabled={!path}
          onClick={() => path && navigate(path)}
        >
          {name}
        </button>{" "}
        {phrase}
      </span>
    </div>
  );
}

export default FeedReasonBanner;
