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
