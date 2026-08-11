/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { GetPostPreviewRequest } from "@/reusables/hooks/requests";
import {
  AuthenticationInterface,
  IPost,
} from "@/reusables/vars/interfaces";
import PostPreviewModal from "@/app/tabs/profile/user/PostPreviewModal";
import { NewPostModal } from "@/app/widgets/modals/CreatePost/NewPostModal";
import BrokenLink from "@/app/reusables/catchers/BrokenLink";
import PageLoader from "@/app/reusables/loaders/PageLoader";
import { useTheme } from "@/reusables/design";

/**
 * A post at its own URL - `/post/:postID`.
 *
 * The webapp had no post permalink: posts opened as a modal from search and
 * saved posts, so nothing could LINK to one. That is why post-backed
 * notifications (a reaction, a comment, a tag) had no web destination while
 * the mobile clients got /post/<id>. This page is that destination.
 *
 * It renders the post-preview LAYOUT - the same media/details split, the same
 * reactions and comments - via that component's `asPage` mode, which skips only
 * its `<Modal>` wrapper. Not a second layout that happens to show the same
 * post: there would then be two of them to keep in step, and a post would look
 * like a different thing depending on how it was reached.
 *
 * The modal surfaces are unaffected - `asPage` defaults to false.
 */
function PostPage() {
  const { postID } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );

  const [post, setPost] = useState<IPost | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isBroken, setIsBroken] = useState(false);
  const [toggleNewPostModal, setToggleNewPostModal] = useState<any>({
    toggle: false,
    withImage: false,
  });

  useEffect(() => {
    let cancelled = false;

    if (!postID) {
      setIsBroken(true);
      setIsLoaded(true);
      return;
    }

    setIsLoaded(false);
    setIsBroken(false);

    GetPostPreviewRequest({ postID })
      .then((result: IPost | null) => {
        if (cancelled) return;

        // A post you may not see and a post that does not exist are the SAME
        // answer from the API - it returns 404 for both, deliberately, because
        // "whether a given post id exists" is itself part of what a private
        // post withholds. So there is one broken state rather than a separate
        // "private post" one, on purpose: telling them apart in the UI would
        // leak exactly what the server refused to.
        //
        // Deleted and archived posts come back 200 with their caption and
        // references stripped, so they are caught by their own flags rather
        // than by the request failing.
        const unavailable =
          !result || (result as any).deleted_at || (result as any).is_archived;

        if (unavailable) setIsBroken(true);
        else setPost(result);
        setIsLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setIsBroken(true);
        setIsLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [postID]);

  // The layout's close control belongs to the modal shape; as a page it means
  // "leave this post". Falls through to the feed when there is no history - a
  // permalink opened cold from a notification has nothing behind it.
  const close = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  return (
    <div
      className="cl-redesign"
      data-theme={theme}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 0,
        display: "flex",
        background: "var(--bg)",
      }}
    >
      {toggleNewPostModal.toggle && post && (
        <NewPostModal
          toShare={true}
          sharePreviewData={post}
          withImage={toggleNewPostModal.withImage}
          profileInfo={{
            id: authentication.user.userID,
            entityID: authentication.user.entity_id,
            username: authentication.user.username,
          }}
          otherEntityID={null}
          setcreateposttext={() => {}}
          getpostprocess={() => {}}
          onclose={setToggleNewPostModal}
        />
      )}

      {!isLoaded ? (
        <PageLoader />
      ) : isBroken || !post ? (
        <BrokenLink
          label="Link is broken."
          secondaryLabel="This post may have been removed, or you may not have access to it."
        />
      ) : (
        <PostPreviewModal
          asPage
          post={post}
          setPost={setPost}
          onClose={close}
          onShare={() =>
            setToggleNewPostModal({ toggle: true, withImage: false })
          }
          // Deleting or archiving from the options menu leaves nothing to
          // show, so the page falls to the broken state rather than holding a
          // post that is no longer there.
          onOptionFinish={(type: string) => {
            if (type === "deleted" || type === "archived") setIsBroken(true);
          }}
        />
      )}
    </div>
  );
}

export default PostPage;
