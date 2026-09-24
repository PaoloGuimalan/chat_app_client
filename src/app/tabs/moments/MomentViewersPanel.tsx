/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Avatar, Icon, SegTabs, Toggle } from "@/reusables/design";
import {
  CreateInitialConversation,
  GetEphemeralViewersRequest,
  UpdateMomentRequest,
} from "@/reusables/hooks/requests";
import { SET_MUTATE_ALERTS } from "@/redux/types";
import type {
  EphemeralAudience,
  IEphemeralViewers,
  IPost,
} from "@/reusables/vars/interfaces";
import {
  AUDIENCES,
  MOMENTS_CHANGED_EVENT,
  entityAvatar,
  entityName,
  timeAgoLabel,
} from "./ephemeral";

type ViewerFilter = "all" | "reacted" | "replied";

const footerBtn = {
  flex: 1,
  height: 36,
  borderRadius: "var(--r-sm)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  fontSize: 12.75,
  fontWeight: 650,
  cursor: "pointer",
} as const;

/**
 * Your own moment's side panel (design 1c): who saw it, what they reacted and
 * whether they replied, with All / Reacted / Replied tabs; and the moment's
 * own controls - Archive (your moments archive), Audience (who can see it,
 * and whether it takes replies & reactions) and Delete.
 */
