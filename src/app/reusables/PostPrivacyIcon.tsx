import { Icon } from "@/reusables/design";

/**
 * The post's audience, as an icon on the timestamp line.
 *
 * Mirrors the mobile app (post_card.dart + post_composer.dart's
 * `postPrivacyIcon`): the icon sits BEFORE the date, separated by a middle dot,
 * muted to the same tone as the date, and carries no word. A label on every
 * post would be noise on the common case - most posts are public - while the
 * icon is ignorable until you look for it.
 *
 * `custom` is a real server value (an explicit allow-list, see
 * newsfeed/services/post_visibility.py) that has no composer option yet. It is
 * still restricted, so it gets the closest honest icon rather than falling
 * through to nothing - the same call the app makes.
 *
 * An unknown or missing status renders NOTHING rather than guessing at an
 * audience, which is the one thing this must not get wrong.
 */
const PRIVACY: Record<string, { icon: string; label: string }> = {
  public: { icon: "public", label: "Public" },
  connections: { icon: "group", label: "Contacts only" },
  private: { icon: "lock", label: "Only me" },
  custom: { icon: "groups", label: "Custom audience" },
};

function PostPrivacyIcon({
  status,
  size = 14,
}: {
  status?: string | null;
  size?: number;
}) {
  const meta = status ? PRIVACY[status] : undefined;
  if (!meta) return null;

  return (
    <>
      <span
        // title/aria-label because the icon carries its whole meaning alone -
        // there is no adjacent word to fall back on.
        title={meta.label}
        aria-label={meta.label}
        role="img"
        style={{
          display: "inline-flex",
          verticalAlign: "text-bottom",
          marginRight: 4,
        }}
      >
        <Icon n={meta.icon} s={size} c="var(--text-3)" />
      </span>
      <span aria-hidden="true">· </span>
    </>
  );
}

export default PostPrivacyIcon;
