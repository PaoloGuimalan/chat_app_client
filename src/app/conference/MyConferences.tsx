import { useCallback, useEffect, useId, useRef, useState } from "react";
import { FiArrowRight, FiCalendar, FiTrash2, FiVideo } from "react-icons/fi";
import { Link } from "react-router-dom";
import ConfirmModal from "@/app/widgets/modals/ConfirmModal";
import { notify, notifyRequestError } from "@/reusables/hooks/errormessages";
import { deleteRealm, getRealmLifecycle } from "@/reusables/hooks/realmLifecycleRequests";
import { GetMyRealmsRequest } from "@/reusables/hooks/requests";
import type { PaginationProp } from "@/reusables/vars/props";

interface ConferenceSummary {
  id: string;
  name: string;
  slug: string | null;
  my_role: string | null;
  starts_at: string | null;
  capabilities?: { can_delete_realm?: boolean };
}

const startTime = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
});

export default function MyConferences() {
  const headingId = useId();
  const listRequest = useRef<AbortController | null>(null);
  const deleteRequest = useRef<AbortController | null>(null);
  const [items, setItems] = useState<ConferenceSummary[]>([]);
  const [nextPage, setNextPage] = useState<number | null>(1);
  const [listState, setListState] = useState<"loading" | "ready" | "error">("loading");
  const [deleteState, setDeleteState] = useState<"checking" | "deleting" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
    token: string | null;
  } | null>(null);

  const loadPage = useCallback(async (page: number) => {
    if (page > 1 && listRequest.current) return;
    listRequest.current?.abort();
    const controller = new AbortController();
    listRequest.current = controller;
    setListState("loading");
    setNextPage(page);

    try {
      const result: PaginationProp<ConferenceSummary> | false = await GetMyRealmsRequest(
        page, 20, "conference", undefined, controller.signal,
      );
      if (controller.signal.aborted) return;
      if (!result) throw new Error("Conference list is unavailable");
      setItems((current) => {
        if (page === 1) return result.results;
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...result.results.filter((item) => !seen.has(item.id))];
      });
      setNextPage(result.next ? page + 1 : null);
      setListState("ready");
    } catch {
      if (!controller.signal.aborted) setListState("error");
    } finally {
      if (listRequest.current === controller) listRequest.current = null;
    }
  }, []);

  useEffect(() => {
    const refresh = () => { void loadPage(1); };
    refresh();
    document.addEventListener("realm-lifecycle-updated", refresh);
    return () => {
      document.removeEventListener("realm-lifecycle-updated", refresh);
      listRequest.current?.abort();
      deleteRequest.current?.abort();
    };
  }, [loadPage]);

  async function requestDeletion(conference: ConferenceSummary) {
    if (deleteRequest.current || deleteTarget) return;
    const controller = new AbortController();
    const token = localStorage.getItem("authtoken");
    deleteRequest.current = controller;
    setDeleteState("checking");

    try {
      const lifecycle = await getRealmLifecycle(conference.id, controller.signal);
      if (controller.signal.aborted || localStorage.getItem("authtoken") !== token) return;
      if (!lifecycle.capabilities.can_delete_realm || lifecycle.owned_realm_blocker_count > 0) {
        notify("warning", "This conference cannot be deleted right now.");
        void loadPage(1);
        return;
      }
      setDeleteTarget({ id: conference.id, name: lifecycle.name, token });
    } catch (error) {
      if (!controller.signal.aborted && localStorage.getItem("authtoken") === token) {
        notifyRequestError(error, "Could not check conference deletion permissions.");
        void loadPage(1);
      }
    } finally {
      deleteRequest.current = null;
      if (!controller.signal.aborted) setDeleteState(null);
    }
  }

  async function confirmDeletion() {
    if (!deleteTarget || deleteRequest.current) return;
    const { id, name, token } = deleteTarget;
    if (localStorage.getItem("authtoken") !== token) {
      setDeleteTarget(null);
      return;
    }

    const controller = new AbortController();
    deleteRequest.current = controller;
    setDeleteState("deleting");
    try {
      await deleteRealm(id, name);
      if (controller.signal.aborted || localStorage.getItem("authtoken") !== token) return;
      setItems((current) => current.filter((item) => item.id !== id));
      notify("success", "Deletion started.");
      document.dispatchEvent(new CustomEvent("realm-lifecycle-updated"));
    } catch (error) {
      if (!controller.signal.aborted && localStorage.getItem("authtoken") === token) {
        notifyRequestError(error, "Could not delete the conference.");
      }
    } finally {
      deleteRequest.current = null;
      if (!controller.signal.aborted) {
        setDeleteState(null);
        setDeleteTarget(null);
      }
    }
  }

  return (
    <section className="conference-list-panel tw-rounded-[24px] tw-bg-[var(--surface)] tw-border tw-border-[var(--border)] tw-shadow-[var(--shadow-sm)]" aria-labelledby={headingId}>
      <h2 id={headingId} className="tw-m-0 tw-text-left tw-text-[18px] tw-font-semibold">My Conferences</h2>
      <div
        className="conference-list-scroll cl-scroll"
        role="region"
        aria-label="Conference list"
        tabIndex={items.length ? 0 : undefined}
        onScroll={({ currentTarget }) => {
          const { scrollHeight, scrollTop, clientHeight } = currentTarget;
          if (listState === "ready" && nextPage && scrollHeight - scrollTop - clientHeight < 80) {
            void loadPage(nextPage);
          }
        }}
      >
        {items.length > 0 && (
          <ul className="conference-list">
            {items.map((conference) => {
              const scheduled = conference.starts_at ? new Date(conference.starts_at) : null;
              const label = scheduled && Number.isFinite(scheduled.getTime()) ? startTime.format(scheduled) : null;
              return (
                <li key={conference.id} className="conference-list-row">
                  <span className="conference-list-icon" aria-hidden="true">
                    {scheduled ? <FiCalendar size={17} /> : <FiVideo size={17} />}
                  </span>
                  <div className="conference-list-details">
                    <strong>{conference.name}</strong>
                    <div className="conference-list-labels">
                      <span className="conference-list-mode">{scheduled ? "Scheduled" : "Instant"}</span>
                      <span>{conference.my_role === "owner" ? "Owner" : "Member"}</span>
                    </div>
                    {label && conference.starts_at && <time dateTime={conference.starts_at}>{label}</time>}
                  </div>
                  <div className="conference-list-actions">
                    {conference.slug && (
                      <Link to={`/conference/${encodeURIComponent(conference.slug)}`} className="conference-list-join" aria-label={`Join ${conference.name} lobby`}>
                        Join <FiArrowRight className="conference-list-arrow" aria-hidden="true" size={14} />
                      </Link>
                    )}
                    {conference.capabilities?.can_delete_realm && (
                      <button type="button" className="conference-list-delete" title="Delete realm" aria-label={`Delete ${conference.name}`} disabled={deleteState !== null} onClick={() => void requestDeletion(conference)}>
                        <FiTrash2 aria-hidden="true" size={16} />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {listState === "loading" && <p className="conference-list-status" role="status">Loading conferences…</p>}
        {listState === "error" && <p className="conference-list-status" role="alert">Couldn’t load conferences.</p>}
        {listState === "ready" && items.length === 0 && <p className="conference-list-status">You don’t have any conferences yet.</p>}
        {listState !== "loading" && nextPage !== null && (
          <button type="button" className="conference-list-more" onClick={() => void loadPage(nextPage)}>
            {listState === "error" ? "Retry" : "Load more conferences"}
          </button>
        )}
      </div>
      {deleteTarget && (
        <ConfirmModal
          key={deleteTarget.id}
          title="Delete realm permanently?"
          message={`Permanently delete ${deleteTarget.name}? This cannot be undone.`}
          confirmationName={deleteTarget.name}
          confirmLabel="Permanently delete"
          isBusy={deleteState === "deleting"}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => void confirmDeletion()}
        />
      )}
    </section>
  );
}
