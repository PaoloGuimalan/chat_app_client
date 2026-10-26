const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
const api={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'../src/reusables/routing/profilePaths.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:api});
const policy={paths:Array.from(api.DEFAULT_PROFILE_PATHS)};

test('guest profile roots use the existing public profile route without opening app routes', () => {
  assert.equal(api.publicProfilePath('/garden-club'), '/share/garden-club');
  assert.equal(api.publicProfilePath('/garden-club/'), '/share/garden-club');
  for (const route of ['/', '/communities', '/servers', '/settings', '/post/id', '/%2Fsettings', '/%ZZ']) {
    assert.equal(api.publicProfilePath(route), null, route);
  }
});

test('policy covers every static web route root',()=>{
  for(const file of ['src/App.tsx','src/app/main/Home.tsx']) {
    const source=fs.readFileSync(file,'utf8').replace(/\{\/\*[\s\S]*?\*\/\}/g,'');
    for(const match of source.matchAll(/path\s*=\s*["']\/([^/"'*:]+)/g)) {
      assert.ok(policy.paths.includes(match[1]),`missing reserved root ${match[1]}`);
    }
  }
});

test('web feedback matches backend exact normalized reservations',()=>{
  for(const root of policy.paths) assert.equal(api.profilePathError(root.toUpperCase()).code,'RESERVED_PATH');
  assert.equal(api.profilePathError(' ｓｔｕｄｉｏ ').code,'RESERVED_PATH');
  for(const name of ['studio-team','mystudio','moderator','system','']) assert.equal(api.profilePathError(name),null);
  for(const name of ['name/path','%73tudio','/studio','name\\path','studi\to','studi\no','studi\ro','.','..']) assert.equal(api.profilePathError(name)?.code,'INVALID_PROFILE_PATH');
});

test('web feedback uses the effective boot policy, including removals and normalized entries',()=>{
  assert.equal(typeof api.applyReservedProfilePaths, 'function');
  api.applyReservedProfilePaths([' ＬＡＵＮＣＨＰＡＤ ']);
  assert.equal(api.profilePathError('launchpad').code, 'RESERVED_PATH');
  assert.equal(api.profilePathError('studio'), null);
  api.applyReservedProfilePaths([]);
  assert.equal(api.profilePathError('launchpad'), null);
  api.applyReservedProfilePaths('invalid');
  assert.equal(api.profilePathError('studio'), null, 'malformed server data must not replace the last valid policy');
});

test('existing boot config loading updates profile feedback from the server Variable',async()=>{
  const exports={};
  const source=fs.readFileSync('src/reusables/vars/uploads.ts','utf8');
  const body={reserved_profile_paths:['from-database']};
  vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,
    localStorage:{getItem:()=>null,setItem:()=>{}},fetch:async()=>({ok:true,json:async()=>body}),
    require:name=>name.includes('profilePaths')?api:{default:{CHATTERLOOP_API:'/api'}}});
  await exports.loadMediaConfig();
  assert.equal(api.profilePathError('from-database').code,'RESERVED_PATH');
  assert.equal(api.profilePathError('studio'),null);
  api.applyReservedProfilePaths(policy.paths);
});

test('Unicode matching and policy subscriptions update an already mounted consumer',()=>{
  api.applyReservedProfilePaths(['Σ','STRAẞE']);
  for(const value of ['σ','ς','straße','STRASSE']) assert.equal(api.profilePathError(value)?.code,'RESERVED_PATH');
  assert.equal(typeof api.subscribeProfilePaths,'function');
  let changed=0;const unsubscribe=api.subscribeProfilePaths(()=>changed++);
  api.applyReservedProfilePaths(['changed']);assert.equal(changed,1);
  api.applyReservedProfilePaths(['CHANGED']);assert.equal(changed,1,'equivalent policies do not notify again');
  unsubscribe();api.applyReservedProfilePaths(policy.paths);assert.equal(changed,1);
});
