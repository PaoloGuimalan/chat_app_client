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
import { Card, Icon } from "@/reusables/design";
import MomentArchive from "@/app/tabs/moments/MomentArchive";
import PostItem from "./PostItem";
import ArchivePostItemLoader from "@/app/reusables/loaders/ArchivePostItemLoader";

function FeedArchive({
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
        current_user_id: authentication.user.entity_id,
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
                className="cl-bleed tw-flex tw-justify-center tw-w-full"
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
            <span className="tw-font-semibold cl-text-body">No Posts yet</span>
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
                className="cl-bleed tw-flex tw-justify-center tw-w-full"
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

const ARCHIVE_TABS = [
  { key: "feed", label: "Feed", icon: "article" },
  { key: "moments", label: "Moments", icon: "timelapse" },
] as const;

/**
 * Archives: your archived feed posts, and your expired Moments. The Feed /
 * Moments bar is the Posts / Saves / Archives bar above it, repeated - same
 * surface, width, button size and rounding - so the two read as one control.
 */
function ArchivesContainer({
  profileInfo,
}: {
  profileInfo: ProfileUserInfoInterface;
}) {
  const [tab, setTab] = useState<"feed" | "moments">("feed");
  const screensizelistener = useSelector((state: any) => state.screensizelistener);
  const isMobileView = screensizelistener.W < 800;
  return (
    <Fragment>
      <div className="cl-profile-surface tw-w-full tw-h-fit tw-flex tw-mb-[6px]">
        <div
          className="tw-w-full tw-p-[10px] tw-flex tw-flex-row tw-flex-wrap tw-items-center tw-gap-[4px]"
          style={{ justifyContent: isMobileView ? "center" : "flex-start" }}
        >
          {ARCHIVE_TABS.map((t) => (
            <button
              key={t.key}
              data-active={tab === t.key}
              onClick={() => setTab(t.key)}
              style={{
                backgroundColor: tab === t.key ? "var(--brand-soft)" : "transparent",
                color: tab === t.key ? "var(--brand)" : "var(--text-2)",
              }}
              className="cl-profile-tab-button tw-flex tw-flex-row tw-gap-[5px] tw-items-center tw-font-Inter tw-p-[6px] tw-px-[10px] tw-cursor-pointer tw-rounded-md tw-border-none"
            >
              <Icon n={t.icon} s={15} />
              <span className="cl-text-caption tw-font-semibold">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
      {tab === "feed" ? (
        <FeedArchive profileInfo={profileInfo} />
      ) : (
        <MomentArchive />
      )}
    </Fragment>
  );
}

export default ArchivesContainer;

