const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');

function api() {
  const exported={};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/reusables/cache/entityProfileCache.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,
    {exports:exported,Blob,AbortController,setTimeout,clearTimeout,Date,require:()=>({entityProfileStore:{}})});
  return exported;
}
const image=()=>new Blob(['image-bytes'],{type:'image/png'});
const person={entityId:'person-entity',url:'https://media.example/person.png'};
const page={entityId:'page-entity',url:'https://media.example/page.png'};
function fixture(fetcher=async()=>image()) {
  const data=new Map();let token='session-a',fetches=0;
  const store={get:async id=>data.get(id),put:async record=>{data.set(record.entityId,record);},remove:async id=>{data.delete(id);}};
  const options={store,fetchBlob:async(...args)=>{fetches++;return fetcher(...args);},getToken:()=>token,now:()=>100000};
  const {createEntityProfileCache}=api();
  return {cache:createEntityProfileCache(options),reload:()=>createEntityProfileCache(options),data,store,setToken:value=>{token=value;},fetches:()=>fetches};
}

test('selects the authenticated current entity and its profile URL',()=>{
  const {activeEntityProfile}=api();
  const auth={auth:true,user:{entity_id:'person',profile:'/person.jpg'},active_entity_context:{id:'person',is_switched:false,profile:'/person.jpg'}};
  assert.deepEqual(JSON.parse(JSON.stringify(activeEntityProfile(auth))),{entityId:'person',url:'/person.jpg'});
  auth.active_entity_context={id:'page',is_switched:true,profile:'/page.jpg'};
  assert.deepEqual(JSON.parse(JSON.stringify(activeEntityProfile(auth))),{entityId:'page',url:'/page.jpg'});
  auth.active_entity_context.profile='N/A';assert.equal(activeEntityProfile(auth).url,null);
  auth.auth=false;assert.equal(activeEntityProfile(auth),null);
});

