import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Lock, Plus, ShieldCheck } from 'lucide-react';
import { base64, createVerification, PROFILE, validateNewPassphrase, validateProfile, verifyConfiguration, type Configuration } from '@/reusables/encryption/crypto';
import { deriveKey } from '@/reusables/encryption/derive';
import { changeConfiguration, isStale, loadConfigurations, type EncryptionSettings, type Purpose } from '@/reusables/encryption/api';
import './passphrases.css';
import { useModalFocus } from '@/reusables/encryption/useModalFocus';
type Action = {kind:'add'|'rename'|'activate'|'deactivate'; group:Purpose; target?:Configuration};
export default function Passphrases() {
  const identity = useSelector((state: {authentication: {user: {entity_id: string}; active_entity_context?: {id:string}}}) => `${state.authentication.user.entity_id}:${state.authentication.active_entity_context?.id || ''}`);
  return <PassphraseWorkspace key={identity}/>;
}
function PassphraseWorkspace() {
  const [settings,setSettings] = useState<EncryptionSettings | null>(null);
  const [error,setError] = useState('');
  const [loading,setLoading] = useState(true);
  const [action,setAction] = useState<Action | null>(null);
  const [retry,setRetry] = useState(0);
  useEffect(() => { let alive = true; setLoading(true); setError(''); loadConfigurations().then(value => {if(alive)setSettings(value);}).catch(()=>{if(alive)setError('Could not load passphrases. Please retry.');}).finally(()=>{if(alive)setLoading(false);}); return()=>{alive=false;}; },[retry]);
  return <section className="passphrases" aria-label="Passphrase settings"><div className="passphrase-heading"><Lock size={20}/><h2>Passphrase</h2></div><p>Keep protected content readable only with your passphrase. Choose one for each purpose.</p><p className="passphrase-note">Passphrases cannot be recovered or reset. Keep your older passphrases to open content protected with them.</p><h3>Passphrase uses</h3>
    {loading ? <p role="status">Loading passphrases…</p> : error ? <div role="alert">{error}<button onClick={()=>setRetry(v=>v+1)}>Retry</button></div> : settings?.purposes.map(group=><section className="passphrase-group" key={group.purpose}><div className="passphrase-heading"><h3>{group.purpose === 'diary' ? 'Diary' : group.label}</h3><button onClick={()=>setAction({kind:'add',group})}><Plus size={14}/>Add passphrase</button></div><p>{group.active_configuration_id ? "One active passphrase" : "None active"} · Active passphrases protect new content. Changing the active passphrase does not re-encrypt older content.</p>{!group.configurations.length && <div className="passphrase-empty">No passphrase added yet.</div>}{group.configurations.map(config=><div className="passphrase-row" key={config.id}><ShieldCheck size={18}/><div><strong>{config.name}</strong><small>Added {new Date(config.created_at).toLocaleDateString()}</small></div><span className="passphrase-status" data-active={config.is_active}>{config.is_active ? 'Active' : 'Inactive'}</span><button onClick={()=>setAction({kind:'rename',group,target:config})}>Rename</button><button onClick={()=>setAction({kind:config.is_active?'deactivate':'activate',group,target:config})}>{config.is_active ? 'Disable' : 'Activate'}</button></div>)}</section>)}
    {action && settings && <PassphraseDialog key={`${action.kind}:${action.target?.id || ''}`} action={action} settings={settings} close={()=>setAction(null)} done={group=>{setSettings({...settings,purposes:settings.purposes.map(p=>p.purpose===group.purpose?group:p)});setAction(null);}} stale={()=>{setAction(null);setRetry(v=>v+1);}}/>}
  </section>;
}
function PassphraseDialog({action,settings,close,done,stale}:{action:Action;settings:EncryptionSettings;close:()=>void;done:(group:Purpose)=>void;stale:()=>void}) {
  const [name,setName] = useState(action.target?.name || '');
  const [phrase,setPhrase] = useState(''); const [confirm,setConfirm] = useState(''); const [current,setCurrent] = useState('');
  const [ack,setAck] = useState(false); const [busy,setBusy] = useState(false); const [error,setError] = useState('');
  const controller = useRef(new AbortController()); const running = useRef(false);
  useEffect(()=>{controller.current=new AbortController();return()=>controller.current.abort();},[]);
  const active = action.group.configurations.find(c=>c.id===action.group.active_configuration_id);
  const title = action.kind==='add'?'Add passphrase':action.kind==='rename'?'Rename passphrase':action.kind==='activate'?'Activate passphrase':'Disable passphrase';
  const clear = () => {setPhrase('');setConfirm('');setCurrent('');};
  const modal = useModalFocus<HTMLFormElement>(true,()=>{controller.current.abort();clear();close();});
  const submit = async (event:React.FormEvent) => {
    event.preventDefault(); if(running.current)return; running.current=true;setBusy(true);setError('');
    try {
      let payload:Record<string,unknown> = {expected_scope_version:action.group.scope_version};
      let id = action.target?.id || '';
      if(action.kind==='add') {
        validateNewPassphrase(phrase); if(phrase!==confirm)throw new Error('Passphrases do not match.'); if(!ack)throw new Error('Confirm that you understand there is no recovery.');
        validateProfile(settings.supported_profile); id=crypto.randomUUID();const salt=base64(crypto.getRandomValues(new Uint8Array(16)));
        const key=await deriveKey(phrase,PROFILE,salt,controller.current.signal);
        const verification=await createVerification(settings.owner,id,key);
        const {verification_aad:_,...wire}=verification; void _;
        payload={...payload,...PROFILE,...wire,id,purpose:action.group.purpose,name:name.trim(),salt};
      } else if(action.kind==='rename')payload.name=name.trim();
      else {
        if(active) {const key=await deriveKey(current,active,active.salt,controller.current.signal);payload.active_verification_proof=await verifyConfiguration(active,settings.owner,key);}
        if(action.kind==='activate' && action.target){const key=await deriveKey(phrase,action.target,action.target.salt,controller.current.signal);payload.target_verification_proof=await verifyConfiguration(action.target,settings.owner,key);}
      }
      clear();
      if(controller.current.signal.aborted)return;
      const result=await changeConfiguration(action.kind==='add'?'register':action.kind,id,payload);
      delete payload.active_verification_proof;delete payload.target_verification_proof;
      if(!controller.current.signal.aborted)done(result);
    } catch(error) {
      clear(); if(controller.current.signal.aborted)return;
      if(isStale(error)){window.alert('Passphrase settings changed. Review the refreshed list and confirm again.');stale();}
      else setError(action.kind==='rename'||action.kind==='add' ? (error instanceof Error && !('response' in error) ? error.message : 'Could not save passphrase settings. Please retry.') : 'Could not verify or update the passphrase. Check it and try again.');
    } finally {running.current=false;if(!controller.current.signal.aborted)setBusy(false);}
  };
  return <div className="passphrase-overlay"><form ref={modal} className="passphrase-dialog" role="dialog" aria-modal="true" aria-labelledby="passphrase-dialog-title" onSubmit={event=>void submit(event)}><Lock size={25}/><h2 id="passphrase-dialog-title">{title}</h2><p>{action.kind==='add'?'Add an inactive passphrase, then activate it when you are ready.':action.kind==='deactivate'?'New entries will be saved without passphrase encryption. Older encrypted entries still need their original passphrase.':action.kind==='activate'?'Confirm the selected passphrase and the currently active one, if any. Older entries keep their original protection.':'Choose a name that helps you recognize this passphrase.'}</p>
    {(action.kind==='add'||action.kind==='rename')&&<label>Name<input autoFocus required maxLength={80} value={name} disabled={busy} onChange={e=>setName(e.target.value)}/></label>}
    {(action.kind==='activate'||action.kind==='deactivate')&&active&&<label>Current passphrase · {active.name}<input type="password" autoComplete="off" required value={current} disabled={busy} onChange={e=>setCurrent(e.target.value)}/></label>}
    {(action.kind==='add'||action.kind==='activate')&&<label>{action.kind==='add'?'New passphrase':`Selected passphrase · ${action.target?.name}`}<input type="password" autoComplete="new-password" required value={phrase} disabled={busy} onChange={e=>setPhrase(e.target.value)}/></label>}
    {action.kind==='add'&&<><label>Confirm passphrase<input type="password" autoComplete="new-password" required value={confirm} disabled={busy} onChange={e=>setConfirm(e.target.value)}/></label><small>At least 15 characters. Spaces and capitalization are preserved exactly.</small><label className="passphrase-check"><input type="checkbox" checked={ack} disabled={busy} onChange={e=>setAck(e.target.checked)}/>I understand that a forgotten passphrase cannot be recovered.</label></>}
    {error&&<p role="alert" className="passphrase-error">{error}</p>}<div className="passphrase-actions"><button type="button" onClick={()=>{controller.current.abort();clear();close();}}>Cancel</button><button disabled={busy} className="passphrase-primary">{busy?'Working…':title}</button></div></form></div>;
}
