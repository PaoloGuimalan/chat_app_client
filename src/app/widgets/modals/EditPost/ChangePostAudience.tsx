import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import type { IPost } from "@/reusables/vars/interfaces";
import { PRIVACY_OPTIONS } from "@/reusables/hooks/postPrivacy";
import { UpdatePostRequest } from "@/reusables/hooks/requests";
import { publishPostUpdate } from "@/reusables/hooks/postUpdates";
import { resolveErrorMessage } from "@/reusables/hooks/errormessages";
import PostEditLayout from "./PostEditLayout";

export default function ChangePostAudience({ post, onClose }: { post: IPost; onClose: () => void }) {
  const [audience, setAudience] = useState(post.privacy_status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const token = useRef(localStorage.getItem("authtoken") || "").current;
  const alive = useRef(true);
  const busy = useRef(false);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const close = () => { if (!busy.current) onClose(); };
  const save = async () => {
    if (busy.current || audience === post.privacy_status) return;
    if (token !== localStorage.getItem("authtoken")) { setError("Your posting identity changed. Reopen this post."); return; }
    busy.current = true; setSaving(true); setError("");
    try {
      const result = await UpdatePostRequest(post.post_id, { privacy_status: audience }, token);
      if (!alive.current || token !== localStorage.getItem("authtoken")) return;
      if (!result.status || result.post?.post_id !== post.post_id) throw new Error("Couldn't confirm the saved audience.");
      publishPostUpdate(result.post, token);
      onClose();
    } catch (cause) {
      if (alive.current) setError(resolveErrorMessage(cause, "We couldn't change the audience. Please try again."));
    } finally { busy.current = false; if (alive.current) setSaving(false); }
  };
  return <PostEditLayout title="Change audience" audience onClose={close} footer={<>
    <button type="button" className="cl-post-edit__button" onClick={close} disabled={saving}>Cancel</button>
    <button type="button" className="cl-post-edit__button cl-post-edit__button--primary" onClick={save} disabled={saving || audience === post.privacy_status}>
      {saving && <Loader2 className="cl-post-edit__spinner" size={16}/>}{saving ? "Saving…" : "Save audience"}
    </button>
  </>}>
    <p className="cl-post-edit__description">Who can see this post?</p>
    <div className="cl-post-edit__choices" role="radiogroup" aria-label="Post audience">
      {PRIVACY_OPTIONS.map(option => <label key={option.value} className="cl-post-edit__choice">
        <span className="cl-post-edit__choice-icon">{option.icon}</span>
        <span><strong>{option.label}</strong><small>{option.hint}</small></span>
        <input type="radio" name="post-audience" value={option.value} checked={audience === option.value} disabled={saving} onChange={() => setAudience(option.value)}/>
      </label>)}
    </div>
    {post.privacy_status === "custom" && <p className="cl-post-edit__notice">This post currently uses a custom audience. Choose an option to replace it.</p>}
    {error && <p className="cl-post-edit__error" role="alert">{error}</p>}
  </PostEditLayout>;
}
