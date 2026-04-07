import { ISavedPost } from "@/reusables/vars/interfaces";

function SavedPostItem({ savedPost }: { savedPost: ISavedPost }) {
  return (
    <div className="tw-w-full tw-relative">
      <div
        style={{
          borderWidth: "0px",
        }}
        className=" tw-bg-white tw-border-solid tw-border-[#d2d2d2] tw-rounded-[7px] tw-w-[calc(100%-40px)] tw-p-[20px] tw-pb-[20px] tw-flex tw-flex-col tw-gap-[10px]"
      >
        <span key={savedPost.id}>
          {savedPost.id} {savedPost.saved_at}
        </span>
      </div>
    </div>
  );
}

export default SavedPostItem;
