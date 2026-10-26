/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import Modal from "@/app/reusables/Modal";
import { createCommunity, type CommunityCard } from "@/reusables/hooks/communityRequests";
import { resolveErrorMessage } from "@/reusables/hooks/errormessages";
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
  const [error, setError] = useState("");
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
    setError("");
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
        setError(resolveErrorMessage(error, "We couldn’t create your community."));
    }
    finally {
      pending.current = false;
      if (mounted.current)
        setBusy(false);
    }
  };
  return <Modal onclose={() => {
    if (!busy)
      onClose();
  }} component={<form className="cl-community-create" onSubmit={submit}>
    <h2>Create community</h2>
    <p>Build a place for shared interests and conversations.</p>
    <label>Name<input required maxLength={150} value={name} disabled={busy} onChange={event => setName(event.target.value)} placeholder="Community name" />
    </label>
    <label>Description<textarea maxLength={2000} value={description} disabled={busy} onChange={event => setDescription(event.target.value)} placeholder="What brings your community together?" />
    </label>
    <label>Profile link<input required value={slug} disabled={busy} onChange={event => setSlug(event.target.value)} placeholder="your-community" />
    </label>
    {slugError && <p role="alert">{slugError.message}</p>}
    <label>Privacy<select value={isPrivate ? "private" : "public"} disabled={busy} onChange={event => setPrivate(event.target.value === "private")}>
      <option value="public">Public — anyone can read; members can post</option>
      <option value="private">Private — membership requires approval</option>
    </select>
    </label>
    {error && <p role="alert">
      {error}
    </p>}
    <footer>
      <button type="button" disabled={busy} className="cl-community-secondary" onClick={onClose}>Cancel</button>
      <button className="cl-community-primary" disabled={busy || !name.trim() || !slug.trim() || Boolean(slugError)}>
        {busy ? "Creating…" : "Create community"}
      </button>
    </footer>
  </form>} />;
}
