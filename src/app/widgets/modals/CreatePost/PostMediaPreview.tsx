/* eslint-disable @typescript-eslint/no-explicit-any */
import CachedImage from "@/app/reusables/cachers/CachedImage";
import { AiOutlineClose } from "react-icons/ai";

function PostMediaPreview({ mp, setrawmedialist, setmedialist }: any) {
  const mutatePostText = (caption: string) => {
    setrawmedialist((prev: any) => [
      ...prev.filter((flt: any) => flt.id !== mp.id),
      {
        ...prev.filter((flt: any) => flt.id === mp.id)[0],
        caption: caption,
      },
    ]);

    setmedialist((prev: any) => [
      ...prev.filter((flt: any) => flt.id !== mp.id),
      {
        ...prev.filter((flt: any) => flt.id === mp.id)[0],
        caption: caption,
      },
    ]);
  };

  if (mp.referenceMediaType.includes("image")) {
    return (
      <div className="cl-create-post-media-card tw-w-full">
        <button
          onClick={() => {
            setrawmedialist((prev: any) => [
              ...prev.filter((flt: any) => flt.id !== mp.id),
            ]);
            setmedialist((prev: any) => [
              ...prev.filter((flt: any) => flt.id !== mp.id),
            ]);
          }}
          className="btn_remove_preview tw-relative tw--mb-[32px] tw-w-[22px] tw-h-[22px]"
        >
          <AiOutlineClose />
        </button>
        <textarea
          value={mp.caption}
          onChange={(e) => {
            mutatePostText(e.target.value);
          }}
          className="tw-w-full tw-min-h-[50px] tw-font-inter tw-resize-none tw-border-none tw-outline-none thinscroller tw-font-Inter"
          placeholder="Type your caption"
        />
        <CachedImage src={mp.reference} className="tw-w-full" />
      </div>
    );
  } else if (mp.referenceMediaType.includes("video")) {
    return (
      <div className="cl-create-post-media-card tw-w-full">
        <button
          onClick={() => {
            setrawmedialist((prev: any) => [
              ...prev.filter((flt: any) => flt.id !== mp.id),
            ]);
            setmedialist((prev: any) => [
              ...prev.filter((flt: any) => flt.id !== mp.id),
            ]);
          }}
          className="btn_remove_preview tw-relative tw--mb-[32px] tw-w-[22px] tw-h-[22px]"
        >
          <AiOutlineClose />
        </button>
        <textarea
          value={mp.caption}
          onChange={(e) => {
            mutatePostText(e.target.value);
          }}
          className="tw-w-full tw-min-h-[50px] tw-font-inter tw-resize-none tw-border-none tw-outline-none thinscroller tw-font-Inter"
          placeholder="Type your caption"
        />
        <video src={mp.reference} controls className="tw-w-full" />
      </div>
    );
  }
}

export default PostMediaPreview;
