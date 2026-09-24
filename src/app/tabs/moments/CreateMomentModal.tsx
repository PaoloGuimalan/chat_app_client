/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Modal from "@/app/reusables/Modal";
import { Avatar, Btn, Icon, SegTabs, Toggle } from "@/reusables/design";
import { CreateMomentRequest, GetPostPreviewRequest, UploadMediaRequest } from "@/reusables/hooks/requests";
import { SET_MUTATE_ALERTS } from "@/redux/types";
import { getActiveAvatar } from "@/reusables/hooks/reusable";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@/reusables/vars/uploads";
import type {
  AuthenticationInterface,
  EphemeralAudience,
  IPost,
} from "@/reusables/vars/interfaces";
import {
  MOMENTS_CHANGED_EVENT,
  AUDIENCES,
  MOMENT_CAPTION_MAX_LENGTH,
  charCount,
  entityName,
} from "./ephemeral";

type MomentKind = "photo" | "video" | "shared";

/**
 * The ORIGINAL inside a shared post that is itself a share - one level, the
 * same nesting a feed post card shows. Fetched on its own; a post that is
 * gone or hidden says so rather than vanishing.
 */
function NestedOriginal({ postId }: { postId: string }) {
  const [original, setOriginal] = useState<IPost | null | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    GetPostPreviewRequest({ postID: postId })
      .then((post) => !cancelled && setOriginal(post ?? null))
      .catch(() => !cancelled && setOriginal(null));
    return () => {
      cancelled = true;
    };
  }, [postId]);
  if (original === undefined) {
    return <div style={{ height: 60, borderRadius: "var(--r-sm)", background: "var(--surface-2)" }} />;
  }
  if (original === null) {
    return (
      <div style={{ padding: 10, borderRadius: "var(--r-sm)", border: "1px solid var(--border)", color: "var(--text-3)", fontSize: "var(--fs-caption)" }}>
        The original post is no longer available.
      </div>
    );
  }
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
      <SharedPostCard post={original} compact nested />
    </div>
  );
}

