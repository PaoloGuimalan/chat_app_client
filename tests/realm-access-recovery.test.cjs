const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load() {
  const file = path.join(__dirname, '../src/reusables/hooks/realmAccessRecovery.ts');
  assert.ok(fs.existsSync(file), 'realm recovery coordinator is missing');
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,
    {module,exports:module.exports,Date,Promise});
  return module.exports;
}
const body = {code:'REALM_ACCESS_REVOKED',message:'Your access to Garden Club was revoked.'};
test('only explicit revocations trigger recovery; Django and Node share the same message', () => {
  const {revokedRealmMessage}=load();
  assert.equal(revokedRealmMessage(body),body.message);
  assert.equal(revokedRealmMessage({detail:'REALM_ACCESS_REVOKED: '+body.message}),body.message);
  assert.equal(revokedRealmMessage({message:'Forbidden'}),null);
  assert.equal(revokedRealmMessage({code:'AUTHORITY_CHECK_UNAVAILABLE'}),null);
});
test('concurrent HTTP/SSE denials use one existing switch-back call and ignore stale denials', async () => {
  const {createRealmAccessRecovery}=load();
  let token='realm-token',calls=0,finish;
  const coordinator=createRealmAccessRecovery({readToken:()=>token,switchBack:async (expected,message)=>{
    calls++;assert.equal(expected,'realm-token');assert.equal(message,body.message);
    await new Promise(resolve=>finish=resolve);token='personal-token';return true;
  }});
  const a=coordinator(body,'realm-token');const b=coordinator(body,'realm-token');
  await Promise.resolve();assert.equal(calls,1);finish();
  assert.equal(await a,true);assert.equal(await b,true);
  assert.equal(await coordinator(body,'realm-token'),true);assert.equal(calls,1);
  token=null;assert.equal(await coordinator(body,'realm-token'),true);assert.equal(calls,1);
});
test('failed switch-back can retry and ordinary permission denials never switch', async () => {
  const {createRealmAccessRecovery}=load();let calls=0;
  const recover=createRealmAccessRecovery({readToken:()=> 'token',switchBack:async()=>{calls++;return calls>1;}});
  assert.equal(await recover({message:'Forbidden'},'token'),false);
  assert.equal(await recover(body,'token'),false);
  assert.equal(await recover(body,'token'),true);assert.equal(calls,2);
});
test('reload notice belongs to the restored personal identity, expires and is consumed once',()=>{
  const {saveRealmRevocationNotice,consumeRealmRevocationNotice}=load();
  const values=new Map();const storage={setItem:(key,value)=>values.set(key,value),getItem:key=>values.get(key),removeItem:key=>values.delete(key)};
  saveRealmRevocationNotice(storage,'personal',body.message,1000);
  assert.equal(consumeRealmRevocationNotice(storage,'other',2000),null);
  assert.equal(consumeRealmRevocationNotice(storage,'personal',2000),body.message);
  assert.equal(consumeRealmRevocationNotice(storage,'personal',2000),null);
  saveRealmRevocationNotice(storage,'personal',body.message,1000);
  assert.equal(consumeRealmRevocationNotice(storage,'personal',400000),null);
});

function switchBackFixture({ delayed = false } = {}) {
  let token='realm-token', complete;
  const locations=[], notices=new Map(), calls=[];
  const module={exports:{}};
  const source=fs.readFileSync(path.join(__dirname,'../src/reusables/hooks/requests.ts'),'utf8');
  const block=source.slice(source.indexOf('const SwitchBackToSelfRequest ='),source.indexOf('export interface SwitchablePage'));
  const result={data:{status:true,result:{authtoken:'personal-token',personal_entity_id:'personal'}}};
  vm.runInNewContext(ts.transpileModule(block+'\nexports.switchBack=SwitchBackToSelfRequest;', {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{
    exports:module.exports, localStorage:{getItem:()=>token,setItem:(key,value)=>token=value},
    window:{sessionStorage:{setItem:(key,value)=>notices.set(key,value)},location:{replace:path=>locations.push(path),reload:()=>locations.push('reload')}},
    Axios:{post:async (...args)=>{calls.push(args);return delayed ? new Promise(resolve=>complete=()=>resolve(result)) : result;}},
    envs:{USER_SERVICE_API:'https://fixture.test/us'},jwt_decode:()=>({username:'paolo'}),
    saveRealmRevocationNotice:load().saveRealmRevocationNotice,pushResponseAlert(){},pushErrorAlert(){},
  });
  return {run: recovery=>module.exports.switchBack(()=>{},[],recovery), locations,notices,calls,
    token:()=>token,setToken:value=>token=value,complete:()=>complete()};
}
test('automatic recovery uses the existing endpoint, saves the notice, and replaces with the personal profile', async()=>{
  const f=switchBackFixture();
  assert.equal(await f.run({expectedToken:'realm-token',message:body.message}),true);
  assert.equal(f.calls[0][0],'https://fixture.test/us/api/user/entity/switch-back');
  assert.equal(f.calls[0][2].headers['x-access-token'],'realm-token');
  assert.equal(f.token(),'personal-token');assert.deepEqual(f.locations,['/paolo']);
  assert.equal(JSON.parse([...f.notices.values()][0]).content,body.message);
  const manual=switchBackFixture();await manual.run();assert.deepEqual(manual.locations,['reload']);
});
test('late switch-back response cannot overwrite a manual switch or logout',async()=>{
  for (const changed of ['other-page',null]) {
    const f=switchBackFixture({delayed:true});
    const request=f.run({expectedToken:'realm-token',message:body.message});
    f.setToken(changed);f.complete();assert.equal(await request,false);
    assert.equal(f.token(),changed);assert.equal(f.locations.length,0);assert.equal(f.notices.size,0);
  }
});
