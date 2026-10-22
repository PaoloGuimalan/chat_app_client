const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
function load() {
  const exports = {};
  const file = require('node:path').join(__dirname, '../src/reusables/encryption/crypto.ts');
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  vm.runInNewContext(source, { exports, crypto:webcrypto, TextEncoder, TextDecoder, Uint8Array, btoa, atob });
  return exports;
}
const owner = {entity_id:'00000000-0000-4000-8000-000000000001',user_id:'00000000-0000-4000-8000-000000000002'};
const id = '00000000-0000-4000-8000-000000000003';
test('new phrases count Unicode code points, preserve whitespace and reject oversized UTF8', () => {
  const c = load();
  assert.throws(() => c.validateNewPassphrase('🙂'.repeat(14)));
  assert.doesNotThrow(() => c.validateNewPassphrase('🙂'.repeat(15)));
  assert.doesNotThrow(() => c.validateNewPassphrase(' '.repeat(15)));
  assert.throws(() => c.validateNewPassphrase('🙂'.repeat(257)));
});
test('unsupported or unbounded KDF metadata fails before derivation', () => {
  const c = load();
  assert.throws(() => c.validateProfile({...c.PROFILE,kdf_parameters:{...c.PROFILE.kdf_parameters,memory_kib:65537}}));
  assert.throws(() => c.validateProfile({...c.PROFILE,format_version:2}));
  assert.doesNotThrow(() => c.validateProfile(c.PROFILE));
});
test('verification roundtrip binds owner and ID and rejects wrong key', async () => {
  const c = load();
  const key = await webcrypto.subtle.importKey('raw', new Uint8Array(32), 'AES-GCM', false, ['encrypt','decrypt']);
  const created = await c.createVerification(owner, id, key);
  const config = {...c.PROFILE,...owner,id,purpose:'diary',salt:btoa('s'.repeat(16)),...created};
  const proof = await c.verifyConfiguration(config, owner, key);
  assert.equal(atob(proof).length,32);
  assert.equal(Buffer.from(await webcrypto.subtle.digest('SHA-256',Buffer.from(proof,'base64'))).toString('hex'),created.verification_digest);
  await assert.rejects(c.verifyConfiguration(config,{...owner,user_id:id},key));
  const wrong = await webcrypto.subtle.importKey('raw',new Uint8Array(32).fill(1),'AES-GCM',false,['decrypt']);
  await assert.rejects(c.verifyConfiguration(config,owner,wrong));
});

test('verification uses immutable origin while Diary authorization follows memberships', async () => {
  const c = load();
  const key = await webcrypto.subtle.importKey('raw',new Uint8Array(32),'AES-GCM',false,['encrypt','decrypt']);
  const created = await c.createVerification(owner,id,key,'notes');
  const config = {...c.PROFILE,...owner,id,purpose:'notes',verification_purpose:'notes',purposes:['diary','notes'],is_active:false,salt:btoa('s'.repeat(16)),...created};
  assert.equal(config.verification_aad,`["chatterloop.encryption.verification",1,"${id}","${owner.entity_id}","${owner.user_id}","notes"]`);
  assert.doesNotThrow(()=>c.validateConfiguration(config,owner));
  assert.equal(c.configurationSupportsPurpose(config,'diary'),true);
  assert.equal(c.configurationSupportsPurpose({...config,purposes:['notes']},'diary'),false);
  assert.equal(c.configurationSupportsPurpose({...config,purposes:undefined,purpose:'diary'},'diary'),true);
  const proof = await c.verifyConfiguration(config,owner,key);
  assert.equal(await c.verifyConfiguration({...config,purposes:['notes']},owner,key),proof);
  await assert.rejects(c.verifyConfiguration({...config,verification_purpose:'diary'},owner,key));
  assert.throws(()=>c.validateConfiguration({...config,purposes:'diary'},owner));
});

function loadApi(client) {
  const exports = {};
  const file = require('node:path').join(__dirname,'../src/reusables/encryption/api.ts');
  const source = ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  vm.runInNewContext(source,{exports,localStorage:{getItem:()=>null},require:(name)=>name==='./crypto'?load():name==='../hooks/requests'?{firstPartyClient:client}:{default:{USER_SERVICE_API:'https://test.invalid'}}});
  return exports;
}

