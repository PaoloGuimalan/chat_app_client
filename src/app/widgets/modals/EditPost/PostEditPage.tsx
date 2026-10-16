import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import type { AuthenticationInterface, IPost } from "@/reusables/vars/interfaces";
import { GetPostPreviewRequest } from "@/reusables/hooks/requests";
import { resolveErrorMessage } from "@/reusables/hooks/errormessages";
import EditPost from "./EditPost";
import PostEditLayout from "./PostEditLayout";

export default function PostEditPage() {
  const { postID } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const entity = useSelector((state: { authentication: AuthenticationInterface }) => state.authentication.user.entity_id);
  const width = useSelector((state: { screensizelistener: { W: number } }) => state.screensizelistener.W);
  const token = localStorage.getItem("authtoken") || "";
  const [loaded, setLoaded] = useState<{ key: string; post: IPost | null; error: string } | null>(null);
  const key = `${postID}:${entity}:${token}`;
  const close = () => {
    if (location.state?.postEditFrom && window.history.state?.idx > 0) navigate(-1);
    else navigate(`/post/${postID}`, { replace: true });
  };
  useEffect(() => {
    let cancelled = false;
    GetPostPreviewRequest({ postID, token }).then((post: IPost) => {
      if (cancelled) return;
      const owned = post?.entity.id === entity && (!post.on_feed || post.on_feed === "feed");
      setLoaded({ key, post: owned ? post : null, error: owned ? "" : "This post isn't available to edit." });
    }).catch(cause => {
      if (!cancelled) setLoaded({ key, post: null, error: resolveErrorMessage(cause, "We couldn't load this post. Please reopen it and try again.") });
    });
    return () => { cancelled = true; };
  }, [key, entity, postID, token]);
  if (loaded?.key === key && loaded.post) return <EditPost key={key} post={loaded.post} onClose={close} asPage={width < 800}/>;
  return <PostEditLayout title="Edit post" asPage={width < 800} onClose={close}>
    {loaded?.key === key && loaded.error ? <p className="cl-post-edit__error" role="alert">{loaded.error}</p>
      : <div className="cl-post-edit__loading" role="status" aria-label="Loading post">
        <div/><div/><div/>
      </div>}
  </PostEditLayout>;
}
