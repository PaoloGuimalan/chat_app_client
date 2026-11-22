const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const f = require('./realm-management-fixture.cjs');
afterEach(() => { f.cleanup(); f.reset(); });
const tabs = f.load('app/tabs/realms/manage/manageTabs.ts');
test('lifecycle delegates receive only their permitted management entry', () => {
  const realm = { type: 'server', capabilities: { can_deactivate_realm: true } };
  assert.equal(tabs.canManageRealm(realm), true);
  assert.deepEqual(Array.from(tabs.manageRealmTabs(realm), r => r.key), ['lifecycle']);
  assert.deepEqual(Array.from(tabs.manageRealmTabs({type:'page', capabilities:{can_reactivate_realm:true}}), r=>r.key), ['followers']);
});
test('current lifecycle data governs actions and typed confirmation prevents accidental deletion', async () => {
  const calls=[];
  const data={realm_id:'realm',name:'Example',kind:'server',child_count:2,owned_realm_blockers:[],owned_realm_blocker_count:0,
    capabilities:{can_deactivate_realm:true,can_delete_realm:true,can_reactivate_realm:true}};
  const api={ getRealmLifecycle:async()=>data, deleteRealm:async(...args)=>{calls.push(args);},deactivateRealm:async()=>{} };
  const Confirm=f.load('app/widgets/modals/ConfirmModal.tsx').default;
  const Component=f.load('app/tabs/realms/manage/section/RealmLifecycle.tsx',{
    '@/reusables/hooks/realmLifecycleRequests':api,
    '@/app/widgets/modals/ConfirmModal':{__esModule:true,default:Confirm},
  }).default;
  assert.equal(typeof Component,'function');
  f.render(f.React.createElement(Component,{realm:{id:'realm'}}));
  await f.screen.findByRole('button',{name:'Deactivate realm'});
  assert.equal(f.screen.getAllByText(/2 channels/).length,2);
  f.fireEvent.click(f.screen.getByText('Delete realm'));
  assert.equal(f.screen.getByText('Permanently delete').disabled,true);
  f.fireEvent.change(f.screen.getByLabelText('Enter Example to confirm'),{target:{value:'Example'}});
  f.fireEvent.click(f.screen.getByText('Permanently delete'));
  await f.waitFor(()=>assert.equal(calls.length,1));
  assert.deepEqual(calls[0],['realm','Example']);
  await f.waitFor(()=>assert.equal(f.state.notices.length,1));
});
