import { ReactToMessageRequest } from '@/reusables/hooks/requests';
import EmojiPicker from 'emoji-picker-react';
import { useSelector } from 'react-redux';

function EmojiPickerHandler({ conversationID, messageID, fromSender, settoggleEmojiPicker, setreactions }: any) {

  const authentication = useSelector((state: any) => state.authentication);

  const ReactToMessageProcess = (newreaction: any) => {
    ReactToMessageRequest({
      conversationID: conversationID,
      messageID: messageID,
      newreaction: newreaction
    }).then((_) => {
      // console.log(response)
    }).catch((err) => {
      console.log(err);
    })
  }

  return (
    <div className='tw-relative'>
      <div className={`tw-absolute tw-bottom-0 ${fromSender? "tw-right-0" : "tw-left-0"} tw-max-w-[250px]`}>
        <EmojiPicker width="100%" onEmojiClick={(emoji) => {
          settoggleEmojiPicker(false);
          setreactions((prev: any) => [...prev, {
            userID: authentication.user.userID,
            ...emoji
          }])
          ReactToMessageProcess({
            userID: authentication.user.userID,
            ...emoji
          })
        }} />
      </div>
    </div>
  )
}

export default EmojiPickerHandler