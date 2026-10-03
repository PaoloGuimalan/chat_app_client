/**
 * A file message's file, read from the `attachment` the server stores with
 * every file message - { fileId, url, name, mime, kind, size, status }.
 *
 * Nothing here reads a name out of a URL any more. Messages sent before
 * attachments existed got theirs from a one-time backfill on the server
 * (scripts/backfillMessageAttachments.js), which was the last place that
 * parsing happened. A message with no attachment shows as "File".
 */
import { formatFileSize } from "@/reusables/vars/uploads";

export interface MessageAttachment {
  fileId?: string | null;
  url: string;
  name: string;
  mime?: string | null;
  kind?: "image" | "video" | "audio" | "file";
  size?: number | null;
  /** "unavailable": the file itself is gone (the old Firebase uploads). */
  status?: "available" | "unavailable";
}

type FileMessageLike = {
  content?: string;
  attachment?: MessageAttachment | null;
};

export const messageFile = (message: FileMessageLike) => {
  const attachment = message?.attachment ?? null;
  return {
    url: attachment?.url || message?.content || "",
    name: attachment?.name || "File",
    size: attachment?.size ?? null,
    /** "2.4 MB", or "" when unknown. */
    sizeLabel: formatFileSize(attachment?.size),
    available: attachment?.status !== "unavailable",
  };
};

/** Where to open or play it. */
export const messageFileUrl = (message: FileMessageLike) =>
  messageFile(message).url;