/** The shared post as the preview and the viewer draw it: a card on a dark stage. */
export function SharedPostCard({
  post,
  onOpen,
  compact = false,
  nested = false,
}: {
  post: IPost;
  onOpen?: () => void;
  compact?: boolean;
  /** Drawn inside another shared post: flat, and never nests again. */
  nested?: boolean;
}) {
  // A reshare: the feed marks it `is_shared`, and its reference is the
  // ORIGINAL post's id (not always typed "shared_post"), so both are checked.
  const isReshare = post.is_shared || post.file_type === "shared_post";
  const reshared: string | null = isReshare
    ? ((post.references?.find((r: any) => r.reference_media_type?.includes("shared_post")) ??
        post.references?.[0]) as any)?.reference ?? null
    : null;
  const media = isReshare
    ? null
    : (post.references?.find(
        (r: any) => r.reference_media_type && !r.reference_media_type.includes("shared_post"),
      ) as any);
  const isVideo = media?.reference_media_type?.startsWith("video");
  return (
    <div
      style={{
        background: "var(--surface)",
        borderRadius: nested ? 0 : "var(--r-md)",
        boxShadow: nested ? "none" : "0 12px 40px rgba(0,0,0,.35)",
        padding: compact ? 12 : 14,
        display: "flex",
        flexDirection: "column",
        gap: compact ? 8 : 9,
        textAlign: "left",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <Avatar
          id={post.entity?.id}
          entityId={post.entity?.id}
          name={entityName(post.entity)}
          src={post.entity?.details?.profile !== "none" ? post.entity?.details?.profile : undefined}
          size={compact ? 26 : 30}
        />
        <span style={{ fontSize: "var(--fs-body-sm)", fontWeight: 600, color: "var(--text)" }}>
          {entityName(post.entity)}
        </span>
      </div>
      {post.caption && (
        <span className="ellipsis-3-lines" style={{ fontSize: compact ? "var(--fs-caption)" : "var(--fs-body-sm)", color: "var(--text)" }}>
          {post.caption}
        </span>
      )}
      {reshared && !nested && <NestedOriginal postId={reshared} />}
      {media && (
        <div style={{ height: compact ? 100 : 150, borderRadius: "var(--r-sm)", overflow: "hidden", background: "var(--surface-2)" }}>
          {isVideo ? (
            // A real player, not a black box: the small preview (Create
            // Moment) plays it muted on a loop; the viewer's card has
            // controls. `#t=0.1` paints a first frame before it loads.
            <video
              src={`${media.reference}#t=0.1`}
              muted
              playsInline
              preload="metadata"
              {...(compact ? { autoPlay: true, loop: true } : { controls: true })}
              onClick={(e) => e.stopPropagation()}
              style={{ width: "100%", height: "100%", objectFit: "cover", background: "#000" }}
            />
          ) : (
            <img src={media.reference} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
        </div>
      )}
      {onOpen && (
        <button
          onClick={onOpen}
          style={{ alignSelf: "flex-start", border: "none", background: "transparent", padding: 0, cursor: "pointer", fontSize: "var(--fs-caption)", color: "var(--brand)", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}
        >
          View post <Icon n="arrow_forward" s={14} />
        </button>
      )}
    </div>
  );
}

/**
 * Create Moment (design 1d): a live preview on the left, and on the right the
 * type (Photo / Video / Share a post), a caption of up to 120 characters,
 * who can see it, and whether it takes replies & reactions.
 *
 * "Share a post" needs a post, so it is only available when the modal is
 * opened from a post's Share menu ("Add to Moment"), which passes it in.
 * The design's text/sticker/crop tools are deferred; only Replace ships.
 */
function CreateMomentModal({
  onClose,
  sharedPost = null,
}: {
  onClose: () => void;
  sharedPost?: IPost | null;
}) {
  const dispatch = useDispatch();
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );
  const activeAvatar = getActiveAvatar(authentication);
  // Narrow screens stack the preview over the form and scroll the whole
  // modal; side by side they need ~760px, and below that the form was
  // squeezed until "Share Moment" fell off the edge.
  const screenWidth: number = useSelector((state: any) => state.screensizelistener?.W ?? window.innerWidth);
  const compact = screenWidth < 760;

  const [kind, setKind] = useState<MomentKind>(sharedPost ? "shared" : "photo");
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [audience, setAudience] = useState<EphemeralAudience>(
    authentication.user.isPrivate ? "connections" : "public",
  );
  const [allowReplies, setAllowReplies] = useState(true);
  const [sharing, setSharing] = useState(false);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const alert = (type: string, content: string) =>
    dispatch({ type: SET_MUTATE_ALERTS, payload: { alerts: { type, content } } });

  const pick = () => fileInput.current?.click();

  const onPicked = (picked: File | undefined) => {
    if (!picked) return;
    const wanted = kind === "video" ? "video" : "image";
    if (!picked.type.startsWith(wanted)) {
      alert("warning", kind === "video" ? "Pick a video for a video Moment." : "Pick a photo for a photo Moment.");
      return;
    }
    if (picked.size > MAX_UPLOAD_BYTES) {
      alert("warning", `Files must be ${MAX_UPLOAD_LABEL} or smaller.`);
      return;
    }
    setFile(picked);
  };

  const switchKind = (next: string) => {
    if (next === "shared" && !sharedPost) return;
    if (next !== kind) setFile(null);
    setKind(next as MomentKind);
  };

  const captionLength = charCount(caption);
  const ready =
    !sharing &&
    captionLength <= MOMENT_CAPTION_MAX_LENGTH &&
    (kind === "shared" ? !!sharedPost : !!file);

  const share = async () => {
    if (!ready) return;
    setSharing(true);
    try {
      let reference = null;
      if (kind !== "shared" && file) {
        const upload: any = await UploadMediaRequest(
          [{ file, referenceMediaType: file.type }],
          "post",
        );
        const uploaded = upload.data.result[0];
        reference = {
          reference: uploaded.fileDetails.data,
          referenceMediaType: uploaded.fileType,
          name: uploaded.fileName,
        };
      }
      await CreateMomentRequest({
        reference,
        sharedPostID: kind === "shared" ? sharedPost?.post_id : null,
        caption: caption.trim(),
        privacy: audience,
        allowReplies,
      });
      window.dispatchEvent(new CustomEvent(MOMENTS_CHANGED_EVENT));
      alert("success", "Your Moment is live for 24 hours.");
      onClose();
    } catch (err: any) {
      alert("warning", err?.message || "We couldn't share your Moment.");
      setSharing(false);
    }
  };

  const isVideoFile = file?.type.startsWith("video");

  return (
    <Modal
      component={
        // No "cl-redesign" here: Modal portals into the page's themed wrapper,
        // and a bare nested .cl-redesign resets to the LIGHT tokens.
        <div
          style={{
            width: compact ? "calc(100vw - 16px)" : "min(860px, calc(100vw - 24px))",
            height: compact ? "calc(100vh - 16px)" : "min(640px, calc(100vh - 24px))",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-lg)",
            boxShadow: "var(--shadow-lg)",
            display: "flex",
            flexDirection: compact ? "column" : "row",
            overflowX: "hidden",
            overflowY: compact ? "auto" : "hidden",
          }}
        >
          {/* Preview */}
          <div
            style={{
              width: compact ? "100%" : 380,
              flex: "none",
              padding: compact ? "14px 0" : 0,
              background: "var(--surface-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRight: compact ? "none" : "1px solid var(--border)",
              borderBottom: compact ? "1px solid var(--border)" : "none",
            }}
          >
            <div
              style={{
                width: compact ? 200 : 320,
                height: compact ? 356 : 568,
                maxHeight: compact ? undefined : "calc(100% - 32px)",
                borderRadius: "var(--r-lg)",
                overflow: "hidden",
                position: "relative",
                background: kind === "shared" ? "linear-gradient(165deg,#14233b,#3b6fe0)" : "linear-gradient(165deg,#e69500,#ff5b6b 55%,#8b5cf6)",
              }}
            >
              {previewUrl && (isVideoFile ? (
                <video src={previewUrl} autoPlay muted loop playsInline style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <img src={previewUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              ))}
              {kind === "shared" && sharedPost && (
                <div style={{ position: "absolute", left: 20, right: 20, top: "50%", transform: "translateY(-50%)" }}>
                  <SharedPostCard post={sharedPost} compact />
                </div>
              )}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(0,0,0,.4),rgba(0,0,0,0) 22%,rgba(0,0,0,0) 70%,rgba(0,0,0,.45))", pointerEvents: "none" }} />
              <div style={{ position: "absolute", top: 12, left: 12, right: 12, height: 3, borderRadius: 2, background: "rgba(255,255,255,.5)" }} />
              <div style={{ position: "absolute", top: 24, left: 12, display: "flex", alignItems: "center", gap: 8, color: "#fff" }}>
                <span style={{ display: "inline-flex", borderRadius: "50%", boxShadow: "0 0 0 2px #fff", flex: "none" }}><Avatar id={authentication.user.userID} name={activeAvatar.name} src={activeAvatar.src} size={30} online={false} /></span>
                <span style={{ fontSize: "var(--fs-body-sm)", fontWeight: 700 }}>Your Moment</span>
              </div>
              {caption.trim() && (
                <div style={{ position: "absolute", left: 16, right: 16, bottom: 52, textAlign: "center", color: "#fff", fontSize: 20, fontWeight: 800, textShadow: "0 2px 10px rgba(0,0,0,.3)", wordBreak: "break-word" }}>
                  {caption}
                </div>
              )}
              {kind !== "shared" && !file && (
                <button
                  onClick={pick}
                  style={{ position: "absolute", inset: 0, margin: "auto", width: 170, height: 44, borderRadius: 999, border: "none", background: "rgba(0,0,0,.45)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: "var(--fs-body-sm)", fontWeight: 700 }}
                >
                  <Icon n={kind === "video" ? "videocam" : "add_photo_alternate"} s={18} />
                  {kind === "video" ? "Choose a video" : "Choose a photo"}
                </button>
              )}
              {kind !== "shared" && file && (
                <button
                  onClick={pick}
                  style={{ position: "absolute", left: 12, bottom: 12, display: "inline-flex", alignItems: "center", gap: 4, height: 28, padding: "0 10px", borderRadius: 999, border: "none", background: "rgba(0,0,0,.45)", color: "#fff", fontSize: "var(--fs-meta)", fontWeight: 650, cursor: "pointer" }}
                >
                  <Icon n="swap_horiz" s={15} />
                  Replace
                </button>
              )}
              <input
                ref={fileInput}
                type="file"
                accept={kind === "video" ? "video/*" : "image/*"}
                style={{ display: "none" }}
                onChange={(e) => {
                  onPicked(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          {/* Form */}
          <div style={{ flex: compact ? "none" : 1, minWidth: 0, display: "flex", flexDirection: "column", padding: compact ? "16px" : "20px 22px", overflowY: compact ? "visible" : "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 34, height: 34, borderRadius: "var(--r-sm)", background: "var(--brand-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon n="auto_awesome_motion" s={18} c="var(--brand)" />
                </span>
                <span style={{ fontSize: "var(--fs-heading)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text)" }}>
                  Create Moment
                </span>
              </div>
              <button onClick={onClose} aria-label="Close" style={{ width: 34, height: 34, borderRadius: "var(--r-sm)", border: "1px solid var(--border)", background: "transparent", color: "var(--text-2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon n="close" s={18} />
              </button>
            </div>

            <SegTabs
              tabs={[
                { key: "photo", label: "Photo", icon: "image" },
                { key: "video", label: "Video", icon: "videocam" },
                ...(sharedPost ? [{ key: "shared", label: "Share a post", icon: "repeat" }] : []),
              ]}
              value={kind}
              onChange={switchKind}
              style={{ display: "flex", marginBottom: 18 }}
            />

            <span style={{ fontSize: "var(--fs-meta)", fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Caption</span>
            <div style={{ display: "flex", alignItems: "center", gap: 7, height: 40, padding: "0 12px", background: "var(--input)", border: `1px solid ${captionLength > MOMENT_CAPTION_MAX_LENGTH ? "var(--pink)" : "var(--border)"}`, borderRadius: "var(--r-sm)", marginBottom: 18 }}>
              <input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Say something about it…"
                style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", color: "var(--text)", fontSize: "var(--fs-label)" }}
              />
              <span style={{ fontSize: "var(--fs-meta)", color: captionLength > MOMENT_CAPTION_MAX_LENGTH ? "var(--pink)" : "var(--text-3)" }}>
                {captionLength}/{MOMENT_CAPTION_MAX_LENGTH}
              </span>
            </div>

            <span style={{ fontSize: "var(--fs-meta)", fontWeight: 600, color: "var(--text-2)", marginBottom: 8 }}>Who can see this</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
              {AUDIENCES.map((option) => {
                const on = audience === option.key;
                return (
                  <button
                    key={option.key}
                    onClick={() => setAudience(option.key)}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: "var(--r-md)", border: `1px solid ${on ? "var(--brand)" : "var(--border)"}`, background: on ? "var(--brand-soft)" : "transparent", cursor: "pointer", textAlign: "left" }}
                  >
                    <span style={{ width: 36, height: 36, borderRadius: "var(--r-sm)", background: "var(--surface-3)", color: "var(--text-2)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                      <Icon n={option.icon} s={19} />
                    </span>
                    <span style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: "var(--fs-title)", fontWeight: 700, color: "var(--text)" }}>{option.label}</span>
                      <span style={{ fontSize: "var(--fs-caption)", color: "var(--text-2)" }}>{option.desc}</span>
                    </span>
                    <span style={{ width: 20, height: 20, borderRadius: "50%", border: on ? "6px solid var(--brand)" : "2px solid var(--border-2)", boxSizing: "border-box", flex: "none" }} />
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 2px" }}>
              <span style={{ flex: 1, fontSize: "var(--fs-body-sm)", fontWeight: 600, color: "var(--text)" }}>Allow replies &amp; reactions</span>
              <Toggle on={allowReplies} onChange={setAllowReplies} />
            </div>

            <div style={{ marginTop: "auto", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
              <Icon n="timer" s={18} c="var(--text-3)" />
              <span style={{ flex: "1 1 160px", fontSize: "var(--fs-caption)", color: "var(--text-2)" }}>
                Disappears from the feed after 24 hours
              </span>
              <Btn variant="outline" onClick={onClose} disabled={sharing}>Cancel</Btn>
              <Btn onClick={share} disabled={!ready}>{sharing ? "Sharing…" : "Share Moment"}</Btn>
            </div>
          </div>
        </div>
      }
    />
  );
}

export default CreateMomentModal;
