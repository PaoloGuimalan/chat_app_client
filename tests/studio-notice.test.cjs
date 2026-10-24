const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');

test('Studio completion uses a one-time Home alert for the current acting entity',()=>{
  const values=new Map(),sessionStorage={getItem:key=>values.get(key)??null,removeItem:key=>values.delete(key)};
  const api={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/reusables/hooks/studio.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:api,window:{sessionStorage},Date,JSON});
  assert.equal(typeof api.consumeStudioMomentNotice,'function');
  const put=patch=>values.set('chatterloop:studio:moment-shared',JSON.stringify({version:1,entityId:'realm',destination:'webapp',createdAt:1000,...patch}));
  put();assert.equal(api.consumeStudioMomentNotice('realm',1100),'Your Moment is live for 24 hours.');assert.equal(api.consumeStudioMomentNotice('realm',1100),null);
  for(const patch of [{entityId:'person'},{destination:'studio'},{createdAt:-300000},{createdAt:1200},{version:2}]){put(patch);assert.equal(api.consumeStudioMomentNotice('realm',1100),null);}
  values.set('chatterloop:studio:moment-shared','broken JSON');assert.equal(api.consumeStudioMomentNotice('realm',1100),null);
});
