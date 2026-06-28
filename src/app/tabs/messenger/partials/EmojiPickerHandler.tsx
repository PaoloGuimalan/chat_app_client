/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactToMessageRequest } from "@/reusables/hooks/requests";
import EmojiPicker from "emoji-picker-react";
import { useSelector } from "react-redux";

function EmojiPickerHandler({
  conversationID,
  messageID,
  fromSender,
  settoggleEmojiPicker,
  setreactions,
}: any) {
  const authentication = useSelector((state: any) => state.authentication);
  const conversationsetup = useSelector((state: any) => state.conversationsetup);
  const senderEntityID =
    conversationsetup?.sender_entity_id ||
    conversationsetup?.acting_entity_id ||
    conversationsetup?.senderEntityID ||
    conversationsetup?.joinedAsEntityID ||
    conversationsetup?.groupdetails?.sender_entity_id ||
    conversationsetup?.groupdetails?.acting_entity_id ||
    conversationsetup?.groupdetails?.senderEntityID ||
    (authentication.user?.userID
      ? `entity:user:${authentication.user.userID}`
      : null);

  const ReactToMessageProcess = (newreaction: any) => {
    ReactToMessageRequest({
      conversationID: conversationID,
      messageID: messageID,
      newreaction: newreaction,
      ...(senderEntityID ? { sender_entity_id: senderEntityID } : {}),
    })
      .then((_) => {
        // console.log(response)
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <div className="tw-relative">
      <div
        className={`tw-absolute tw-bottom-0 ${
          fromSender ? "tw-right-0" : "tw-left-0"
        } tw-max-w-[250px]`}
      >
        <EmojiPicker
          // reactionsDefaultOpen={true}
          width="100%"
          onEmojiClick={(emoji) => {
            settoggleEmojiPicker(false);
            setreactions((prev: any) => [
              ...prev,
              {
                userID: authentication.user.userID,
                fullName: authentication.user.fullName,
                ...emoji,
              },
            ]);
            ReactToMessageProcess({
              userID: authentication.user.userID,
              ...emoji,
            });
          }}
        />
      </div>
    </div>
  );
}

export default EmojiPickerHandler;
