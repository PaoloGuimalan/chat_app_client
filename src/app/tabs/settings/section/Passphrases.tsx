import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Lock, Plus, ShieldCheck } from 'lucide-react';
import { base64, configurationSupportsPurpose, createVerification, isPurposeActive, PROFILE, validateNewPassphrase, validateProfile, verifyConfiguration, type Configuration } from '@/reusables/encryption/crypto';
import { deriveKey } from '@/reusables/encryption/derive';
import { changeConfiguration, isStale, loadConfigurations, type EncryptionSettings, type Purpose } from '@/reusables/encryption/api';
import './passphrases.css';
import { useModalFocus } from '@/reusables/encryption/useModalFocus';
type Action = {kind:'add'|'rename'|'activate'|'deactivate'|'uses'; group?:Purpose; target?:Configuration};
const purposeLabel = (purpose: string, catalog: Purpose[]) => purpose === 'diary' ? 'Diary' : purpose === 'messages' ? 'Messages' : catalog.find(group=>group.purpose===purpose)?.label || purpose;
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
  const catalog=settings?.purposes || [];
  const addGroup=catalog.find(isPurposeActive);
  const configurations=settings?.configurations ?? [...new Map(catalog.flatMap(group=>group.configurations).map(config=>[config.id,config])).values()];
  return <section className="passphrases" aria-label="Passphrase settings"><div className="passphrase-heading"><Lock size={20}/><h2>Passphrase</h2></div><p>Use passphrases to protect content and lock supported screens. One passphrase can be used for several purposes. Only one passphrase can be active at a time.</p><p className="passphrase-note">Passphrases cannot be recovered or reset. Keep your older passphrases to open content protected with them.</p>
    {loading ? <p role="status">Loading passphrases…</p> : error ? <div role="alert">{error}<button onClick={()=>setRetry(v=>v+1)}>Retry</button></div> : <><div className="passphrase-heading passphrase-list-heading"><h3>Your passphrases</h3><button disabled={!addGroup} onClick={()=>{if(addGroup)setAction({kind:'add',group:addGroup});}}><Plus size={14}/>Add passphrase</button></div><p>Changing the active passphrase does not re-encrypt older content.</p>{!configurations.length&&<div className="passphrase-empty">No passphrase added yet.</div>}{configurations.map(config=>{
      const linked=catalog.filter(group=>configurationSupportsPurpose(config,group.purpose));
      const first=linked[0];
      const enabled=linked.find(isPurposeActive);
      const uses=config.purposes??[config.purpose];
      return <div className="passphrase-row" key={config.id}><ShieldCheck size={18}/><div className="passphrase-row-main"><strong>{config.name}</strong><small>Added {new Date(config.created_at).toLocaleDateString()}</small><div className="passphrase-uses">{!uses.length&&<span className="passphrase-use">No uses selected</span>}{uses.map(purpose=>{const group=catalog.find(item=>item.purpose===purpose);return <span className="passphrase-use" key={purpose} data-paused={group&&!isPurposeActive(group)}>{purposeLabel(purpose,catalog)}{group&&!isPurposeActive(group)?' · paused':''}</span>;})}</div></div><span className="passphrase-status" data-active={config.is_active}>{config.is_active?'Active':'Inactive'}</span><div className="passphrase-row-actions"><button onClick={()=>setAction({kind:'uses',target:config})}>Edit uses</button><button onClick={()=>setAction({kind:'rename',group:first,target:config})}>Rename</button><button disabled={!config.is_active&&!enabled} onClick={()=>setAction({kind:config.is_active?'deactivate':'activate',group:config.is_active?first:enabled,target:config})}>{config.is_active?'Disable':'Activate'}</button></div></div>;
    })}</>}
    {action && settings && <PassphraseDialog key={`${action.kind}:${action.group?.purpose || ''}:${action.target?.id || ''}`} action={action} settings={settings} close={()=>setAction(null)} done={value=>{setSettings(value);setAction(null);}} stale={()=>{setAction(null);setRetry(v=>v+1);}}/>}
  </section>;
}
function PassphraseDialog({action,settings,close,done,stale}:{action:Action;settings:EncryptionSettings;close:()=>void;done:(value:EncryptionSettings)=>void;stale:()=>void}) {
  const [name,setName] = useState(action.target?.name || '');
  const initialPurposes=action.target?.purposes ?? (action.target?[action.target.purpose]:[]);
  const [purposes,setPurposes] = useState(action.kind==='uses'?initialPurposes:action.group?[action.group.purpose]:[]);
  const [phrase,setPhrase] = useState(''); const [confirm,setConfirm] = useState(''); const [current,setCurrent] = useState('');
  const [ack,setAck] = useState(false); const [busy,setBusy] = useState(false); const [error,setError] = useState('');
  const controller = useRef(new AbortController()); const running = useRef(false);
  useEffect(()=>{controller.current=new AbortController();return()=>controller.current.abort();},[]);
  const active = (settings.configurations ?? settings.purposes.flatMap(group=>group.configurations)).find(config=>config.is_active);
  const title = action.kind==='add'?'Add passphrase':action.kind==='uses'?'Edit passphrase uses':action.kind==='rename'?'Rename passphrase':action.kind==='activate'?'Activate passphrase':'Disable passphrase';
  const clear = () => {setPhrase('');setConfirm('');setCurrent('');};
  const modal = useModalFocus<HTMLFormElement>(true,()=>{controller.current.abort();clear();close();});
  const submit = async (event:React.FormEvent) => {
    event.preventDefault(); if(running.current)return; running.current=true;setBusy(true);setError('');
    try {
      const group=action.kind==='add'?settings.purposes.find(item=>item.purpose===purposes[0]&&isPurposeActive(item)):action.group;
      if(action.kind==='add'&&(!group||purposes.some(purpose=>!settings.purposes.some(item=>item.purpose===purpose&&isPurposeActive(item)))))throw new Error('Select at least one available passphrase use.');
      if(action.kind==='activate'&&(!group||!isPurposeActive(group)))throw new Error('This passphrase use is temporarily inactive.');
      let payload:Record<string,unknown> = group?{expected_scope_version:group.scope_version,purpose:group.purpose}:{expected_scope_version:settings.scope_version};
      let id = action.target?.id || '';
      if(action.kind==='add') {
        validateNewPassphrase(phrase); if(phrase!==confirm)throw new Error('Passphrases do not match.'); if(!ack)throw new Error('Confirm that you understand there is no recovery.');
        validateProfile(settings.supported_profile); id=crypto.randomUUID();const salt=base64(crypto.getRandomValues(new Uint8Array(16)));
        const key=await deriveKey(phrase,PROFILE,salt,controller.current.signal);
        const verification=await createVerification(settings.owner,id,key,group!.purpose);
        const {verification_aad:_,...wire}=verification; void _;
        payload={...payload,...PROFILE,...wire,id,purposes,name:name.trim(),salt};
      } else if(action.kind==='uses') {
        if(!action.target||!settings.scope_version)throw new Error('Refresh passphrase settings and try again.');
        if(purposes.some(purpose=>!settings.purposes.some(item=>item.purpose===purpose&&(isPurposeActive(item)||initialPurposes.includes(purpose)))))throw new Error('This passphrase use is temporarily inactive.');
        const key=await deriveKey(phrase,action.target,action.target.salt,controller.current.signal);
        payload={purposes,expected_scope_version:settings.scope_version,target_verification_proof:await verifyConfiguration(action.target,settings.owner,key)};
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
  return <div className="passphrase-overlay"><form ref={modal} className="passphrase-dialog" role="dialog" aria-modal="true" aria-labelledby="passphrase-dialog-title" onSubmit={event=>void submit(event)}>{action.kind==='uses'?<div className="passphrase-dialog-heading"><Lock size={22} aria-hidden="true"/><h2 id="passphrase-dialog-title">{title}</h2></div>:<><Lock size={25}/><h2 id="passphrase-dialog-title">{title}</h2></>}<p>{action.kind==='add'?'Add an inactive passphrase, then activate it when you are ready.':action.kind==='uses'?'Choose where to use this passphrase and confirm it to save. Changes apply to future encryption and screen locks. Older encrypted content still needs its original passphrase.':action.kind==='deactivate'?'Disable this passphrase for new encryption and screen locks. Older encrypted content still needs its original passphrase.':action.kind==='activate'?'Confirm the selected passphrase and the currently active one, if any. Older entries keep their original protection.':'Choose a name that helps you recognize this passphrase.'}</p>
    {(action.kind==='add'||action.kind==='rename')&&<label>Name<input autoFocus required maxLength={80} value={name} disabled={busy} onChange={e=>setName(e.target.value)}/></label>}
    {(action.kind==='add'||action.kind==='uses')&&<fieldset disabled={busy}><legend>Passphrase uses</legend>{settings.purposes.filter(group=>action.kind==='uses'||isPurposeActive(group)).map(group=><label className="passphrase-check" key={group.purpose}><input type="checkbox" disabled={!isPurposeActive(group)&&!initialPurposes.includes(group.purpose)} checked={purposes.includes(group.purpose)} onChange={event=>setPurposes(previous=>event.target.checked?[...previous,group.purpose]:previous.filter(purpose=>purpose!==group.purpose))}/>{`Use for ${purposeLabel(group.purpose,settings.purposes)}${!isPurposeActive(group)?' · paused':''}`}</label>)}</fieldset>}
    {(action.kind==='activate'||action.kind==='deactivate')&&active&&<label>Current passphrase · {active.name}<input type="password" autoComplete="off" required value={current} disabled={busy} onChange={e=>setCurrent(e.target.value)}/></label>}
    {(action.kind==='add'||action.kind==='activate'||action.kind==='uses')&&<label>{action.kind==='add'?'New passphrase':action.kind==='uses'?<>Enter passphrase for <strong>{action.target?.name}</strong></>:`Selected passphrase · ${action.target?.name}`}<input type="password" autoComplete={action.kind==='add'?'new-password':'off'} autoFocus={action.kind==='uses'} required value={phrase} disabled={busy} aria-invalid={action.kind==='uses'&&Boolean(error)} onChange={e=>{setPhrase(e.target.value);setError('');}}/></label>}
    {action.kind==='add'&&<><label>Confirm passphrase<input type="password" autoComplete="new-password" required value={confirm} disabled={busy} onChange={e=>setConfirm(e.target.value)}/></label><small>At least 15 characters. Spaces and capitalization are preserved exactly.</small><label className="passphrase-check"><input type="checkbox" checked={ack} disabled={busy} onChange={e=>setAck(e.target.checked)}/>I understand that a forgotten passphrase cannot be recovered.</label></>}
    {error&&<p role="alert" className="passphrase-error">{error}</p>}<div className="passphrase-actions"><button type="button" onClick={()=>{controller.current.abort();clear();close();}}>Cancel</button><button disabled={busy} className="passphrase-primary">{busy?'Working…':action.kind==='uses'?'Save changes':title}</button></div></form></div>;
}
