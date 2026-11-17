const {test}=require('node:test');const assert=require('node:assert/strict');
const {load,state,reset,React,render,screen,act,cleanup}=require('./realm-management-fixture.cjs');
const helpers=load('app/widgets/invites/invites.ts',{'@/reusables/routing/communityPaths':{communityProfilePath:()=>'/club'}});
const Invite=load('app/widgets/invites/InvitePeople.tsx',{'@/reusables/hooks/useRoleDefinitions':{useRoleDefinitions:()=>({roles:[],loading:false})},'../members/RoleSelect':{default:()=>null},'./invites':helpers,'@/reusables/vars/roles':load('reusables/vars/roles.ts'),'@/reusables/design':{Avatar:()=>null,Icon:()=>null,SegTabs:()=>null,Btn:({children,...props})=>React.createElement('button',{onClick:props.onClick,type:props.type},children)}}).default;
test('inviters see their awaiting-approval invitations and late results cannot cross identities',async()=>{
 reset(); const view=render(React.createElement(Invite,{realmId:'club',realmType:'community',realmName:'Club'}));const original=state.calls.find(c=>c.method==='GetRealmInviteRequest');
 state.actor='page';view.rerender(React.createElement(Invite,{realmId:'club',realmType:'community',realmName:'Club'}));
 await act(async()=>original.resolve({result:[{id:'i',realm_id:'club',kind:'invite',status:'for_approval',target_email:'old@secret.test'}]}));assert.equal(screen.queryByText('old@secret.test'),null);cleanup();
});
