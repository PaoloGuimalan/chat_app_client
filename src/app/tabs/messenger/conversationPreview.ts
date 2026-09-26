import { timeSince } from "@/reusables/hooks/reusable";
import { IConversation } from "@/reusables/vars/interfaces";

// The text and time a conversation row shows for its last message. Shared by
// the conversation list and the Messages home panel (MessagesDefault).
const TYPE_CHECKER: Record<string, string> = {
  video: "a video",
  audio: "an audio",
  image: "a photo",
  any: "a file",
};

export function lastMessagePreview(
  msgslst: IConversation,
  authUserID: string,
): { text: string; html?: boolean } {
  const senderPrefix = msgslst.sender == authUserID ? "you: " : "";
  if (msgslst.isDeleted) {
    return { text: `${senderPrefix}[Deleted message]` };
  }
  // "post": a post sent with no note - the list text is "Sent a post".
  if (
    msgslst.messageType === "text" ||
    msgslst.messageType === "notif" ||
    msgslst.messageType === "post"
  ) {
    return { text: `${senderPrefix}${msgslst.content || ""}`, html: true };
  }
  if (
    !msgslst.messageType.includes("image") &&
    !msgslst.messageType.includes("video") &&
    !msgslst.messageType.includes("audio")
  ) {
    return { text: `${senderPrefix}Sent ${TYPE_CHECKER["any"]}` };
  }
  return {
    text: `${senderPrefix}Sent ${TYPE_CHECKER[msgslst.messageType.split("/")[0]]}`,
  };
}

export function timestampLabel(msgslst: IConversation): string {
  return timeSince(msgslst.messageDate);
}
