const {test,afterEach}=require('node:test');
const assert=require('node:assert/strict');
const f=require('./realm-management-fixture.cjs');
afterEach(()=>{f.cleanup();f.reset();});
test('recovery uses an authorized actor and removes restored row without switching identity',async()=>{
 const calls=[];
 const row={realm_id:'r',name:'Hidden group',kind:'group',actors:[{entity_id:'page',name:'My page'}],blocked_by_parent:false};
 const api={listDeactivatedRealms:async()=>({items:calls.length?[]:[row],next_cursor:null}),reactivateRealm:async(...args)=>calls.push(args)};
 const Component=f.load('app/tabs/settings/section/DeactivatedRealms.tsx',{'@/reusables/hooks/realmLifecycleRequests':api}).default;
 assert.equal(typeof Component,'function'); f.render(f.React.createElement(Component));
 await f.screen.findByText('Hidden group');
 await f.act(async()=>f.fireEvent.click(f.screen.getByRole('button',{name:'Reactivate'})));
 await f.waitFor(()=>assert.equal(calls.length,1));
 assert.deepEqual(calls[0],['r','page']);
 await f.waitFor(()=>assert.equal(f.screen.queryByText('Hidden group'),null));
 assert.equal(f.state.actor,'owner');
});
