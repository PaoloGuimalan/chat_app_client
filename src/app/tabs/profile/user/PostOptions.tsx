/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  DeletePostRequest,
  SavePostRequest,
  UnsavePostRequest,
  UpdatePostRequest,
} from "@/reusables/hooks/requests";
import { AuthenticationInterface, IPost } from "@/reusables/vars/interfaces";
import { useEffect, useRef, useState } from "react";
import { BsThreeDots } from "react-icons/bs";
import { GoBookmarkSlashFill } from "react-icons/go";
import { FaArchive } from "react-icons/fa";
import { IoBookmark } from "react-icons/io5";
import { MdDelete } from "react-icons/md";
import { useSelector } from "react-redux";
import { RiInboxUnarchiveFill } from "react-icons/ri";

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
  const [postState, setpostState] = useState<IPost>(post);
  const [isSaving, setisSaving] = useState<boolean>(false);

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

  const ArchivePostProcess = (archive_status: boolean) => {
    onProcess();
    setisOptionsToggled(false);
    UpdatePostRequest(post.post_id, { is_archived: archive_status })
      .then(() => {
        onFinish(archive_status ? "archived" : "unarchived");
      })
      .catch((err) => {
        onError();
        console.log(err);
      });
  };

  const SavePostProcess = () => {
    setisSaving(true);
    SavePostRequest(post.post_id)
      .then(() => {
        setpostState((prev) => {
          return { ...prev, is_saved: true };
        });
        setisSaving(false);
      })
      .catch((err) => {
        setisSaving(false);
        console.log(err);
      });
  };

  const UnsavePostProcess = () => {
    setisSaving(true);
    UnsavePostRequest(post.post_id)
      .then(() => {
        setpostState((prev) => {
          return { ...prev, is_saved: false };
        });
        setisSaving(false);
      })
      .catch((err) => {
        setisSaving(false);
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
          {!postState.is_archived &&
            (!postState.is_saved ? (
              <button
                disabled={isSaving}
                onClick={SavePostProcess}
                className="tw-items-center tw-text-[12px] tw-flex tw-gap-[2px] tw-cursor-pointer tw-p-[7px] tw-font-Inter tw-border-none tw-rounded-sm tw-bg-transparent hover:tw-bg-[#d2d2d2]"
              >
                <IoBookmark
                  size={15}
                  style={{ marginLeft: "-1px", marginRight: "4px" }}
                />
                <span>Save</span>
              </button>
            ) : (
              <button
                disabled={isSaving}
                onClick={UnsavePostProcess}
                className="tw-items-center tw-text-[12px] tw-flex tw-gap-[2px] tw-cursor-pointer tw-p-[7px] tw-font-Inter tw-border-none tw-rounded-sm tw-bg-transparent hover:tw-bg-[#d2d2d2]"
              >
                <GoBookmarkSlashFill
                  size={15}
                  style={{ marginLeft: "-1px", marginRight: "4px" }}
                />
                <span>Unsave</span>
              </button>
            ))}
          {post.user.id === authentication.user.userID &&
            (post.is_archived ? (
              <button
                onClick={() => {
                  ArchivePostProcess(false);
                }}
                className="tw-items-center tw-text-[12px] tw-flex tw-gap-[2px] tw-cursor-pointer tw-p-[7px] tw-font-Inter tw-border-none tw-rounded-sm tw-bg-transparent hover:tw-bg-[#d2d2d2]"
              >
                <RiInboxUnarchiveFill
                  size={16}
                  style={{ marginLeft: "-2px", marginRight: "2px" }}
                />
                <span>Unarchive</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  ArchivePostProcess(true);
                }}
                className="tw-items-center tw-text-[12px] tw-flex tw-gap-[2px] tw-cursor-pointer tw-p-[7px] tw-font-Inter tw-border-none tw-rounded-sm tw-bg-transparent hover:tw-bg-[#d2d2d2]"
              >
                <FaArchive size={12} style={{ marginRight: "4px" }} />
                <span>Archive</span>
              </button>
            ))}
          {post.user.id === authentication.user.userID && (
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
