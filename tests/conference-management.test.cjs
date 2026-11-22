const {test,afterEach}=require('node:test');
const assert=require('node:assert/strict');
const f=require('./realm-management-fixture.cjs');
afterEach(()=>{f.cleanup();f.reset();});
test('conference manager opens in place and closing it preserves media',async()=>{
 const requests={GetProfileInfo:async(params,query)=>{assert.equal(params.userID,'conference');assert.equal(query?.type,'manage');return {data:{data:{type:'conference',capabilities:{can_deactivate_realm:true}}}};}};
 const Component=f.load('app/conference/ConferenceManagement.tsx',{
  '@/reusables/hooks/requests':requests,
  '@/app/tabs/realms/manage/manageTabs':f.load('app/tabs/realms/manage/manageTabs.ts'),
  '@/app/tabs/realms/manage/ManageRealmModal':{__esModule:true,default:({onClose})=>f.React.createElement('button',{onClick:onClose},'Close settings')},
 }).default;
 assert.equal(typeof Component,'function');
 let unmounted=0;function Media(){f.React.useEffect(()=>()=>unmounted++,[]);return f.React.createElement('video');}
 f.render(f.React.createElement('div',null,f.React.createElement(Media),f.React.createElement(Component,{realmId:'conference'})));
 await f.screen.findByRole('button',{name:'Manage realm'});
 f.fireEvent.click(f.screen.getByRole('button',{name:'Manage realm'}));
 f.fireEvent.click(f.screen.getByText('Close settings'));
 assert.equal(unmounted,0);assert.equal(document.querySelectorAll('video').length,1);
});
