import { useCommunityPostAccess } from "@/reusables/hooks/useCommunityPostAccess";
import { AnonymousAvatar } from "@/app/reusables/ContributionAuthor";
import { Avatar, Card, Icon } from "@/reusables/design";
import { timeSince } from "@/reusables/hooks/reusable";
import { SearchPostResult } from "@/reusables/vars/interfaces";

interface ContentCardProps {
  post: SearchPostResult;
  onOpen: (post: SearchPostResult) => void;
}

// Content (post) card per the redesign mockup: author line, clamped caption,
// like/comment counters. The whole card opens the real post (preview modal
// backed by /api/newsfeed/preview/) - this card is deliberately lightweight.
function ContentCard({ post, onOpen }: ContentCardProps) {
  const communityAccessible = useCommunityPostAccess(post, () => { });
  const author = post.is_anonymous ? null : post.author;
  if (!communityAccessible) return <Card pad={14}>This post is unavailable.</Card>;
  return (
    <Card
      pad={14}
      hover
      onClick={() => onOpen(post)}
      style={{ width: "100%", cursor: "pointer" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 6,
        }}
      >
        {author ? (
          <Avatar
            id={author.entity_id}
            entityId={author.entity_id}
            name={author.display_name}
            src={author.profile ?? undefined}
            size={30}
          />
        ) : (
          <AnonymousAvatar size={30} />
        )}
        <span
          style={{
            fontWeight: 700,
            fontSize: "var(--fs-title)",
            color: "var(--text)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            minWidth: 0,
          }}
        >
          {author?.display_name || "Anonymous member"}
        </span>
        {author?.is_verified && (
          <Icon n="verified" s={14} c="var(--brand)" style={{ flex: "none" }} />
        )}
        <span
          style={{
            fontSize: "var(--fs-caption)",
            color: "var(--text-3)",
            marginLeft: "auto",
            flex: "none",
          }}
        >
          {post.date_posted ? timeSince(post.date_posted) : ""}
        </span>
      </div>
      <div
        style={{
          fontSize: "var(--fs-title)",
          color: "var(--text-2)",
          lineHeight: 1.45,
          marginBottom: 8,
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          textAlign: "left",
        }}
      >
        {post.caption}
      </div>
      <div
        style={{
          display: "flex",
          gap: 16,
          fontSize: "var(--fs-caption)",
          color: "var(--text-3)",
          alignItems: "center",
        }}
      >
        {/* Muted like the comment counter - a filled pink heart here reads as
            "you reacted to this", which is not what a search result means. */}
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <Icon n="favorite_border" s={14} c="var(--text-3)" />
          {post.likes_count}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <Icon n="mode_comment" s={14} c="var(--text-3)" />
          {post.comments_count}
        </span>
      </div>
    </Card>
  );
}

export default ContentCard;
