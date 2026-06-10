/* eslint-disable react-hooks/exhaustive-deps */
import { GetPostPreviewRequest } from "@/reusables/hooks/requests";
import { IPost } from "@/reusables/vars/interfaces";
import { useEffect, useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { motion } from "framer-motion";
import PostItem from "./PostItem";
import { BsFileEarmarkExcel } from "react-icons/bs";

function LoadedPostItem({ postID }: { postID: string }) {
  const [postData, setpostData] = useState<IPost | null>(null);
  const [isPostDataError, setisPostDataError] = useState(false);

  const GetPostPreviewProcess = () => {
    GetPostPreviewRequest({
      postID: postID,
    })
      .then((response) => {
        if (response) {
          setpostData(response);
        } else {
          setisPostDataError(true);
        }
      })
      .catch((err) => {
        setisPostDataError(true);
        console.log(err);
      });
  };

  useEffect(() => {
    GetPostPreviewProcess();
  }, [postID]);

  return isPostDataError ? (
    <div className="cl-feed-card cl-feed-card--unavailable tw-flex tw-flex-col tw-gap-[15px] tw-w-full tw-h-auto tw-min-h-[200px] tw-items-center tw-justify-center tw-border tw-border-[var(--border)] tw-rounded-[var(--r-md)]">
      <BsFileEarmarkExcel style={{ fontSize: "55px", color: "var(--text-2)" }} />
      <div className="tw-flex tw-w-full tw-max-w-[200px] tw-items-center tw-justify-center tw-text-[13px] tw-text-[var(--text-2)] ">
        <span>This post is unavailable</span>
      </div>
    </div>
  ) : postData ? (
    <PostItem isSharePreview={true} mp={postData} />
  ) : (
    <div className="cl-feed-card cl-feed-card--loading tw-flex tw-w-full tw-h-auto tw-min-h-[350px] tw-items-center tw-justify-center tw-border tw-border-[var(--border)] tw-rounded-[var(--r-md)]">
      <div id="div_conversation_content_loader">
        <motion.div
          animate={{
            rotate: -360,
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
          }}
          id="div_loader_request_conv"
        >
          <AiOutlineLoading3Quarters style={{ fontSize: "28px" }} />
        </motion.div>
      </div>
    </div>
  );
}

export default LoadedPostItem;
