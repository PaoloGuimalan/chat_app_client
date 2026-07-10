import { CSSProperties, useState } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { FaPlay } from "react-icons/fa";
import CachedImage from "./cachers/CachedImage";
import { LinkPreviewData } from "@/reusables/hooks/useLinkPreview";
import envs from "@/reusables/hooks/env_configs";

// image/favicon come back as relative proxy paths (see
// newsfeed/services/link_preview.py's build_image_proxy_path) except for
// the rare data: URI case (inline bytes, nothing to prepend). embed_url is
// never proxied - it's a real iframe destination (YouTube/Vimeo/etc.), not
// a passive asset, so it's used as-is once the user opts in by clicking play.
function resolveImageSrc(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (/^(https?:|data:)/.test(path)) return path;
  return `${envs.USER_SERVICE_API}${path}`;
}

const PORTRAIT_MAX_WIDTH = 320;

function LinkPreviewCard({
  preview,
  variant,
  onRemove,
}: {
  preview: LinkPreviewData | null | undefined;
  variant: "composer" | "display";
  onRemove?: () => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!preview || preview.status !== "ok") return null;

  const imageSrc = resolveImageSrc(preview.image);
  const faviconSrc = resolveImageSrc(preview.favicon);
  const href = preview.resolved_url || preview.url || "#";
  const hasEmbed = !!(preview.embed_type && preview.embed_url);
  const layout = preview.embed_layout || "auto";

  // "auto" (YouTube/Vimeo/SoundCloud - genuine video, trust the reported
  // ratio): full width, height follows the aspect ratio.
  // "landscape" (Spotify/Twitter - a compact fixed-height player, not a
  // video): full width, but a literal fixed height - scaling it
  // proportionally with card width would leave empty space below the
  // actual player UI, since these don't grow taller as they get wider.
  // "portrait" (TikTok - a real vertical video): full card width would
  // make the card absurdly tall, so the embed's *width* is constrained
  // instead and height follows the aspect ratio from there.
  const mediaContainerStyle: CSSProperties =
    layout === "landscape"
      ? { width: "100%", height: preview.embed_height || 200 }
      : layout === "portrait"
        ? {
            width: PORTRAIT_MAX_WIDTH,
            aspectRatio: `${preview.embed_width || 9} / ${preview.embed_height || 16}`,
            margin: "0 auto",
          }
        : {
            width: "100%",
            aspectRatio: `${preview.embed_width || 16} / ${preview.embed_height || 9}`,
          };

  const mediaArea = hasEmbed ? (
    isPlaying ? (
      <div className=" tw-overflow-hidden" style={mediaContainerStyle}>
        <iframe
          src={preview.embed_url as string}
          className="tw-w-full tw-h-full tw-border-none"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
          referrerPolicy="strict-origin-when-cross-origin"
          title={preview.title || preview.embed_provider || "Embedded media"}
        />
      </div>
    ) : (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsPlaying(true);
        }}
        aria-label={`Play ${preview.embed_provider || "video"}`}
        className="tw-relative tw-block tw-border-none tw-p-0 tw-m-0 tw-cursor-pointer tw-bg-black tw-overflow-hidden"
        style={mediaContainerStyle}
      >
        {imageSrc && (
          <CachedImage
            src={imageSrc}
            className="tw-w-full tw-h-full tw-object-cover tw-opacity-90"
          />
        )}
        <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center">
          <div className="tw-w-[52px] tw-h-[52px] tw-rounded-full tw-bg-[rgba(0,0,0,0.6)] tw-flex tw-items-center tw-justify-center">
            <FaPlay size={18} color="white" style={{ marginLeft: "3px" }} />
          </div>
        </div>
      </button>
    )
  ) : (
    imageSrc && (
      <CachedImage
        src={imageSrc}
        className="tw-w-full tw-max-h-[160px] tw-object-cover"
      />
    )
  );

  const infoArea = (
    <div className="tw-flex tw-flex-col tw-gap-[4px] tw-p-[10px]">
      <div className="tw-flex tw-items-center tw-gap-[6px]">
        {faviconSrc && (
          <img
            src={faviconSrc}
            alt=""
            className="tw-w-[14px] tw-h-[14px] tw-rounded-[3px]"
          />
        )}
        {preview.site_name && (
          <span className="tw-text-[11px] tw-uppercase tw-tracking-wide tw-text-[var(--text-2)] tw-truncate">
            {preview.site_name}
          </span>
        )}
      </div>
      {preview.title && (
        <span className="tw-text-[13px] tw-font-semibold tw-text-[var(--text)] tw-line-clamp-2">
          {preview.title}
        </span>
      )}
      {preview.description && (
        <span className="tw-text-[12px] tw-text-[var(--text-2)] tw-line-clamp-2">
          {preview.description}
        </span>
      )}
    </div>
  );

  // With a playable embed, only the info text links out (clicking the
  // media area plays instead of navigating) - without one, the whole card
  // is a link, same as before.
  const cardInner = (
    <div className="tw-w-full tw-flex tw-flex-col tw-overflow-hidden tw-rounded-[var(--r-md)] tw-border tw-border-[var(--border)] tw-bg-[var(--surface-2)]">
      {hasEmbed && layout === "portrait" ? (
        <div className="tw-w-full tw-flex tw-justify-center tw-pt-[10px]">
          {mediaArea}
        </div>
      ) : (
        mediaArea
      )}
      {hasEmbed && variant === "display" ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="tw-no-underline"
        >
          {infoArea}
        </a>
      ) : (
        infoArea
      )}
    </div>
  );

  if (variant === "composer") {
    return (
      <div className="tw-w-full tw-relative tw-flex">
        {cardInner}
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove link preview"
          className="tw-absolute tw-top-[6px] tw-right-[6px] tw-w-[22px] tw-h-[22px] tw-rounded-full tw-bg-[var(--surface)] tw-border tw-border-[var(--border)] tw-flex tw-items-center tw-justify-center tw-cursor-pointer tw-text-[var(--text)]"
        >
          <AiOutlineClose size={12} />
        </button>
      </div>
    );
  }

  if (hasEmbed) {
    return <div className="tw-w-full tw-flex">{cardInner}</div>;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="tw-w-full tw-flex tw-no-underline"
    >
      {cardInner}
    </a>
  );
}

export default LinkPreviewCard;

