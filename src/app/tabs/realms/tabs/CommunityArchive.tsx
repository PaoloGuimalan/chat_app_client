import { useEffect, useRef, useState } from "react";
import "./realmReview.css";
import { useSelector } from "react-redux";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import { Btn, Card } from "@/reusables/design";
import PostItem from "@/app/tabs/profile/user/PostItem";
import ConfirmModal from "@/app/widgets/modals/ConfirmModal";
import { CommunityPostScope } from "@/app/reusables/CommunityPostScope";
import {
  archiveCommunityPost,
  listCommunityArchive,
} from "@/reusables/hooks/communityRequests";
import { notify, notifyRequestError } from "@/reusables/hooks/errormessages";
import type { IPost, IRealmProfileInfo } from "@/reusables/vars/interfaces";

export default function CommunityArchive({
  realm,
}: {
  realm: IRealmProfileInfo;
}) {
  const actor = useSelector(
    (s: {
      authentication: {
        active_entity_context?: { id?: string };
        user: { entity_id: string };
      };
    }) =>
      s.authentication.active_entity_context?.id ??
      s.authentication.user.entity_id,
  );
  const token = localStorage.getItem("authtoken");
  const identity = `${actor}:${token}:${realm.id}`;
  const liveIdentity = useRef(identity);
  liveIdentity.current = identity;
  const [revision, setRevision] = useState(0);
  const [page, setPage] = useState(1);
  const [loaded, setLoaded] = useState<{
    scope: string;
    rows: IPost[];
    next: boolean;
    busy: boolean;
    failed: boolean;
  }>({ scope: "", rows: [], next: false, busy: true, failed: false });
  const scope = `${identity}:${revision}`;
  const [restoring, setRestoring] = useState<IPost | null>(null);
  const [saving, setSaving] = useState(false);
  const rows = loaded.scope === scope ? loaded.rows : [];
  const busy = loaded.scope !== scope || loaded.busy;
  const refresh = () => {
    setPage(1);
    setRevision((value) => value + 1);
  };
  useEffect(() => {
    let active = true;
    setRestoring(null);
    setSaving(false);
    setLoaded((previous) => ({
      scope,
      rows: page > 1 && previous.scope === scope ? previous.rows : [],
      next: false,
      busy: true,
      failed: false,
    }));
    listCommunityArchive(realm.id, page)
      .then((result) => {
        if (
          !active ||
          liveIdentity.current !== identity ||
          token !== localStorage.getItem("authtoken")
        )
          return;
        setLoaded((previous) => ({
          scope,
          rows: Array.from(
            new Map(
              [
                ...(page > 1 && previous.scope === scope ? previous.rows : []),
                ...result.results,
              ].map((post) => [post.post_id, post]),
            ).values(),
          ),
          next: Boolean(result.next),
          busy: false,
          failed: false,
        }));
      })
      .catch((error) => {
        if (!active || liveIdentity.current !== identity) return;
        setLoaded({ scope, rows: [], next: false, busy: false, failed: true });
        notifyRequestError(error, "We couldn’t load the community archive.");
      });
    return () => {
      active = false;
    };
  }, [scope, page, identity, realm.id, token]);
  useEffect(() => {
    const changed = (event: Event) => {
      const id = (event as CustomEvent).detail?.realm_id;
      if (!id || [realm.id, realm.realm_id].includes(String(id))) refresh();
    };
    document.addEventListener("community-changed", changed);
    return () => document.removeEventListener("community-changed", changed);
  }, [realm.id, realm.realm_id]);
  const restore = async () => {
    if (!restoring || saving) return;
    setSaving(true);
    try {
      await archiveCommunityPost(realm.id, restoring.post_id, false);
      if (
        liveIdentity.current !== identity ||
        token !== localStorage.getItem("authtoken")
      )
        return;
      setLoaded((previous) => ({
        ...previous,
        rows: previous.rows.filter(
          (post) => post.post_id !== restoring.post_id,
        ),
      }));
      setRestoring(null);
      notify("success", "Post restored.");
    } catch (error) {
      if (liveIdentity.current === identity)
        notifyRequestError(error, "We couldn’t restore this post.");
    } finally {
      if (liveIdentity.current === identity) setSaving(false);
    }
  };
  return (
    <section className="cl-realm-review tw-w-full tw-min-w-0 tw-p-[16px] md:tw-p-[20px] tw-text-left">
      <h2 className="tw-mt-0 tw-mb-[6px] tw-text-left tw-text-[20px] tw-font-semibold">
        Community archive
      </h2>
      <p className="tw-mt-0 tw-text-[13px] tw-text-[var(--text-2)]">
        Posts authored by the community. Restoring a post keeps its approval
        status.
      </p>
      <div className="tw-flex tw-flex-col tw-gap-[14px]">
        {rows.map((post) => (
          <Card key={post.post_id} pad={0}>
            <CommunityPostScope.Provider value={realm.entity}>
              <PostItem
                mp={{ ...post, read_only: true }}
                isSharePreview
                embedded
                show_archived
              />
            </CommunityPostScope.Provider>
            <div className="tw-flex tw-justify-end tw-p-[14px]">
              <Btn
                variant="outline"
                disabled={saving}
                onClick={() => setRestoring(post)}
              >
                Restore post
              </Btn>
            </div>
          </Card>
        ))}
        {busy && (
          <div role="status" aria-label="Loading community archive">
            <SkeletonTheme
              baseColor="var(--surface-2)"
              highlightColor="var(--surface-hover)"
            >
              <Skeleton count={2} height={150} />
            </SkeletonTheme>
          </div>
        )}
        {!busy && loaded.failed && (
          <Btn variant="outline" onClick={refresh}>
            Retry
          </Btn>
        )}
        {!busy && !loaded.failed && !rows.length && (
          <Card>No archived community posts.</Card>
        )}
        {!busy && loaded.next && (
          <Btn variant="outline" onClick={() => setPage((value) => value + 1)}>
            Load more
          </Btn>
        )}
      </div>
      {restoring && (
        <ConfirmModal
          title="Restore this post?"
          message="The post will return only if it is approved and hasn’t been removed."
          confirmLabel="Restore post"
          onClose={() => setRestoring(null)}
          onConfirm={() => void restore()}
          isBusy={saving}
        />
      )}
    </section>
  );
}
