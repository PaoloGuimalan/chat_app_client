import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { FiSettings } from 'react-icons/fi';
import { GetProfileInfo, ConversationInfoRequest } from '@/reusables/hooks/requests';
import { canManageRealm } from '@/app/tabs/realms/manage/manageTabs';
import ManageRealmModal from '@/app/tabs/realms/manage/ManageRealmModal';

/** Settings are a sibling overlay; the call stage and media remain mounted. */
export default function ConferenceManagement({realmId, onUnavailable}: {realmId: string; onUnavailable?: () => void}) {
  const actor = useSelector((s:{authentication:{user:{entity_id?:string};active_entity_context?:{id:string}}})=>s.authentication.active_entity_context?.id??s.authentication.user.entity_id);
  const token=localStorage.getItem('authtoken'); const scope=`${realmId}:${actor}:${token}`;
  const live=useRef(scope);live.current=scope;
  const unavailable=useRef(onUnavailable);unavailable.current=onUnavailable;
  const [allowed,setAllowed]=useState<string|null>(null),[opened,setOpened]=useState<string|null>(null);
  useEffect(()=>{
    let active=true,generation=0;
    const refresh=async(signal=false)=>{
      const ticket=++generation;
      try{
        const result=await GetProfileInfo({userID:realmId},{type:'manage'});
        if(!active||ticket!==generation||live.current!==scope||token!==localStorage.getItem('authtoken'))return;
        setAllowed(result?.data?.data&&canManageRealm(result.data.data)?scope:null);
      }catch(error){
        if(!active||ticket!==generation||live.current!==scope||token!==localStorage.getItem('authtoken'))return;
        setAllowed(null);setOpened(null);
        const status=(error as {status?:number;response?:{status?:number}})?.response?.status??(error as {status?:number})?.status;
        if(signal&&[403,404,410].includes(status??0)) {
          // A management denial is not a call denial. Use the existing
          // membership endpoint, which resolves IDs and preserves status.
          try { await ConversationInfoRequest({conversationID:realmId,type:'conference'}); }
          catch(callError) {
            const callStatus=(callError as {status?:number;response?:{status?:number}})?.response?.status??(callError as {status?:number})?.status;
            if(active&&ticket===generation&&live.current===scope&&token===localStorage.getItem('authtoken')&&[403,404,410].includes(callStatus??0))unavailable.current?.();
          }
        }
      }
    };
    void refresh();
    const changed=(event:Event)=>{
      const detail=(event as CustomEvent).detail;
      if(detail?.realm_id&&String(detail.realm_id)!==realmId)return;
      void refresh(detail?.event==='realm_lifecycle_changed');
    };
    document.addEventListener('community-changed',changed);
    return()=>{active=false;document.removeEventListener('community-changed',changed);};
  },[scope,realmId,token]);
  return <>{allowed===scope&&<button type="button" title="Manage realm" aria-label="Manage realm" className="btn_call_controls" onClick={()=>setOpened(scope)}><FiSettings/></button>}
    {allowed===scope&&opened===scope&&<ManageRealmModal realmId={realmId} onClose={()=>setOpened(null)}/>}</>;
}