test('active entity ID and profile stay paired without relying on personal fields or switch flags',()=>{
  const {activeEntityProfile}=api();
  const auth={auth:true,user:{entity_id:'personal-entity',profile:'none'},active_entity_context:{id:'switched-entity',profile:'/switched.jpg'}};
  assert.deepEqual(JSON.parse(JSON.stringify(activeEntityProfile(auth))),{entityId:'switched-entity',url:'/switched.jpg'});
  auth.active_entity_context.is_switched=false;
  assert.equal(activeEntityProfile(auth).url,'/switched.jpg');
  auth.active_entity_context.profile=null;
  auth.user.profile='/personal.jpg';
  assert.equal(activeEntityProfile(auth).url,null,'a missing active avatar must not use the personal photo');
  delete auth.active_entity_context;
  assert.equal(activeEntityProfile(auth),null,'wait for validated active context instead of guessing from user.entity_id');
});
test('persists both URL and Blob under the entity ID',async()=>{
  const f=fixture();await f.cache.sync(person,'session-a');
  const record=f.data.get(person.entityId);
  assert.ok(record.blob instanceof Blob);assert.equal(record.url,person.url);assert.equal(record.updatedAt,100000);
  assert.equal(f.fetches(),1);
});
test('a new page load reuses matching URL and valid Blob regardless of cache age',async()=>{
  const f=fixture();f.data.set(person.entityId,{...person,blob:image(),updatedAt:0});
  await f.reload().sync(person,'session-a');assert.equal(f.fetches(),0);
  await f.reload().sync(person,'session-a');assert.equal(f.fetches(),0);
});
test('changed URL replaces the Blob; missing or invalid Blob downloads again',async()=>{
  for(const blob of [undefined,new Blob([],{type:'image/png'}),new Blob(['html'],{type:'text/html'})]) {
    const f=fixture();f.data.set(person.entityId,{...person,blob});await f.cache.sync(person,'session-a');assert.equal(f.fetches(),1);assert.ok(f.data.get(person.entityId).blob.size>0);
  }
  const f=fixture();f.data.set(person.entityId,{...person,url:'/old.jpg',blob:image()});await f.cache.sync(person,'session-a');
  assert.equal(f.data.get(person.entityId).url,person.url);assert.equal(f.fetches(),1);
});
test('entity records remain separate across authenticated page loads',async()=>{
  const f=fixture();await f.cache.sync(person,'session-a');await f.reload().sync(page,'session-a');
  assert.equal(f.data.get(person.entityId).url,person.url);assert.equal(f.data.get(page.entityId).url,page.url);
});
test('missing avatar removes that entity record on next load without fetching',async()=>{
  const f=fixture();await f.cache.sync(person,'session-a');await f.reload().sync({...person,url:null},'session-a');
  assert.equal(f.data.has(person.entityId),false);assert.equal(f.fetches(),1);
});
test('unauthenticated loads skip cache work and late downloads cannot write after token change',async()=>{
  let resolve;const f=fixture(()=>new Promise(r=>{resolve=r;}));
  await f.cache.sync(null,null);await f.cache.sync(person,null);assert.equal(f.fetches(),0);
  const pending=f.cache.sync(person,'session-a');await new Promise(setImmediate);
  f.setToken('other-session');resolve(image());await pending;assert.equal(f.data.size,0);
});
test('duplicate initial checks coalesce; failed reads/fetches never reject authentication work',async()=>{
  const f=fixture();await Promise.all([f.cache.sync(person,'session-a'),f.cache.sync(person,'session-a')]);assert.equal(f.fetches(),1);
  const failed=fixture(async()=>{throw Error('CORS denied');});await failed.cache.sync(person,'session-a');assert.equal(failed.data.size,0);
  const denied=fixture();denied.store.get=async()=>{throw Error('IndexedDB denied');};await denied.cache.sync(person,'session-a');assert.equal(denied.fetches(),0);
});
test('initial AuthCheck calls the cache only after authenticated entity data is resolved',async()=>{
  const source=fs.readFileSync('src/reusables/hooks/requests.ts','utf8');
  const ast=ts.createSourceFile('requests.ts',source,ts.ScriptTarget.Latest,true);
  const extract=name=>ast.statements.find(node=>ts.isVariableStatement(node)&&node.declarationList.declarations.some(d=>d.name.getText(ast)===name)).getText(ast);
  const code=ts.transpileModule(extract('buildActiveEntityFields')+'\n'+extract('AuthCheck')+'\nexports.check=AuthCheck;',{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  for(const authenticated of [true,false]) {
    const calls=[],exports={},result={usertoken:'user',active_entity:{id:'page',type:'realm',profile:'/page.jpg'},allowed_modules:[],personal_entity_id:'person'};
    vm.runInNewContext(code,{exports,console,localStorage:{getItem:()=> 'token'},envs:{CHATTERLOOP_API:'/api'},Axios:{get:async()=>({data:{status:authenticated,result}})},authenticationstate:{},jwt_decode:()=>({fullname:{},profile:'/person.jpg',entity_id:'person'}),setTimeout:cb=>cb(),SET_AUTHENTICATION:'auth',activeEntityProfile:api().activeEntityProfile,entityProfileCache:{sync:(...args)=>{calls.push(args);return Promise.resolve();}}});
    exports.check(()=>{});await new Promise(setImmediate);
    assert.equal(calls.length,authenticated?1:0);
    if(authenticated) assert.deepEqual(JSON.parse(JSON.stringify(calls[0])),[{entityId:'page',url:'/page.jpg'},'token']);
  }
});

test('real AuthCheck and selector cache personal, switched, then switch-back profiles under their current entity IDs',async()=>{
  const source=fs.readFileSync('src/reusables/hooks/requests.ts','utf8');
  const ast=ts.createSourceFile('requests.ts',source,ts.ScriptTarget.Latest,true);
  const extract=name=>ast.statements.find(node=>ts.isVariableStatement(node)&&node.declarationList.declarations.some(d=>d.name.getText(ast)===name)).getText(ast);
  const code=ts.transpileModule(extract('buildActiveEntityFields')+'\n'+extract('AuthCheck')+'\nexports.check=AuthCheck;',{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  const fetched=[],f=fixture(async target=>{fetched.push(target.url);return image();});
  const selector=api().activeEntityProfile;
  for(const active of [{id:'personal-entity',type:'user',profile:'/personal.jpg'},{id:'page-entity',type:'realm',profile:'/page.jpg'},{id:'personal-entity',type:'user',profile:'/personal.jpg'}]) {
    const token=`token-${active.id}`,pending=[],exports={};f.setToken(token);
    const result={usertoken:'user',active_entity:active,allowed_modules:[],personal_entity_id:'personal-entity'};
    const cache=f.reload();
    vm.runInNewContext(code,{exports,console,localStorage:{getItem:()=>token},envs:{CHATTERLOOP_API:'/api'},Axios:{get:async()=>({data:{status:true,result}})},authenticationstate:{},jwt_decode:()=>({fullname:{},entity_id:'personal-entity',profile:'none'}),setTimeout:cb=>cb(),SET_AUTHENTICATION:'auth',activeEntityProfile:selector,entityProfileCache:{sync:(...args)=>{const job=cache.sync(...args);pending.push(job);return job;}}});
    exports.check(()=>{});await new Promise(setImmediate);await Promise.all(pending);
    const cached=f.data.get(active.id);assert.ok(cached?.blob instanceof Blob);assert.equal(cached.url,active.profile);
  }
  assert.deepEqual(fetched,['/personal.jpg','/page.jpg']);
  assert.deepEqual([...f.data.keys()],['personal-entity','page-entity']);
});

test('jwtchecker starts realm caching immediately before delayed authentication state hydration',async()=>{
  const source=fs.readFileSync('src/reusables/hooks/requests.ts','utf8');
  const ast=ts.createSourceFile('requests.ts',source,ts.ScriptTarget.Latest,true);
  const extract=name=>ast.statements.find(node=>ts.isVariableStatement(node)&&node.declarationList.declarations.some(d=>d.name.getText(ast)===name)).getText(ast);
  const code=ts.transpileModule(extract('buildActiveEntityFields')+'\n'+extract('AuthCheck')+'\nexports.check=AuthCheck;',{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  const timers=[],calls=[],exports={};let dispatches=0;
  const result={usertoken:'personal-user-payload',active_entity:{id:'current-realm-entity',type:'realm',profile:'/realm.jpg'},allowed_modules:[],personal_entity_id:'personal-entity'};
  vm.runInNewContext(code,{exports,console,localStorage:{getItem:()=> 'realm-session'},envs:{CHATTERLOOP_API:'/api'},Axios:{get:async()=>({data:{status:true,result}})},authenticationstate:{},jwt_decode:()=>({fullname:{},entity_id:'personal-entity',profile:'/personal.jpg'}),setTimeout:cb=>{timers.push(cb);},SET_AUTHENTICATION:'auth',activeEntityProfile:api().activeEntityProfile,entityProfileCache:{sync:(...args)=>{calls.push(args);return Promise.resolve();}}});
  exports.check(()=>dispatches++);await new Promise(setImmediate);
  assert.equal(dispatches,0,'authentication UI is still waiting for its existing timer');
  assert.equal(calls.length,1,'cache must start directly from the successful jwtchecker response');
  assert.deepEqual(JSON.parse(JSON.stringify(calls[0])),[{entityId:'current-realm-entity',url:'/realm.jpg'},'realm-session']);
  timers[0]();assert.equal(dispatches,1);assert.equal(calls.length,1,'do not start a second cache job on Redux hydration');
});