async function settingsFixture() {
  const c = load();
  const key = await webcrypto.subtle.importKey('raw',new Uint8Array(32),'AES-GCM',false,['encrypt','decrypt']);
  const created = await c.createVerification(owner,id,key);
  const config = {...c.PROFILE,...owner,id,name:'Shared',purpose:'diary',verification_purpose:'diary',purposes:['diary','notes'],is_active:true,created_at:'2026-10-22T00:00:00Z',salt:btoa('s'.repeat(16)),...created};
  return {owner,supported_profile:c.PROFILE,purposes:['diary','notes'].map(purpose=>({purpose,label:purpose,configurations:[config],active_configuration_id:id,scope_version:'a'.repeat(64)}))};
}

test('settings accept generic verification origins and reject misplaced memberships', async () => {
  const settings = await settingsFixture();
  settings.purposes=settings.purposes.slice(1);
  const api = loadApi({get:async()=>({data:{status:true,result:settings}})});
  assert.equal((await api.loadConfigurations()).purposes[0].purpose,'notes');
  settings.purposes[0].configurations[0].purposes=['diary'];
  await assert.rejects(api.loadConfigurations(),/Invalid passphrase settings/);
});

test('successful configuration mutation reloads all groups with the server active state', async () => {
  const settings = await settingsFixture();
  const client = {post:async()=>({data:{status:true,result:settings.purposes[0]}}),get:async()=>({data:{status:true,result:settings}})};
  const result = await loadApi(client).changeConfiguration('activate',id,{purpose:'notes',expected_scope_version:'a'.repeat(64)});
  assert.equal(result.purposes.length,2);
  assert.equal(result.purposes[1].active_configuration_id,id);
});

test('unfiltered settings preserve and validate configurations with no selected uses', async () => {
  const settings=await settingsFixture();
  const config={...settings.purposes[0].configurations[0],purposes:[],is_active:false};
  settings.configurations=[config];settings.scope_version='b'.repeat(64);
  settings.purposes.forEach(group=>{group.configurations=[];group.active_configuration_id=null;});
  const api=loadApi({get:async()=>({data:{status:true,result:settings}})});
  assert.equal((await api.loadConfigurations()).configurations[0].id,id);
  assert.equal(load().configurationSupportsPurpose(config,'diary'),false);
  config.verification_aad='changed';
  await assert.rejects(api.loadConfigurations(),/Invalid passphrase configuration/);
});

test('historical lookup accepts removed membership and rejects wrong owner, ID and AAD',async()=>{
  const settings=await settingsFixture();
  let config={...settings.purposes[0].configurations[0],purposes:[],is_active:false};
  const calls=[];
  const api=loadApi({get:async(url,options)=>{calls.push({url,options});return{data:{status:true,result:{configuration:config}}};}});
  assert.equal((await api.loadConfiguration(id,'diary',owner)).id,id);
  assert.ok(calls[0].url.endsWith(`${id}/`));assert.equal(calls[0].options.params.purpose,'diary');
  for(const change of [{user_id:'foreign'},{id:'00000000-0000-4000-8000-000000000004'},{verification_aad:'wrong'},{format_version:2}]){
    const previous=config;config={...config,...change};
    await assert.rejects(api.loadConfiguration(id,'diary',owner));config=previous;
  }
});

test('uses mutation sends the exact proof payload and reloads unfiltered settings',async()=>{
  const settings=await settingsFixture();settings.scope_version='b'.repeat(64);settings.configurations=[];
  const calls=[];
  const api=loadApi({post:async(url,payload)=>{calls.push({url,payload});return{data:{status:true,result:settings}};},get:async(url,options)=>{assert.equal(options.params,undefined);return{data:{status:true,result:settings}};}});
  const payload={purposes:[],expected_scope_version:'b'.repeat(64),target_verification_proof:'proof'};
  await api.changeConfiguration('uses',id,payload);
  assert.ok(calls[0].url.endsWith(`${id}/uses/`));assert.equal(calls[0].payload,payload);
});

test('purpose-scoped configuration loading sends an explicit filter and rejects unrelated groups',async()=>{
  const settings=await settingsFixture();
  let requestOptions;
  const api=loadApi({get:async(url,options)=>{requestOptions=options;return{data:{status:true,result:settings}};}});
  settings.purposes=settings.purposes.slice(0,1);
  assert.equal((await api.loadConfigurations('diary')).purposes.length,1);
  assert.equal(requestOptions.params.purpose,'diary');
  settings.purposes[0].purpose='notes';
  await assert.rejects(api.loadConfigurations('diary'),/Invalid passphrase settings/);
});

