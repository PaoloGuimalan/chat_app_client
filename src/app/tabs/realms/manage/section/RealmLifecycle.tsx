import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import { Btn, Card } from '@/reusables/design';
import ConfirmModal from '@/app/widgets/modals/ConfirmModal';
import { getRealmLifecycle, deactivateRealm, deleteRealm } from '@/reusables/hooks/realmLifecycleRequests';
import { notify, notifyRequestError } from '@/reusables/hooks/errormessages';
import type { IRealmProfileInfo } from '@/reusables/vars/interfaces';
import type { RealmLifecycle as LifecycleData } from '@/reusables/vars/realmLifecycle';

export default function RealmLifecycle({realm, onCompleted}: {realm: IRealmProfileInfo; onCompleted?: () => void}) {
  const actor = useSelector((s: {authentication: {user: {entity_id: string}; active_entity_context?: {id: string}}}) => s.authentication.active_entity_context?.id ?? s.authentication.user.entity_id);
  const token = localStorage.getItem('authtoken');
  const scope = `${realm.id}:${actor}:${token}`;
  const live = useRef(scope); live.current = scope;
  const navigate = useNavigate();
  const [revision, refresh] = useState(0);
  const [loaded, setLoaded] = useState<{scope: string; data: LifecycleData | null; loading: boolean}>({scope, data: null, loading: true});
  const [prompt, setPrompt] = useState<'deactivate' | 'delete' | null>(null);
  const [busy, setBusy] = useState(false);
  const data = loaded.scope === scope ? loaded.data : null;
  const loading = loaded.scope !== scope || loaded.loading;
  const current = () => live.current === scope && token === localStorage.getItem('authtoken');
  useEffect(() => {
    let active = true; const controller = new AbortController();
    setLoaded({scope, data: null, loading: true}); setPrompt(null); setBusy(false);
    getRealmLifecycle(realm.id, controller.signal).then(data => {
      if (active && current()) setLoaded({scope, data, loading: false});
    }).catch(error => {
      if (!active || !current()) return;
      setLoaded({scope, data: null, loading: false}); notifyRequestError(error, 'Could not load realm settings.');
    });
    return () => {active = false; controller.abort();};
  // Scope binds each response to its realm and authenticated identity.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, revision]);
  const submitting = useRef(false);
  async function submit() {
    if (!data || !prompt || submitting.current || !current()) return;
    submitting.current = true; setBusy(true);
    try {
      if (prompt === 'delete') await deleteRealm(realm.id, data.name);
      else await deactivateRealm(realm.id);
      if (!current()) return;
      notify('success', prompt === 'delete' ? 'Deletion started.' : `${data.name} was deactivated.`);
      document.dispatchEvent(new CustomEvent('realm-lifecycle-updated'));
      onCompleted?.(); navigate(data.return_server_id ? `/servers/${encodeURIComponent(data.return_server_id)}` : '/');
    } catch (error) {
      if (current()) { notifyRequestError(error, 'Could not update the realm.'); setPrompt(null); refresh(n => n + 1); }
    } finally {submitting.current = false; if (current()) setBusy(false);}
  }
  const layout = {padding: 20, width: '100%', minWidth: 0, display: 'flex', flexDirection: 'column' as const, alignItems: 'stretch', gap: 16, textAlign: 'left' as const};
  if (loading) return <SkeletonTheme baseColor="var(--surface-2)" highlightColor="var(--surface-hover)"><div style={layout} aria-label="Loading realm settings"><Skeleton height={26} width="55%"/><Skeleton height={160}/><Skeleton height={160}/></div></SkeletonTheme>;
  if (!data) return <div style={layout}><p>Realm settings are unavailable.</p><Btn onClick={() => refresh(n => n + 1)}>Retry</Btn></div>;
  const children = data.kind === 'server' ? ` This includes ${data.child_count} channels and voice channels.` : '';
  return <section style={layout}>
    <h2 className="tw-m-0 tw-text-[20px] tw-font-semibold tw-text-left">Deactivation & Deletion</h2>
    {data.capabilities.can_deactivate_realm && <Card pad={20}><div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:12}}>
      <h3 className="tw-m-0 tw-text-[16px] tw-font-semibold">Deactivate realm</h3>
      <p className="tw-m-0 tw-text-[13px] tw-text-[var(--text-2)]">Hide the realm and its content from everyone, including its owner. Data is preserved.{children} Restore it from Settings → Realms → Deactivated Realms.</p>
      {!data.capabilities.can_reactivate_realm && <p className="cl-text-body-sm">You do not currently have permission to reactivate this realm. An owner or authorized member will need to restore it.</p>}
      <Btn disabled={busy} onClick={() => setPrompt('deactivate')}>Deactivate realm</Btn>
    </div></Card>}
    {data.capabilities.can_delete_realm && <Card pad={20}><div style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:12}}>
      <h3 className="tw-m-0 tw-text-[16px] tw-font-semibold">Permanently delete realm</h3>
      <p className="tw-m-0 tw-text-[13px] tw-text-[var(--text-2)]">Permanently remove this realm, its posts, conversations, membership, invitations and settings.{children} Shared files and reported evidence follow existing retention rules. This cannot be undone.</p>
      {data.owned_realm_blocker_count > 0 && <p className="cl-text-body-sm">Transfer ownership of {data.owned_realm_blocker_count} other realms first{data.owned_realm_blockers.length ? `: ${data.owned_realm_blockers.map(r => r.name).join(', ')}` : '.'}</p>}
      <Btn variant="outline" style={{color:'var(--pink)',borderColor:'var(--pink)'}} disabled={busy || data.owned_realm_blocker_count > 0} onClick={() => setPrompt('delete')}>Delete realm</Btn>
    </div></Card>}
    {prompt && <ConfirmModal key={`${scope}:${prompt}:${data.name}`} title={prompt === 'delete' ? 'Delete realm permanently?' : 'Deactivate realm?'}
      message={prompt === 'delete' ? `Permanently delete ${data.name}? This cannot be undone.${children}` : `Everyone will lose access to ${data.name} until it is reactivated.${children}`}
      confirmationName={prompt === 'delete' ? data.name : undefined} confirmLabel={prompt === 'delete' ? 'Permanently delete' : 'Deactivate'} isBusy={busy}
      onClose={() => {if (!busy) setPrompt(null);}} onConfirm={submit}/>} 
  </section>;
}
