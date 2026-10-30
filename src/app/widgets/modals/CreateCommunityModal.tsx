/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import Modal from "@/app/reusables/Modal";
import { Icon } from "@/reusables/design";
import { createCommunity, type CommunityCard } from "@/reusables/hooks/communityRequests";
import { notifyRequestError } from "@/reusables/hooks/errormessages";
import { profilePathError } from "@/reusables/routing/profilePaths";
export default function CreateCommunityModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (community: CommunityCard) => void;
}) {
  const actor = useSelector((state: any) => state.authentication.active_entity_context?.id ?? state.authentication.user.entity_id);
  const startedActor = useRef(actor);
  const mounted = useRef(true);
  const pending = useRef(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [isPrivate, setPrivate] = useState(false);
  const [busy, setBusy] = useState(false);
  const slugError = profilePathError(slug.trim());
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (actor !== startedActor.current)
      onClose();
  }, [actor, onClose]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending.current || !name.trim() || !slug.trim() || slugError || actor !== startedActor.current)
      return;
    pending.current = true;
    setBusy(true);
    try {
      const response = await createCommunity({
        name: name.trim(),
        description: description.trim(),
        slug: slug.trim(),
        is_private: isPrivate,
      });
      if (mounted.current && response.status)
        onCreated(response.result);
    }
    catch (error) {
      if (mounted.current)
        notifyRequestError(error, "We couldn’t create your community.");
    }
    finally {
      pending.current = false;
      if (mounted.current)
        setBusy(false);
    }
  };
  return <Modal component={
    <form id="div_modal_container" className="cl-create-modal cl-community-create" onSubmit={submit} aria-labelledby="span_modal_header_label" aria-busy={busy}>
      <div id="div_modal_header">
        <div id="div_modal_header_label">
          <Icon n="groups" s={20} />
          <h2 id="span_modal_header_label">Create Community</h2>
        </div>
      </div>
      <div id="div_modal_input_fields" className="scroller">
        <label className="cl-create-modal-field">
          <span className="cl-create-modal-label">Name</span>
          <input className="cl-create-modal-input" required maxLength={150} value={name} disabled={busy} onChange={event => setName(event.target.value)} placeholder="Community name" />
        </label>
        <label className="cl-create-modal-field">
          <span className="cl-create-modal-label">Description</span>
          <textarea className="cl-create-modal-input" maxLength={2000} value={description} disabled={busy} onChange={event => setDescription(event.target.value)} placeholder="What brings your community together?" />
        </label>
        <div className="cl-create-modal-field">
          <label className="cl-create-modal-label" htmlFor="community-profile-link">Profile link</label>
          <input id="community-profile-link" className="cl-create-modal-input" required value={slug} disabled={busy} onChange={event => setSlug(event.target.value)} placeholder="your-community" aria-invalid={Boolean(slugError)} aria-describedby={slugError ? "community-profile-link-error" : undefined} />
          {slugError && <p id="community-profile-link-error" className="cl-community-create__error" role="alert">{slugError.message}</p>}
        </div>
        <div className="cl-create-modal-field">
          <span className="cl-create-modal-label">Privacy</span>
          <div id="div_toggle_switch_container">
            <label className="switch">
              <input type="checkbox" role="switch" aria-label="Private community" aria-describedby="community-privacy-description" checked={isPrivate} disabled={busy} onChange={event => setPrivate(event.target.checked)} />
              <span className="slider round" />
            </label>
            <span id="span_toggle_switch_label">Community is {isPrivate ? "Private" : "Public"}</span>
          </div>
          <p id="community-privacy-description" className="cl-community-create__hint">
            {isPrivate ? "Membership requires approval." : "Anyone can read; members can post."}
          </p>
        </div>
      </div>
      <footer id="div_create_cancel_btns">
        <button type="submit" aria-label={busy ? "Creating community" : "Create community"} className="btns_create_cancel" disabled={busy || !name.trim() || !slug.trim() || Boolean(slugError)}>
          {busy ? "Creating…" : "Create"}
        </button>
        <button type="button" disabled={busy} className="btns_create_cancel" onClick={onClose}>Cancel</button>
      </footer>
    </form>
  } />;
}
