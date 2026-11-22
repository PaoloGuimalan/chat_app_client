import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Skeleton from 'react-loading-skeleton';
import { Btn, Card, Avatar } from '@/reusables/design';
import { listDeactivatedRealms, reactivateRealm } from '@/reusables/hooks/realmLifecycleRequests';
import { notify, notifyRequestError } from '@/reusables/hooks/errormessages';
import type { RecoveryRealm } from '@/reusables/vars/realmLifecycle';

export default function DeactivatedRealms() {
  const actor = useSelector((s: {authentication: {user: {entity_id: string}}}) => s.authentication.user.entity_id);
  const token = localStorage.getItem('authtoken'); const scope = `${actor}:${token}`;
  const live = useRef(scope); live.current = scope;
  const generation = useRef(0);
  const [rows, setRows] = useState<RecoveryRealm[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [revision, refresh] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const pending = useRef(false);
  const [actors, setActors] = useState<Record<string,string>>({});
  const [loadedScope, setLoadedScope] = useState(scope);
  const current = () => live.current === scope && token === localStorage.getItem('authtoken');
  async function load(cursor?: string) {
    const ticket = ++generation.current;
    setLoading(true); setFailed(false);
    if (!cursor) {setRows([]); setActors({}); setNext(null); setLoadedScope(scope);}
    try {
      const result = await listDeactivatedRealms(cursor);
      if (!current() || ticket !== generation.current) return;
      setRows(old => cursor ? [...new Map([...old, ...result.items].map(row => [row.realm_id,row])).values()] : result.items);
      setNext(result.next_cursor);
    } catch (error) {
      if (!current() || ticket !== generation.current) return;
      setFailed(true); notifyRequestError(error, 'Could not load deactivated realms.');
    } finally {if (current() && ticket === generation.current) setLoading(false);}
  }
  useEffect(() => {
    setBusy(null);
    void load();
    const changed = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (!detail?.event || ['realm_lifecycle_changed','realm_access_changed','reconnected'].includes(detail.event)) refresh(n => n + 1);
    };
    document.addEventListener('community-changed', changed);
    // This ref is a request generation counter, not a DOM element to capture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => {generation.current++; document.removeEventListener('community-changed',changed);};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, revision]);
  async function restore(row: RecoveryRealm) {
    if (pending.current || !current() || row.blocked_by_parent) return;
    const actorId = actors[row.realm_id] ?? row.actors[0]?.entity_id;
    if (!actorId) return;
    pending.current = true; setBusy(row.realm_id);
    try {
      await reactivateRealm(row.realm_id, actorId);
      if (!current()) return;
      setRows(old => old.filter(item => item.realm_id !== row.realm_id));
      notify('success', `${row.name} was reactivated.`);
      document.dispatchEvent(new CustomEvent('community-changed',{detail:{realm_id:row.realm_id,event:'realm_lifecycle_changed'}}));
    } catch (error) {if (current()) {notifyRequestError(error,'Could not reactivate the realm.'); refresh(n => n + 1);}}
    finally {pending.current = false; if(current()) setBusy(null);}
  }
  const visible = loadedScope === scope ? rows : [];
  return <section style={{padding:20,width:'100%',minWidth:0,display:'flex',flexDirection:'column',alignItems:'stretch',gap:14,textAlign:'left'}}>
    <h2 className="tw-m-0 tw-text-[20px] tw-font-semibold tw-text-left">Deactivated Realms</h2>
    <p className="tw-m-0 tw-text-[13px] tw-text-[var(--text-2)]">Realms you can reactivate through your profile or an authorized page. Reactivating does not switch your active profile.</p>
    {visible.map(row => <Card key={row.realm_id} pad={16}><div style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:12}}>
      <Avatar id={row.realm_id} name={row.name} src={row.profile ?? undefined} size={42}/>
      <div style={{flex:'1 1 200px',minWidth:0}}><strong className="cl-text-body">{row.name}</strong><p className="cl-text-caption tw-text-[var(--text-2)]">{row.kind} · Deactivated</p>
      {row.deactivated_at && <p className="tw-m-0 tw-text-[12px] tw-text-[var(--text-2)]">{new Date(row.deactivated_at).toLocaleDateString()}</p>}
      {row.blocked_by_parent && <p className="cl-text-body-sm">Reactivate the parent server first{row.parent_recovery_realm_id ? ' from this list.' : '. Its owner or an authorized member must restore it.'}</p>}</div>
      {row.actors.length > 1 ? <label className="cl-text-caption">Reactivate as<select aria-label={`Reactivate ${row.name} as`} value={actors[row.realm_id] ?? row.actors[0].entity_id}
        disabled={busy !== null || loading} onChange={event => setActors(old => ({...old,[row.realm_id]:event.target.value}))}
        className="tw-block tw-max-w-full tw-p-[8px] tw-rounded-[8px] tw-bg-[var(--surface-2)] tw-text-[var(--text)] tw-border tw-border-[var(--border)]">
        {row.actors.map(actor => <option key={actor.entity_id} value={actor.entity_id}>{actor.name}</option>)}
      </select></label> : <span className="cl-text-caption tw-text-[var(--text-2)]">As {row.actors[0]?.name}</span>}
      <Btn disabled={loading || busy !== null || row.blocked_by_parent || !row.actors.length} onClick={() => void restore(row)}>{busy === row.realm_id ? 'Reactivating…' : 'Reactivate'}</Btn>
    </div></Card>)}
    {(loading || loadedScope !== scope) && <div aria-label="Loading deactivated realms"><Skeleton height={94} count={3}/></div>}
    {!loading && !failed && !visible.length && <p>No deactivated realms available.</p>}
    {failed && <Btn onClick={() => void load(visible.length ? next ?? undefined : undefined)}>Retry</Btn>}
    {!loading && next && !failed && <Btn onClick={() => void load(next)}>Load more</Btn>}
  </section>;
}