function MomentViewersPanel({
  moment,
  onDelete,
  onArchive,
  onChanged,
  archived = false,
}: {
  moment: IPost;
  onDelete: () => void;
  /** Ends it now - it moves to your archive. */
  onArchive: () => void;
  onChanged: (patch: Partial<IPost>) => void;
  /**
   * Played from the archive: it has expired, so there is nothing left to
   * change - but who saw it, reacted and replied is still yours to see.
   */
  archived?: boolean;
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<ViewerFilter>("all");
  const [data, setData] = useState<IEphemeralViewers | null>(null);
  // Kept apart from the list: switching All / Reacted / Replied reloads the
  // list, but the tab counts are the same for every filter and must not
  // flash to 0 while it loads.
  const [totals, setTotals] = useState<IEphemeralViewers["totals"] | null>(null);
  const [audienceOpen, setAudienceOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const alert = (type: string, content: string) =>
    dispatch({ type: SET_MUTATE_ALERTS, payload: { alerts: { type, content } } });

  // A different moment: its counts are unknown until it loads.
  useEffect(() => setTotals(null), [moment.post_id]);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    GetEphemeralViewersRequest("moment", moment.post_id, filter)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setTotals(res.totals);
      })
      .catch(() => !cancelled && setData({ count: 0, next: null, results: [], totals: { views: 0, reactions: 0, replies: 0 } }));
    return () => {
      cancelled = true;
    };
  }, [moment.post_id, filter]);

  const count = (n: number | undefined) => (n === undefined ? "" : ` · ${n}`);

  const saveSettings = async (fields: { privacy_status?: EphemeralAudience; allow_replies?: boolean }) => {
    if (saving) return;
    setSaving(true);
    try {
      const saved = await UpdateMomentRequest(moment.post_id, fields);
      onChanged({ privacy_status: saved.privacy_status, details: saved.details });
      window.dispatchEvent(new CustomEvent(MOMENTS_CHANGED_EVENT));
    } catch (err: any) {
      alert("warning", err?.message || "We couldn't update this Moment.");
    } finally {
      setSaving(false);
    }
  };

  const messageViewer = async (entityId: string) => {
    const conversationID = await CreateInitialConversation(entityId);
    if (conversationID) navigate(`/messages/${conversationID}`);
    else alert("warning", "We couldn't open that chat.");
  };

  return (
    <div style={{ width: "100%", height: "100%", textAlign: "left", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", overflow: "hidden", flex: "none", position: "relative" }}>
      <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 34, height: 34, borderRadius: "var(--r-sm)", background: "var(--brand-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon n="visibility" s={17} c="var(--brand)" />
            </span>
            <span style={{ fontSize: "var(--fs-heading)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text)" }}>Viewers</span>
          </div>
          {totals && (
            <span style={{ fontSize: "var(--fs-meta)", color: "var(--text-3)" }}>
              {totals.views} {totals.views === 1 ? "view" : "views"} · {totals.reactions} {totals.reactions === 1 ? "reaction" : "reactions"}
            </span>
          )}
        </div>
        <SegTabs
          tabs={[
            { key: "all", label: `All${count(totals?.views)}` },
            { key: "reacted", label: `Reacted${count(totals?.reactions)}` },
            { key: "replied", label: `Replied${count(totals?.replies)}` },
          ]}
          value={filter}
          onChange={(k) => setFilter(k as ViewerFilter)}
          style={{ display: "flex" }}
        />
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "8px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
        {data === null && <span style={{ padding: 8, color: "var(--text-3)", fontSize: "var(--fs-caption)" }}>Loading…</span>}
        {data && data.results.length === 0 && (
          <span style={{ padding: 8, color: "var(--text-3)", fontSize: "var(--fs-caption)" }}>
            {filter === "all" ? "No one has seen this Moment yet." : filter === "reacted" ? "No reactions yet." : "No replies yet."}
          </span>
        )}
        {data?.results.map((viewer) => (
          <div key={viewer.entity.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 8px", borderRadius: "var(--r-md)" }}>
            <Avatar id={viewer.entity.id} entityId={viewer.entity.id} name={entityName(viewer.entity)} src={entityAvatar(viewer.entity)} size={38} />
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "var(--fs-body-sm)", fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {entityName(viewer.entity)}
              </span>
              <span style={{ fontSize: "var(--fs-meta)", color: "var(--text-3)" }}>
                {timeAgoLabel(viewer.last_activity_at ?? viewer.viewed_at)}
                {viewer.replied ? " · replied" : ""}
              </span>
            </div>
            {viewer.reaction && <span style={{ fontSize: 19 }}>{viewer.reaction.emoji}</span>}
            <button
              onClick={() => messageViewer(viewer.entity.id)}
              title="Message"
              aria-label="Message"
              style={{ width: 30, height: 30, borderRadius: "var(--r-sm)", border: "none", background: "transparent", color: "var(--text-3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Icon n="chat_bubble_outline" s={17} />
            </button>
          </div>
        ))}
      </div>

      {audienceOpen && (
        <div style={{ position: "absolute", left: 12, right: 12, bottom: 64, padding: 12, borderRadius: "var(--r-md)", border: "1px solid var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-md)", display: "flex", flexDirection: "column", gap: 8, zIndex: 3 }}>
          <span style={{ fontSize: "var(--fs-meta)", fontWeight: 600, color: "var(--text-2)" }}>Who can see this</span>
          <SegTabs
            tabs={AUDIENCES.map((a) => ({ key: a.key, label: a.label, icon: a.icon }))}
            value={moment.privacy_status}
            onChange={(k) => saveSettings({ privacy_status: k as EphemeralAudience })}
            style={{ display: "flex" }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ flex: 1, fontSize: "var(--fs-body-sm)", fontWeight: 600, color: "var(--text)" }}>Allow replies &amp; reactions</span>
            <Toggle
              on={moment.details?.allow_replies !== false}
              onChange={(on) => saveSettings({ allow_replies: on })}
            />
          </div>
        </div>
      )}

      <div style={{ padding: "12px 16px 14px", borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
        {!archived && (
          <>
            <button onClick={onArchive} style={{ ...footerBtn, background: "var(--surface)", border: "1px solid var(--border-2)", color: "var(--text)" }}>
              <Icon n="inventory_2" s={16} />
              Archive
            </button>
            <button onClick={() => setAudienceOpen((o) => !o)} style={{ ...footerBtn, background: audienceOpen ? "var(--brand-soft)" : "var(--surface)", border: "1px solid var(--border-2)", color: "var(--text)" }}>
              <Icon n="group" s={16} />
              Audience
            </button>
          </>
        )}
        <button onClick={onDelete} style={{ ...footerBtn, background: "var(--pink-soft)", border: "none", color: "var(--pink)" }}>
          <Icon n="delete_outline" s={16} />
          Delete
        </button>
      </div>
    </div>
  );
}

export default MomentViewersPanel;
