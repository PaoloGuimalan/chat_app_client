import EmojiPicker from 'emoji-picker-react';

function EmojiPickerHandler({ fromSender }: any) {
  return (
    <div className='tw-relative'>
      <div className={`tw-absolute tw-bottom-0 ${fromSender? "tw-right-0" : "tw-left-0"} tw-max-w-[250px]`}>
        <EmojiPicker width="100%" />
      </div>
    </div>
  )
}

export default EmojiPickerHandler