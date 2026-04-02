/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  DeletePostRequest,
  UpdatePostRequest,
} from "@/reusables/hooks/requests";
import { AuthenticationInterface, IPost } from "@/reusables/vars/interfaces";
import { useEffect, useRef, useState } from "react";
import { BsThreeDots } from "react-icons/bs";
import { FaArchive } from "react-icons/fa";
import { IoBookmark } from "react-icons/io5";
import { MdDelete } from "react-icons/md";
import { useSelector } from "react-redux";

function PostOptions({
  post,
  onProcess,
  onFinish,
  onError,
}: {
  post: IPost;
  onProcess: () => void;
  onFinish: (type: string) => void;
  onError: () => void;
}) {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );

  const [isOptionsToggled, setisOptionsToggled] = useState<boolean>(false);

  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setisOptionsToggled(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const DeletePostProcess = () => {
    onProcess();
    setisOptionsToggled(false);
    DeletePostRequest([post.post_id])
      .then(() => {
        onFinish("deleted");
      })
      .catch((err) => {
        onError();
        console.log(err);
      });
  };

  const ArchivePostProcess = () => {
    onProcess();
    setisOptionsToggled(false);
    UpdatePostRequest(post.post_id, { is_archived: true })
      .then(() => {
        onFinish("archived");
      })
      .catch((err) => {
        onError();
        console.log(err);
      });
  };

  return (
    <div ref={wrapperRef} className="tw-relative">
      {isOptionsToggled && (
        <div
          autoFocus
          className="tw-z-[2] tw-flex tw-flex-col tw-gap-[2px] tw-min-w-[100px] tw-absolute tw-right-[25px] tw-top-[10px] tw-bg-white tw-p-[10px] tw-rounded-md tw-border-solid tw-border-[1px] tw-border-[#d2d2d2] tw-shadow-md"
        >
          <button
            disabled
            className="tw-items-center tw-text-[12px] tw-flex tw-gap-[2px] tw-cursor-pointer tw-p-[7px] tw-font-Inter tw-border-none tw-rounded-sm tw-bg-transparent hover:tw-bg-[#d2d2d2]"
          >
            <IoBookmark
              size={15}
              style={{ marginLeft: "-1px", marginRight: "4px" }}
            />
            <span>Save</span>
          </button>
          {post.user.username === authentication.user.userID && (
            <button
              onClick={ArchivePostProcess}
              className="tw-items-center tw-text-[12px] tw-flex tw-gap-[2px] tw-cursor-pointer tw-p-[7px] tw-font-Inter tw-border-none tw-rounded-sm tw-bg-transparent hover:tw-bg-[#d2d2d2]"
            >
              <FaArchive size={12} style={{ marginRight: "4px" }} />
              <span>Archive</span>
            </button>
          )}
          {post.user.username === authentication.user.userID && (
            <button
              onClick={DeletePostProcess}
              className="tw-items-center tw-text-[12px] tw-flex tw-gap-[2px] tw-cursor-pointer tw-p-[7px] tw-font-Inter tw-border-none tw-rounded-sm tw-bg-transparent hover:tw-bg-[#d2d2d2]"
            >
              <MdDelete size={18} style={{ marginLeft: "-3px" }} />
              <span>Delete</span>
            </button>
          )}
        </div>
      )}
      <button
        onClick={() => {
          setisOptionsToggled(!isOptionsToggled);
        }}
        className="tw-w-[25px] tw-h-[20px] tw-border-none tw-bg-transparent tw-cursor-pointer"
      >
        <BsThreeDots style={{ fontSize: "17px" }} />
      </button>
    </div>
  );
}

export default PostOptions;
