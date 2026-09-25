import { CSSProperties, useRef, useState } from "react";
import CachedImage from "@/app/reusables/cachers/CachedImage";

/**
 * The tallest a post's only photo or video may stand in a feed card. A
 * portrait phone shot at full card width would otherwise be taller than the
 * screen.
 */
const MAX_HEIGHT = "min(600px, 75vh)";

/** Until the media says otherwise - the common landscape shape. */
const DEFAULT_RATIO = 16 / 9;

/**
 * A post's only photo or video: always the card's full width, and as tall as
 * its own shape makes it - up to MAX_HEIGHT, past which it covers the box
 * (cropped top and bottom) rather than standing in a narrow strip. The
 * carousel is where it is shown whole.
 *
 * References carry no dimensions, so the shape comes from the media itself
 * once it loads (an image's natural size, a video's metadata).
 *
 * Sized with inline styles and no `tw-*` classes on the media: those are all
 * `!important`, and would beat the computed height.
 */
function FittedPostMedia({
  kind,
  src,
  onClick,
}: {
  kind: "image" | "video";
  src: string;
  /** Images open the post's carousel. */
  onClick?: () => void;
}) {
  const [ratio, setRatio] = useState(DEFAULT_RATIO);
  const imageRef = useRef<HTMLImageElement>(null);
  const shape = ratio.toFixed(4);

  const learn = (width: number, height: number) => {
    if (width > 0 && height > 0) setRatio(width / height);
  };

  // Width is fixed at the card's; the ratio gives the height, and max-height
  // caps it - at which point the box is wider than the media's shape, and
  // `cover` fills it.
  const style: CSSProperties = {
    display: "block",
    width: "100%",
    height: "auto",
    aspectRatio: shape,
    maxHeight: MAX_HEIGHT,
    objectFit: "cover",
  };

  return (
    <div className="tw-flex tw-w-full tw-bg-[var(--surface-2)]">
      {kind === "video" ? (
        <video
          controls
          playsInline
          preload="metadata"
          src={src}
          onLoadedMetadata={(e) =>
            learn(e.currentTarget.videoWidth, e.currentTarget.videoHeight)
          }
          style={style}
        />
      ) : (
        <CachedImage
          ref={imageRef}
          src={src}
          onClick={onClick}
          onLoad={() =>
            learn(
              imageRef.current?.naturalWidth ?? 0,
              imageRef.current?.naturalHeight ?? 0,
            )
          }
          style={style}
        />
      )}
    </div>
  );
}

export default FittedPostMedia;
