/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AuthenticationInterface,
  IPost,
  ProfileUserInfoInterface,
} from "@/reusables/vars/interfaces";
import { Fragment, useEffect, useRef, useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FaFileAlt } from "react-icons/fa";
import { motion, useInView } from "framer-motion";
import { GetPostRequest } from "@/reusables/hooks/requests";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { genericpaginationstate } from "@/redux/actions/states";
import { PaginationProp } from "@/reusables/vars/props";
import { Card } from "@/reusables/design";
import PostItem from "./PostItem";
import ArchivePostItemLoader from "@/app/reusables/loaders/ArchivePostItemLoader";

function ArchivesContainer({
  profileInfo,
}: {
  profileInfo: ProfileUserInfoInterface;
}) {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );

  const params = useParams();

  const [page, setpage] = useState<number>(1);
  const [range] = useState<number>(20);

  const [ispostsloaded, setispostsloaded] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  const [paginatedPosts, setpaginatedPosts] = useState<PaginationProp<IPost>>(
    genericpaginationstate,
  );
  const posts: IPost[] = paginatedPosts.results;

  const GetPostProcess = () => {
    setIsLoadingMore(true);
    GetPostRequest(
      {
        current_user_id: authentication.user.userID,
        userID: authentication.user.username,
        page: page,
        range: range,
      },
      true,
    )
      .then((response) => {
        setpaginatedPosts((prev: PaginationProp<IPost>) => {
          const combinedList = [...prev.results, ...response.results];
          const uniqueById = combinedList
            .filter(
              (obj, index, self) =>
                index === self.findIndex((t) => t.post_id === obj.post_id),
            )
            .sort(
              (a: any, b: any) =>
                new Date(b.date_posted).getTime() -
                new Date(a.date_posted).getTime(),
            );

          return {
            ...response,
            results: uniqueById,
          };
        });
        setispostsloaded(true);
        setTimeout(() => {
          setIsLoadingMore(false);
        }, 1500);
      })
      .catch((err) => {
        setTimeout(() => {
          setIsLoadingMore(false);
        }, 1500);
        console.log(err);
      });
  };

  useEffect(() => {
    setispostsloaded(false);
  }, [profileInfo, params.userID]);

  useEffect(() => {
    GetPostProcess();
  }, [params.userID, page, profileInfo]);

  useEffect(() => {
    setpage(1);

    return () => {
      setpaginatedPosts(genericpaginationstate);
    };
  }, [params.userID]);

  const loaderRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(loaderRef, {
    amount: 1,
  });

  useEffect(() => {
    if (isInView && paginatedPosts.next && !isLoadingMore)
      setpage((prev) => prev + 1);
  }, [isInView, paginatedPosts.next, isLoadingMore]);

  return (
    <Fragment>
      {paginatedPosts.count > 0 ? (
        <div className="tw-w-full tw-bg-transparent tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-[0px] tw-mt-[0px]">
          {posts.map((mp: IPost) => {
            return (
              <Card
                pad={10}
                style={{ marginBottom: 8, width: "100%" }}
                key={mp.post_id}
                className="tw-flex tw-justify-center tw-w-full"
              >
                <PostItem
                  key={mp.post_id}
                  mp={mp}
                  isSharePreview={false}
                  show_archived={true}
                />
              </Card>
            );
          })}
        </div>
      ) : ispostsloaded ? (
        <div className="tw-w-full tw-bg-transparent tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-[10px] tw-mt-[70px]">
          <FaFileAlt style={{ fontSize: "60px", color: "#333333" }} />
          <div className="tw-flex tw-flex-col tw-gap-[0px] tw-text-[#333333]">
            <span className="tw-font-semibold cl-text-body">
              No Posts yet
            </span>
          </div>
        </div>
      ) : (
        <div className="tw-w-full tw-bg-transparent tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-[0px] tw-mt-[0px]">
          {Array.from({ length: 8 }, (_, i: number) => {
            return (
              <Card
                pad={10}
                style={{ marginBottom: 8, width: "100%" }}
                key={i}
                className="tw-flex tw-justify-center tw-w-full"
              >
                <ArchivePostItemLoader key={i} />
              </Card>
            );
          })}
        </div>
      )}
      <motion.div
        ref={loaderRef}
        id="divlazyloader"
        initial={{
          height: paginatedPosts.next ? "auto" : "0px",
        }}
        animate={{
          height: paginatedPosts.next ? "auto" : "0px",
        }}
        className="tw-bg-transparent tw-w-full tw-flex tw-items-center tw-justify-center tw-mt-[5px] tw-mb-[5px] tw-overflow-y-hidden"
      >
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
          <AiOutlineLoading3Quarters style={{ fontSize: "20px" }} />
        </motion.div>
      </motion.div>
    </Fragment>
  );
}

export default ArchivesContainer;
