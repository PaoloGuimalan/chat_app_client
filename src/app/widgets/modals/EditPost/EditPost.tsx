import { ContributionAvatar } from "@/app/reusables/ContributionAuthor";
import { contributionAuthor } from "@/reusables/hooks/contributionIdentity";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";

import type { IPost } from "@/reusables/vars/interfaces";
import { UpdatePostRequest } from "@/reusables/hooks/requests";
import { uploadFiles } from "@/reusables/hooks/mediaUpload";
import { limitFor } from "@/reusables/vars/uploads";
import { resolveErrorMessage } from "@/reusables/hooks/errormessages";
import { editablePostMedia, postEditDirty, postEditFields, postMediaDraft, type PostEditMedia } from "@/reusables/hooks/postEditing";
import { publishPostUpdate } from "@/reusables/hooks/postUpdates";
import CachedImage from "@/app/reusables/cachers/CachedImage";
import VideoPlayer from "@/app/reusables/VideoPlayer";
import PostPrivacyIcon from "@/app/reusables/PostPrivacyIcon";
import PostEditLayout from "./PostEditLayout";

export default function EditPost({ post, onClose, asPage = false }: { post: IPost; onClose: () => void; asPage?: boolean }) {
  const [caption, setCaption] = useState(post.caption || "");
  const [media, setMedia] = useState(() => postMediaDraft(post));
  const [selected, setSelected] = useState(0);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const token = useRef(localStorage.getItem("authtoken") || "").current;
  const alive = useRef(true);
  const leaving = useRef(false);
  const busy = useRef(false);
  const abort = useRef<AbortController | null>(null);
  const localUrls = useRef(new Set<string>());
  const uploads = useRef(new Map<string, string>());
  const dirty = postEditDirty(post, caption, media);
  const current = useRef({ dirty, saving });
  current.current = { dirty, saving };
  const canEditMedia = editablePostMedia(post);
  const canSave = dirty && (Boolean(caption.trim()) || media.length > 0);
  const entity = contributionAuthor(post);
  const author = entity?.details;
  const name = !author ? "Anonymous member" : entity?.type === "user"
    ? [author.first_name, author.middle_name !== "N/A" && author.middle_name, author.last_name].filter(Boolean).join(" ")
    : author.name || "";

  useEffect(() => {
    alive.current = true;
    const urls = localUrls.current;
    const index = window.history.state?.idx;
    let restoring = false;
    const unload = (event: BeforeUnloadEvent) => {
      if (!leaving.current && (current.current.dirty || busy.current)) { event.preventDefault(); event.returnValue = ""; }
    };
    const pop = (event: PopStateEvent) => {
      if (restoring) { restoring = false; event.stopImmediatePropagation(); return; }
      if (leaving.current || (!current.current.dirty && !busy.current)) return;
      if (typeof index !== "number" || typeof event.state?.idx !== "number") return;
      if (!busy.current && window.confirm("Discard your changes to this post?")) return;
      event.stopImmediatePropagation();
      restoring = true;
      window.history.go(index - event.state.idx);
    };
    window.addEventListener("beforeunload", unload);
    window.addEventListener("popstate", pop, true);
    return () => {
      alive.current = false;
      abort.current?.abort();
      urls.forEach(url => URL.revokeObjectURL(url));
      window.removeEventListener("beforeunload", unload);
      window.removeEventListener("popstate", pop, true);
    };
  }, []);

  const close = () => {
    if (busy.current) return;
    if (dirty && !window.confirm("Discard your changes to this post?")) return;
    leaving.current = true;
    onClose();
  };
  const addFiles = (files: File[]) => {
    const limit = limitFor("post_media");
    const valid = files.filter(file => /^(image|video)\//.test(file.type) && file.size <= limit.maxBytes);
    if (valid.length !== files.length) setError(`Choose photos or videos up to ${limit.label} each.`);
    else setError("");
    const additions = valid.map(file => {
      const src = URL.createObjectURL(file);
      localUrls.current.add(src);
      return { key: crypto.randomUUID(), src, mime: file.type, name: file.name, file };
    });
    if (additions.length) { setSelected(media.length); setMedia(previous => [...previous, ...additions]); }
  };
  const remove = (item: PostEditMedia, index: number) => {
    if (saving) return;
    setMedia(previous => previous.filter(candidate => candidate.key !== item.key));
    setSelected(Math.max(0, Math.min(index, media.length - 2)));
    if (localUrls.current.delete(item.src)) URL.revokeObjectURL(item.src);
    uploads.current.delete(item.key);
  };
  const save = async () => {
    if (!canSave || busy.current) return;
    if (token !== localStorage.getItem("authtoken")) { setError("Your posting identity changed. Close and reopen this post."); return; }
    busy.current = true; setSaving(true); setError("");
    abort.current = new AbortController();
    try {
      const fresh = media.filter(item => item.file && !uploads.current.has(item.key));
      if (fresh.length) {
        setProgress(0);
        const added = await uploadFiles({
          purpose: "post_media",
          files: fresh.map(item => item.file!),
          token,
          context: post.community && post.is_anonymous
            ? { community_entity_id: post.community.entity_id, is_anonymous: true }
            : undefined,
          signal: abort.current.signal,
          onProgress: value => { if (alive.current) setProgress(value); },
        });
        added.forEach((uploaded, index) => uploads.current.set(fresh[index].key, uploaded.fileUrl));
      }
      if (!alive.current || token !== localStorage.getItem("authtoken")) return;
      setProgress(null);
      const prepared = media.map(item => ({ ...item, uploadedUrl: uploads.current.get(item.key) }));
      const result = await UpdatePostRequest(post.post_id, postEditFields(post, caption, prepared), token);
      if (!alive.current || token !== localStorage.getItem("authtoken")) return;
      if (!result.status || result.post?.post_id !== post.post_id) throw new Error("Couldn't confirm the saved post. Please try again.");
      publishPostUpdate(result.post, token);
      leaving.current = true;
      onClose();
    } catch (cause) {
      if (alive.current) setError(resolveErrorMessage(cause, "We couldn't save your changes. Please try again."));
    } finally {
      busy.current = false;
      if (alive.current) { setSaving(false); setProgress(null); }
    }
  };

  const preview = (item: PostEditMedia) => item.mime.startsWith("video/")
    ? <VideoPlayer key={item.key} src={item.src} style={{ width: "100%", height: "100%" }} videoStyle={{ width: "100%", height: "100%", objectFit: "contain" }} pauseWhenHidden/>
    : <CachedImage key={item.key} src={item.src} style={{ width: "100%", height: "100%", objectFit: "contain" }}/>;

  return <PostEditLayout title="Edit post" asPage={asPage} onClose={close} footer={<>
    {!asPage && <button type="button" className="cl-post-edit__button" disabled={saving} onClick={close}>Cancel</button>}
    <button type="button" className="cl-post-edit__button cl-post-edit__button--primary" disabled={!canSave || saving} onClick={save}>
      {saving && <Loader2 className="cl-post-edit__spinner" size={16}/>}
      {saving ? progress !== null ? `Uploading ${Math.round(progress * 100)}%` : "Saving…" : "Save changes"}
    </button>
  </>}>
    <div className="cl-post-edit__author">
      <ContributionAvatar entity={entity} size={38}/>
      <div><strong>{name}</strong><span><PostPrivacyIcon community={post.community} status={post.privacy_status}/>{new Date(post.date_posted).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span></div>
    </div>
    <label className="cl-post-edit__field"><span>Caption</span>
      <textarea value={caption} onChange={event => setCaption(event.target.value)} disabled={saving} placeholder="Write a caption…" rows={4}/>
    </label>
    {canEditMedia ? <section aria-label="Attachments">
      <div className="cl-post-edit__media-heading"><span>Attachments{media.length > 0 ? ` · ${media.length}` : ""}</span>
        <button type="button" className="cl-post-edit__add" onClick={() => input.current?.click()} disabled={saving}><ImagePlus size={16}/>Add photos / videos</button>
        <input ref={input} type="file" accept="image/*,video/*" multiple hidden disabled={saving}
          onChange={event => { addFiles(Array.from(event.target.files || [])); event.target.value = ""; }}/>
      </div>
      {media.length > 0 ? <div className="cl-post-edit__gallery">
        <Carousel selectedItem={selected} onChange={setSelected} showArrows={false} showStatus={false} showThumbs={false} showIndicators={false} swipeable emulateTouch={false} useKeyboardArrows={false} infiniteLoop={false}>
          {media.map((item, index) => <div key={item.key} className="cl-post-edit__slide">
            {preview(item)}
            <button type="button" className="cl-post-edit__remove" onClick={() => remove(item, index)} disabled={saving} aria-label={`Remove attachment ${item.name}`}><Trash2 size={15}/></button>
          </div>)}
        </Carousel>
        <div className="cl-post-edit__gallery-footer">
          <span title={media[selected]?.name}>{media[selected]?.name}</span>
          <button type="button" className="cl-post-edit__icon" aria-label="Previous attachment" disabled={selected === 0} onClick={() => setSelected(value => value - 1)}><ChevronLeft size={18}/></button>
          <small>{selected + 1} / {media.length}</small>
          <button type="button" className="cl-post-edit__icon" aria-label="Next attachment" disabled={selected >= media.length - 1} onClick={() => setSelected(value => value + 1)}><ChevronRight size={18}/></button>
        </div>
      </div> : <button type="button" className="cl-post-edit__empty" onClick={() => input.current?.click()} disabled={saving}><ImagePlus size={23}/><span>Add photos or videos</span></button>}
    </section> : (post.content_type === "profile" || post.content_type === "cover_photo") ? <section>
      <p className="cl-post-edit__media-heading">{post.content_type === "profile" ? "Profile photo" : "Cover photo"}</p>
      {media[0] && <div className={`cl-post-edit__fixed ${post.content_type === "cover_photo" ? "cl-post-edit__fixed--cover" : ""}`}>{preview(media[0])}</div>}
    </section> : <p className="cl-post-edit__notice">The shared post stays attached. You can update your caption.</p>}
    {!caption.trim() && media.length === 0 && <p className="cl-post-edit__notice">Keep a caption or at least one attachment.</p>}
    {error && <p className="cl-post-edit__error" role="alert">{error}</p>}
  </PostEditLayout>;
}
