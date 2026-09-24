/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CSSProperties } from "react";
import { Icon } from "@/reusables/design";
import type { IPost } from "@/reusables/vars/interfaces";

const SHARED_BG = "linear-gradient(165deg,#14233b,#3b6fe0)";
const FILL: CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" };

/**
 * A moment's small preview - the reply chip, "More from ... today", the
 * archive. Its photo; a video's FIRST FRAME (`#t=0.1` makes the browser paint
 * one instead of a black box); or, for a shared post, that post's own photo
 * or video, which the server resolves as `shared_preview` (through one level
 * of re-sharing). Only a text-only share falls back to the gradient.
 */
function MomentThumb({ post, style, iconSize = 16 }: { post: IPost; style?: CSSProperties; iconSize?: number }) {
  const shared = post.file_type === "shared_post";
  const ref = post.references?.[0] as any;
  const src: string | null | undefined = shared ? post.shared_preview?.thumbnail : ref?.reference;
  const type: string | null | undefined = shared ? post.shared_preview?.media_type : ref?.reference_media_type;
  const isVideo = !!type?.startsWith("video");
  return (
    <span style={{ position: "relative", display: "inline-block", overflow: "hidden", flex: "none", background: SHARED_BG, ...style }}>
      {src &&
        (isVideo ? (
          <video src={`${src}#t=0.1`} muted playsInline preload="metadata" style={FILL} />
        ) : (
          <img src={src} alt="" style={FILL} />
        ))}
      {shared && !src && (
        <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,.85)" }}>
          <Icon n="repeat" s={iconSize} />
        </span>
      )}
    </span>
  );
}

export default MomentThumb;
