import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { loadConfiguration, loadConfigurations, type EncryptionSettings } from '@/reusables/encryption/api';
import { configurationSupportsPurpose, decryptEntry, encryptEntry, entryEnvelopes, isPurposeActive, verifyConfiguration, type Configuration } from '@/reusables/encryption/crypto';
import { deriveKey } from '@/reusables/encryption/derive';
import { useModalFocus } from '@/reusables/encryption/useModalFocus';
import PassphraseUnlockDialog from '@/reusables/encryption/PassphraseUnlockDialog';
import type { IEntry, INewEntry } from '@/reusables/vars/interfaces';
import Passphrases from '../../settings/section/Passphrases';
import '../../settings/section/passphrases.css';
export type ProtectedEntry = IEntry & {_locked?: string; _lockError?: string};
interface Session {
  encryptionEnabled: boolean;
  active: Configuration | undefined; unlockedEntry: ProtectedEntry | null;
  read: (entry:IEntry)=>Promise<ProtectedEntry>;
  save: (entry:INewEntry)=>Promise<INewEntry|null>;
  unlock: (id:string, source:IEntry)=>void;
}
const Context = createContext<Session | null>(null);
export const useDiaryProtection = () => useContext(Context);
export default function DiaryProtection({children}:{children:ReactNode}) {
  const {userID}=useParams();const navigate=useNavigate();
  const location=useLocation();const currentLocation=useRef(location);
  const [settings,setSettings]=useState<EncryptionSettings|null>(null);
  const [phase,setPhase]=useState<'loading'|'base'|'ready'|'error'|'intro'|'setup'>('loading');
  const [pending,setPending]=useState<Configuration|null>(null);
  const [phrase,setPhrase]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [unlockedEntry,setUnlockedEntry]=useState<ProtectedEntry|null>(null);const [retry,setRetry]=useState(0);
  const pendingSource=useRef<IEntry|null>(null);
  const pendingSave=useRef<((key:CryptoKey|null)=>void)|null>(null);
  const [confirmingSave,setConfirmingSave]=useState(false);
  const cancelSave=()=>{pendingSave.current?.(null);pendingSave.current=null;setConfirmingSave(false);};
  const keys=useRef(new Map<string,CryptoKey>());const controller=useRef(new AbortController());const generation=useRef(0);const running=useRef(false);
  const historical=useRef(new Map<string,Configuration>());
  const promptGeneration=useRef(0);
  const group=settings?.purposes.find(p=>p.purpose==='diary');
  const encryptionEnabled=isPurposeActive(group);
  const active=group?.configurations.find(c=>c.id===group.active_configuration_id);
  useLayoutEffect(()=>{
    if(currentLocation.current===location)return;
    currentLocation.current=location;promptGeneration.current++;
    cancelSave();controller.current.abort();controller.current=new AbortController();pendingSource.current=null;setUnlockedEntry(null);setPhrase('');setError('');setBusy(false);running.current=false;
    if(phase==='ready')setPending(null);
  },[location]);
  const exit=(back=false)=>{cancelSave();controller.current.abort();keys.current.clear();historical.current.clear();pendingSource.current=null;setUnlockedEntry(null);setPhrase('');setPhase('loading');if(back&&window.history.state?.idx>0)navigate(-1);else navigate(`/${encodeURIComponent(userID||'')}`,{replace:true});};
  useEffect(()=>{
    let alive=true;controller.current=new AbortController();setPhase('loading');
    loadConfigurations('diary').then(value=>{if(!alive)return;setSettings(value);const diary=value.purposes.find(p=>p.purpose==='diary');if(!diary)throw new Error();if(!isPurposeActive(diary)){keys.current.clear();pendingSource.current=null;setUnlockedEntry(null);setPending(null);setPhase('ready');return;}const current=diary.configurations.find(c=>c.id===diary.active_configuration_id);if(current){setPending(current);setPhase('base');}else{
      const flag=`chatterloop.diary.intro.v1:${value.owner.entity_id}:${value.owner.user_id}`;
      let seen=false;try{seen=localStorage.getItem(flag)==='seen';}catch{/* storage unavailable */}
      setPhase(!diary.configurations.length&&!seen?'intro':'ready');
    }}).catch(()=>{if(alive){setError('Could not load Diary protection. Please retry.');setPhase('error');}});
    const lock=()=>{cancelSave();generation.current++;controller.current.abort();keys.current.clear();historical.current.clear();pendingSource.current=null;setUnlockedEntry(null);setPhrase('');setPending(null);setBusy(false);running.current=false;setPhase('loading');setRetry(v=>v+1);};
    window.addEventListener('pagehide',lock);
    return()=>{pendingSave.current?.(null);pendingSave.current=null;alive=false;generation.current++;controller.current.abort();keys.current.clear();historical.current.clear();pendingSource.current=null;window.removeEventListener('pagehide',lock);};
  },[retry]);
  const markIntro=()=>{if(settings)try{localStorage.setItem(`chatterloop.diary.intro.v1:${settings.owner.entity_id}:${settings.owner.user_id}`,'seen');}catch{/* optional preference */}};
  const cancelPrompt=()=>{if(phase==='base'){exit(true);return;}if(phase==='intro'){markIntro();setPhase('ready');return;}if(phase==='setup'){markIntro();setRetry(v=>v+1);return;}cancelSave();generation.current++;controller.current.abort();controller.current=new AbortController();pendingSource.current=null;setPending(null);setPhrase('');setBusy(false);running.current=false;};
  const modal=useModalFocus<HTMLDivElement>(phase==='intro'||phase==='setup',cancelPrompt);
  const unlock=async(event:React.FormEvent)=>{
    event.preventDefault();if(!pending||!settings||running.current||!encryptionEnabled)return;running.current=true;setBusy(true);setError('');const ticket=generation.current;const prompt=promptGeneration.current;const selected=pending;const base=phase==='base';const source=pendingSource.current;
    try {if(!source&&!configurationSupportsPurpose(selected,'diary'))throw new Error('This passphrase cannot protect Diary entries.');const key=await deriveKey(phrase,selected,selected.salt,controller.current.signal);await verifyConfiguration(selected,settings.owner,key);if(controller.current.signal.aborted||ticket!==generation.current||prompt!==promptGeneration.current)return;
      let opened:ProtectedEntry|null=null;
      if(source){
        try {opened={...await decryptEntry(source,settings.owner,key),link_preview:null};}
        catch {opened={...source,title:'',content:'',link_preview:null,_locked:'invalid',_lockError:'This encrypted entry could not be opened. Its protected data may be invalid.'};}
      }
      if(controller.current.signal.aborted||ticket!==generation.current||prompt!==promptGeneration.current)return;
      historical.current.set(selected.id,selected);keys.current.set(selected.id,key);pendingSave.current?.(key);pendingSave.current=null;setConfirmingSave(false);if(opened)setUnlockedEntry(opened);pendingSource.current=null;setPending(null);setPhrase('');setPhase('ready');}
    catch {if(controller.current.signal.aborted||ticket!==generation.current||prompt!==promptGeneration.current)return;setPhrase('');setError(base?'Could not unlock your Diary. Check your passphrase and try again.':confirmingSave?'Could not confirm the active passphrase. Please try again.':'Could not unlock this entry. Check its original passphrase and try again.');}
    finally{if(ticket===generation.current&&prompt===promptGeneration.current){running.current=false;if(!controller.current.signal.aborted)setBusy(false);}}
  };
  const read=async(entry:IEntry):Promise<ProtectedEntry>=>{
    if(!entry.is_encrypted)return entry;
    const ticket=generation.current;
    try {const pair=entryEnvelopes(entry);const id=pair.title.configuration_id;if(!encryptionEnabled){keys.current.clear();return{...entry,title:'',content:'',link_preview:null,_locked:id,_lockError:'Diary protection is temporarily unavailable.'};}const key=keys.current.get(id);if(!key)return{...entry,title:'',content:'',link_preview:null,_locked:id};
      const opened=await decryptEntry(entry,settings!.owner,key);if(ticket!==generation.current||controller.current.signal.aborted)throw new Error();return{...opened,link_preview:null};
    }catch{return{...entry,title:'',content:'',link_preview:null,_locked:'invalid',_lockError:'This encrypted entry could not be opened. Its protected data may be invalid.'};}
  };
  const save=async(entry:INewEntry):Promise<INewEntry|null>=>{
    if(!settings||controller.current.signal.aborted)throw new Error('Diary locked. Reopen it to continue.');
    if(!entry.is_encrypted)return{...entry,is_encrypted:false};
    if(!encryptionEnabled)throw new Error('Diary encryption is temporarily unavailable.');
    if(!active)throw new Error('Activate a passphrase in Settings before encrypting an entry.');
    if(settings.consumer_capabilities?.diary?.format_version!==1)throw new Error('Diary encryption needs a server update. Your entry has not been saved.');
    if(!keys.current.has(active.id))throw new Error('Unlock your active passphrase before saving.');
    const ticket=generation.current;const prompt=promptGeneration.current;
    const key=await new Promise<CryptoKey|null>(resolve=>{pendingSave.current=resolve;pendingSource.current=null;setConfirmingSave(true);setError('');setPhrase('');setPending(active);});
    if(!key)return null;
    if(ticket!==generation.current||prompt!==promptGeneration.current||controller.current.signal.aborted)throw new Error('Diary locked. Reopen it to continue.');
    const encrypted=await encryptEntry(entry,settings.owner,active.id,key);
    if(ticket!==generation.current||prompt!==promptGeneration.current||controller.current.signal.aborted)throw new Error('Diary locked. Reopen it to continue.');
    return{...entry,...encrypted};
  };
  const requestUnlock=async(id:string,source:IEntry)=>{
    if(!encryptionEnabled||!settings||controller.current.signal.aborted){keys.current.clear();return;}
    if(phase!=='ready'||new URLSearchParams(currentLocation.current.search).get('entry_id')!==source.id)return;
    cancelSave();const ticket=generation.current;const lookup=++promptGeneration.current;controller.current.abort();controller.current=new AbortController();pendingSource.current=null;setPending(null);setBusy(false);running.current=false;setError('');setPhrase('');
    try {
      if(entryEnvelopes(source).title.configuration_id!==id)throw new Error();
      const config=group?.configurations.find(c=>c.id===id) ?? historical.current.get(id) ?? await loadConfiguration(id,'diary',settings.owner);
      if(controller.current.signal.aborted||ticket!==generation.current||lookup!==promptGeneration.current)return;
      historical.current.set(id,config);pendingSource.current=source;setPending(config);
    }catch(error){
      if(controller.current.signal.aborted||ticket!==generation.current||lookup!==promptGeneration.current)return;
      if((error as {response?:{data?:{code?:string}}})?.response?.data?.code==='purpose_inactive'){
        cancelSave();generation.current++;keys.current.clear();historical.current.clear();pendingSource.current=null;setUnlockedEntry(null);setPending(null);setPhrase('');
        setSettings(previous=>previous?{...previous,purposes:previous.purposes.map(item=>item.purpose==='diary'?{...item,is_active:false}:item)}:previous);
        setError('Diary protection is temporarily unavailable.');
      }else setError('The original passphrase configuration is unavailable.');
    }
  };
  if(phase==='loading')return <div className="writing-empty" role="status">Loading Diary protection…</div>;
  if(phase==='error')return <div className="writing-error" role="alert">{error}<button onClick={()=>setRetry(v=>v+1)}>Retry</button><button onClick={()=>exit()}>Back to profile</button></div>;
  if(phase==='intro'||phase==='setup')return <div ref={modal} className="passphrase-overlay"><div className="passphrase-dialog" role="dialog" aria-modal="true" aria-label="Protect your Diary">{phase==='setup'?<><Passphrases/><div className="passphrase-actions"><button onClick={()=>{markIntro();setRetry(v=>v+1);}}>Return to Diary</button></div></>:<><Lock size={25}/><h2>Protect your Diary</h2><p>Add a passphrase to encrypt the titles and writing in new entries. Only you can unlock them.</p><p>Attachments, tags, moods, dates and other metadata are not encrypted. There is no passphrase recovery.</p><div className="passphrase-actions"><button onClick={()=>{markIntro();setPhase('ready');}}>Not now</button><button className="passphrase-primary" onClick={()=>{markIntro();setPhase('setup');}}>Set up passphrase</button></div></>}</div></div>;
  return <Context.Provider key={encryptionEnabled?'enabled':'disabled'} value={{active,encryptionEnabled,unlockedEntry,read,save,unlock:requestUnlock}}>{phase==='ready'&&children}{phase==='ready'&&error&&!pending&&<div className="writing-error" role="alert">{error}</div>}{pending&&encryptionEnabled&&<PassphraseUnlockDialog title={phase==='base'?'Unlock your Diary':confirmingSave?'Confirm entry encryption':'Unlock older entries'} description={phase==='base'?'Enter your active passphrase to open this visit.':confirmingSave?'Confirm your active passphrase to encrypt this entry’s title and writing before saving.':'Entry needs a different or older key to unlock. This does not change your active passphrase.'} name={pending.name} phrase={phrase} busy={busy} error={error} submitLabel={confirmingSave?'Encrypt and save':'Unlock'} onPhraseChange={value=>{setPhrase(value);setError('');}} onSubmit={event=>void unlock(event)} onCancel={cancelPrompt}/>}</Context.Provider>;
}