test('purpose activation defaults on for legacy responses and disabled purposes retain historical configurations',async()=>{
  const settings=await settingsFixture();
  const api=loadApi({get:async()=>({data:{status:true,result:settings}})});
  assert.equal((await api.loadConfigurations()).purposes[0].is_active,true);
  settings.purposes[0].is_active=false;
  const result=await api.loadConfigurations();
  assert.equal(result.purposes[0].is_active,false);
  assert.equal(result.purposes[0].configurations[0].id,id);
  settings.purposes[0].is_active='false';
  await assert.rejects(api.loadConfigurations(),/Invalid passphrase settings/);
});
test('diary title and HTML body use distinct nonces, owner and field AAD, and matching entry binding', async () => {
  const c = load();
  const key = await webcrypto.subtle.importKey('raw',new Uint8Array(32),'AES-GCM',false,['encrypt','decrypt']);
  const encrypted = await c.encryptEntry({title:' exact 🙂 ',content:'<p>Private &amp; exact</p>'},owner,id,key);
  assert.notEqual(JSON.parse(encrypted.title).nonce,JSON.parse(encrypted.content).nonce);
  assert.equal(JSON.parse(encrypted.title).entry_binding,JSON.parse(encrypted.content).entry_binding);
  const opened = await c.decryptEntry(encrypted,owner,key);
  assert.equal(opened.title,' exact 🙂 '); assert.equal(opened.content,'<p>Private &amp; exact</p>');
  await assert.rejects(c.decryptEntry({...encrypted,title:encrypted.content,content:encrypted.title},owner,key));
  await assert.rejects(c.decryptEntry(encrypted,{...owner,entity_id:id},key));
  const second = await c.encryptEntry({title:'Two',content:'<p>Two</p>'},owner,id,key);
  await assert.rejects(c.decryptEntry({...encrypted,content:second.content},owner,key));
  const tampered = JSON.parse(encrypted.title); tampered.ciphertext = btoa('x'.repeat(16));
  await assert.rejects(c.decryptEntry({...encrypted,title:JSON.stringify(tampered)},owner,key));
});
test('Argon2id v19 and AES-GCM decrypt independent Python known-answer fixtures offline', async () => {
  const {argon2id}=require('hash-wasm'); const c=load();
  const raw=await argon2id({password:new TextEncoder().encode('violet lantern river 你好'),salt:Buffer.from('AAECAwQFBgcICQoLDA0ODw==','base64'),memorySize:65536,iterations:3,parallelism:1,hashLength:32,outputType:'binary'});
  assert.equal(Buffer.from(raw).toString('hex'),'5485f9dbf50c2bfb57a2054954e4498576759e490e476f877e160b1cf818d4a2');
  const key=await webcrypto.subtle.importKey('raw',raw,'AES-GCM',false,['decrypt']);
  const knownOwner={entity_id:'entity-vector',user_id:'user-vector'},configId='11111111-1111-4111-8111-111111111111';
  const config={...c.PROFILE,...knownOwner,id:configId,purpose:'diary',salt:'AAECAwQFBgcICQoLDA0ODw==',verification_aad:'["chatterloop.encryption.verification",1,"11111111-1111-4111-8111-111111111111","entity-vector","user-vector","diary"]',verification_nonce:'EBESExQVFhcYGRob',verification_ciphertext:'D3h/e9M1tO+oc+WaZll42I07hZ+lFGH89ZMaBIkM2TKzS1NBLer7h8wFDrxCnva1dQZ4YAHVtXGcQbESkFf6mv85dcDLkZjqPYzsbCJ73F4ebKhqk39jUIvvNU8JiZLQc05xr3CxEIJ619iamKKB0rhIgwjnwxm5+IM='};
  assert.equal(await c.verifyConfiguration(config,knownOwner,key),'ICEiIyQlJicoKSorLC0uLzAxMjM0NTY3ODk6Ozw9Pj8=');
  const shared={v:1,configuration_id:configId,entry_binding:'22222222-2222-4222-8222-222222222222'};
  const entry={title:JSON.stringify({...shared,nonce:'QEFCQ0RFRkdISUpL',ciphertext:'eNhUZUFnGxcKQMB7yKK9nEl79+sjV/83oxpaFCrNGZZHH69Mm+0='}),content:JSON.stringify({...shared,nonce:'TE1OT1BRUlNUVVZX',ciphertext:'lRJpCfnsjE3AuUjGG0bqM2tHcBuI3vxraNQKW7sJnRGvV0A/hZWQN1QKL/MIaOBDkvmjdw=='})};
  const opened=await c.decryptEntry(entry,knownOwner,key);assert.equal(opened.title,'A quiet afternoon 🌿');assert.equal(opened.content,'<p>Today I felt grateful. 你好</p>');
  raw.fill(0);
});
