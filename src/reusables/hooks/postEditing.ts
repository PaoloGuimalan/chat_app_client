import type { IPost } from "../vars/interfaces";

export type PostPatch = Pick<IPost, "post_id"> & Partial<Pick<IPost,
  "caption" | "references" | "updated_at" | "is_edited" | "privacy_status" |
  "is_archived" | "date_posted" | "content_type" | "file_type" | "link_preview"
>>;

export interface PostEditMedia {
  key: string;
  referenceId?: string;
  src: string;
  mime: string;
  name: string;
  file?: File;
  uploadedUrl?: string;
}

export const editablePostMedia = (post: IPost) =>
  !post.is_shared && ["text", "media"].includes(post.content_type);

export const postMediaDraft = (post: IPost): PostEditMedia[] =>
  post.references.map(reference => ({
    key: reference.reference_id,
    referenceId: reference.reference_id,
    src: reference.reference,
    mime: reference.reference_media_type,
    name: reference.reference_name || "Attachment",
  }));

const captionValue = (value: string) => value.trim() ? value : "";
const mediaChanged = (post: IPost, media: PostEditMedia[]) => editablePostMedia(post) &&
  (media.length !== post.references.length || media.some((item, index) => item.referenceId !== post.references[index]?.reference_id));

export const postEditDirty = (post: IPost, caption: string, media: PostEditMedia[]) =>
  captionValue(caption) !== (post.caption || "") || mediaChanged(post, media);

export function postEditFields(post: IPost, caption: string, media: PostEditMedia[]) {
  const fields: { caption?: string; references?: ({ reference_id: string } | { url: string })[] } = {};
  if (captionValue(caption) !== (post.caption || "")) fields.caption = captionValue(caption);
  if (mediaChanged(post, media)) {
    fields.references = media.map(item => {
      if (item.referenceId) return { reference_id: item.referenceId };
      if (!item.uploadedUrl) throw new Error("Finish the attachment upload before saving.");
      return { url: item.uploadedUrl };
    });
  }
  return fields;
}
