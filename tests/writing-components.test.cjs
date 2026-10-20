/* Actual React components and Quill, served entirely by local request fixtures. */
const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://local.test/' });
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'SVGElement', 'Element', 'Node', 'Text', 'MutationObserver', 'DOMParser', 'localStorage', 'sessionStorage', 'getComputedStyle', 'Range']) global[key] = dom.window[key];
window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
window.PointerEvent = class extends window.MouseEvent { constructor(type, init = {}) { super(type, init); this.pointerId = init.pointerId || 1; this.pointerType = init.pointerType || 'mouse'; } };
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.hasPointerCapture = () => true;
global.requestAnimationFrame = fn => setTimeout(fn, 0);
global.cancelAnimationFrame = clearTimeout;
global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
global.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
window.HTMLMediaElement.prototype.pause = function() {};
global.crypto = require('node:crypto').webcrypto;
document.execCommand = () => false;
document.createRange = (() => { const create = document.createRange.bind(document); return () => { const range = create(); range.getBoundingClientRect = () => ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }); range.getClientRects = () => []; return range; }; })();
window.confirm = () => true;
localStorage.setItem('authtoken', 'fixture-token');

const React = require('react');
const { render, screen, fireEvent, waitFor, cleanup, act } = require('@testing-library/react');
const { BrowserRouter, Link, MemoryRouter, Routes, Route } = require('react-router-dom');
const originalLoad = Module._load;
const root = path.join(__dirname, '../src');
const auth = { user: { entity_id: 'fixture-entity', username: 'owner', fullName: { firstName: 'Owner', lastName: 'Fixture' }, profile: 'none' }, active_entity_context: { id: 'fixture-entity', is_switched: false }, allowed_modules: ['module.notes.access', 'module.diary.access'] };
const sample = index => ({ id: `note-${index}`, entity_id: 'fixture-entity', title: `Note ${index}`, content: '<p>A local fixture</p>', attachments: [], version: 1, sort: 100 - index, created_at: '2026-10-15T00:00:00Z', updated_at: '2026-10-15T00:00:00Z' });
let notes = [sample(1), sample(2)], saves = [], reorders = [], moodPages = [], tagQueries = [], diaryWrites = [];
const api = {
  async list(page, search) { const filtered = notes.filter(note => `${note.title} ${note.content}`.toLowerCase().includes(search.toLowerCase())); return { count: filtered.length, next: page * 24 < filtered.length ? 'next' : null, results: structuredClone(filtered.slice((page - 1) * 24, page * 24)) }; },
  async get(id) { return structuredClone(notes.find(note => note.id === id)); },
  async save(value, previous) { saves.push(structuredClone(value)); const note = { ...sample(99), ...structuredClone(value), id: previous?.id || `created-${saves.length}`, version: (previous?.version || 0) + 1 }; notes = previous ? notes.map(item => item.id === note.id ? note : item) : [note, ...notes]; return note; },
  async reorder(id, before) { reorders.push({ id, before }); const item = notes.find(note => note.id === id); notes = notes.filter(note => note.id !== id); const index = before === null ? notes.length : notes.findIndex(note => note.id === before); notes.splice(index, 0, item); notes.forEach((note, index) => note.sort = notes.length - index); return { order: notes.map(({ id, sort }) => ({ id, sort })) }; },
  async remove(note) { notes = notes.filter(item => item.id !== note.id); },
};
const requests = {
  async GetUserEntriesRequest() { return { results: [{ id: 'design-entry', title: 'Just a quote of the day', content: '<p>Body stays in the entry reader</p>', entry_date: '2026-10-15', created_at: '2026-10-15T08:00:00Z', is_private: true, attachments: [], tag_objects: [{ id: 1, name: 'garden' }, { id: 2, name: 'bloom' }], mood: { id: 1, name: 'Hopeful', emoji: '🌟' } }], next: null }; },
  async GetMoodListRequest({ page }) { moodPages.push(page); return { results: Array.from({ length: 10 }, (_, i) => ({ id: (page - 1) * 10 + i + 1, name: `Mood ${(page - 1) * 10 + i + 1}`, emoji: '🙂' })), next: page < 2 ? 'next' : null }; },
  async GetTagsListRequest({ search }) { tagQueries.push(search); return { results: { is_new: Boolean(search), list: search ? [] : [{ id: 1, name: 'Life' }] }, next: null }; },
  firstPartyClient: { async post(url, payload) { diaryWrites.push({ url, payload }); return { data: { ...payload, id: 'entry-created', attachments: [], tag_objects: [] } }; } },
};
let encryptionSettings={owner:{entity_id:'fixture-entity',user_id:'fixture-user'},purposes:[{purpose:'diary',configurations:[{id:'inactive-placeholder',is_active:false}],active_configuration_id:null,scope_version:'fixture'}]};
let deriveOverride = async()=>{throw new Error('Wrong passphrase');};
let loadEncryptionOverride = async()=>encryptionSettings;
let changeEncryptionOverride = async()=>{throw new Error('No mutation fixture installed');};
Module._extensions['.ts'] = Module._extensions['.tsx'] = (module, filename) => {
  const result = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } });
  module._compile(result.outputText, filename);
};
Module._extensions['.css'] = () => {};
Module._extensions['.png'] = (module, filename) => { module.exports = filename; };
Module._load = function(request, parent, isMain) {
  if (request === '@/reusables/encryption/api') return {loadConfigurations:(...args)=>loadEncryptionOverride(...args),changeConfiguration:(...args)=>changeEncryptionOverride(...args),isStale:e=>e?.response?.data?.code==='stale_scope'};
  if (request === '@/reusables/encryption/derive') return {deriveKey:(...args)=>deriveOverride(...args)};
  if (request === 'react-redux') return { useSelector: selector => selector({ authentication: auth, screensizelistener: { W: 1200, H: 844 } }) };
  if (request === './notesApi') return { notesApi: () => api };
  if (request === '@/reusables/hooks/requests') return requests;
  if (request === '@/reusables/hooks/mediaUpload') return { uploadFiles: async () => [] };
  if (request === '@/reusables/hooks/env_configs') return { __esModule: true, default: { USER_SERVICE_API: 'https://fixture.invalid' } };
  if (request === '@/reusables/hooks/useLinkPreview') return { useLinkPreview: () => ({ status: 'idle' }) };
  if (request === '@/reusables/hooks/reusable') return { formatToDjangoDate: () => '2026-10-15', extractFirstUrlFromHtml: () => null };
  if (request === '@/reusables/hooks/useDragAndDrop') return { useDragAndDrop: () => ({ isDragging: false, dragHandlers: {} }) };
  if (request === '@/reusables/vars/uploads') return { limitFor: () => ({ maxBytes: 1e8, label: '100 MB' }) };
  if (request === '@/app/reusables/LinkPreviewCard' || request === './PendingAttachmentItem') return { __esModule: true, default: () => null };
  if (request.startsWith('@/')) request = path.join(root, request.slice(2));
  return originalLoad.call(this, request, parent, isMain);
};
const Notes = require('../src/app/tabs/profile/notes/Notes.tsx').default;
const NewEntry = require('../src/app/tabs/profile/diary/NewEntry.tsx').default;
const Diary = require('../src/app/tabs/profile/diary/Diary.tsx').default;
const EntryView = require('../src/app/tabs/profile/diary/EntryView.tsx').default;
const { useWritingHistory } = require('../src/app/tabs/profile/writing/writingHooks.ts');
const { writingHtmlForEditor, writingHtmlForStorage } = require('../src/app/tabs/profile/writing/writingHtml.ts');
const { WritingBody } = require('../src/app/tabs/profile/writing/Writing.tsx');

test('Diary has the same heading, strike, checklist, indent and divider tools as Notes', () => {
  mount(React.createElement(NewEntry, { reload() {} }), '/owner/diary?entry_id=new');
  const toolbar = document.querySelector('.ql-toolbar');
  assert.deepEqual([...toolbar.querySelectorAll('select.ql-header option')].map(option => option.value), ['1','2','3','4','5','6','']);
  for (const selector of ['.ql-strike', '.ql-list[value="check"]', '.ql-indent', '.ql-note-divider']) assert.ok(toolbar.querySelector(selector), selector);
});

test('legacy Diary checklists preserve their state and text in the common editor', async () => {
  let changed = '';
  mount(React.createElement(WritingBody, { value:'<div class="checklist"><div class="checklist-item"><input type="checkbox" checked disabled><label>&nbsp;Legacy task</label></div><div class="checklist-item"><input type="checkbox" disabled><label>&nbsp;Next task</label></div></div><hr>', onChange:html => { changed = html; } }));
  const editor = document.querySelector('.ql-editor');
  assert.ok(editor.querySelector('ul[data-checked="true"]'));
  assert.ok(editor.querySelector('ul[data-checked="false"]'));
  assert.ok(editor.textContent.includes('Legacy task'));
  assert.ok(editor.querySelector('.ql-divider'));
  await act(async () => { fireEvent.mouseDown(editor.querySelector('ul[data-checked="true"] li')); await new Promise(resolve => setTimeout(resolve,20)); });
  assert.ok(changed.includes('ql-list-unchecked'));
  assert.ok(!changed.includes('<input'));
});

test('Diary reader displays canonical and legacy checklist states without interactive controls', async () => {
  const previous = requests.GetEntryRequest;
  requests.GetEntryRequest = async () => ({ id:'formats', title:'Formatted entry', entry_date:'2026-10-16', is_private:true, mood:null, attachments:[], tag_objects:[], content:'<h2>A heading</h2><ul class="ql-list-checked"><li>Done</li></ul><div class="checklist"><div class="checklist-item"><input type="checkbox" disabled><label>&nbsp;Legacy task</label></div></div><div class="ql-divider"></div>' });
  try {
    mount(React.createElement(EntryView), '/owner/diary?entry_id=formats');
    await screen.findByText('Formatted entry');
    const reader = document.querySelector('.writing-body');
    assert.ok(reader.querySelector('h2'));
    assert.ok(reader.querySelector('ul[data-checked="true"]'));
    assert.ok(reader.querySelector('ul[data-checked="false"]'));
    assert.ok(reader.querySelector('.ql-divider'));
    assert.ok(reader.textContent.includes('Legacy task'));
    assert.equal(reader.querySelector('input'), null);
  } finally { requests.GetEntryRequest = previous; }
});

test('legacy quote and checklist spacing normalizes without losing text or indentation', () => {
  const html = writingHtmlForStorage('<blockquote style="margin:0 0 0 0.8ex;border-left:1px solid gray;padding-left:1ex">Keep this thought</blockquote><div class="checklist"><div class="checklist-item" style="padding-left:64px"><input type="checkbox" checked disabled><label>&nbsp;An indented task</label></div></div><ul><li>Parent</li><ul><li>Child</li></ul><li>Peer</li></ul>');
  const root = document.createElement('div'); root.innerHTML = html;
  assert.equal(root.querySelector('blockquote').textContent, 'Keep this thought');
  assert.equal(root.querySelector('blockquote').style.borderLeft, '');
  assert.equal(root.querySelector('ul.ql-list-checked li').className, 'ql-indent-2');
  assert.equal(root.querySelector('ul.ql-list-checked li').textContent, 'An indented task');
  assert.deepEqual([...root.querySelectorAll('ul:not(.ql-list-checked) li')].map(item => item.textContent), ['Parent','Child','Peer']);
  assert.equal([...root.querySelectorAll('li')].find(item => item.textContent === 'Child').className, 'ql-indent-1');
  root.innerHTML = writingHtmlForStorage('<div class="checklist"><div class="checklist-item ql-indent-1"><input type="checkbox">Legacy text without label</div></div><ol><li>Parent</li><ol><li>Child</li></ol><li>Peer</li></ol>');
  assert.equal(root.querySelector('ul li').textContent, 'Legacy text without label');
  assert.equal(root.querySelector('ul li').className, 'ql-indent-1');
  assert.equal(root.querySelector('input'), null);
  assert.deepEqual([...root.querySelectorAll('ol li')].map(item => [item.textContent, item.className]), [['Parent',''],['Child','ql-indent-1'],['Peer','']]);
});

test('Notes loads native checklist, strike, headings, nested lists and divider in the real editor', async () => {
  let changed = '';
  mount(React.createElement(WritingBody, { value: '<h1>Heading</h1><p><s>Strike</s></p><ul class="ql-list-checked"><li>Done</li></ul><ul><li>Parent<ul><li class="ql-indent-1">Child</li></ul></li></ul><div class="ql-divider"></div>', onChange: html => { changed = html; } }));
  const editor = document.querySelector('.ql-editor');
  assert.ok(editor.querySelector('h1'));
  assert.ok(editor.querySelector('s'));
  assert.ok(editor.querySelector('ul[data-checked="true"]'));
  assert.ok(editor.querySelector('.ql-indent-1'));
  assert.ok(editor.querySelector('.ql-divider'));
  await act(async () => { fireEvent.mouseDown(editor.querySelector('ul[data-checked] li')); await new Promise(resolve => setTimeout(resolve, 20)); });
  assert.ok(changed.includes('ql-list-unchecked'), changed);
});

test('Notes formatting survives the API-safe HTML representation', () => {
  const stored = writingHtmlForStorage('<p><s>Strike</s></p><ul data-checked="true"><li class="ql-indent-2">Done</li></ul>');
  assert.ok(stored.includes('ql-list-checked'));
  assert.ok(!stored.includes('data-checked'));
  const editor = writingHtmlForEditor(stored);
  assert.ok(editor.includes('data-checked="true"'));
  assert.ok(editor.includes('ql-indent-2'));
  assert.ok(writingHtmlForEditor('<del>Strike</del>').includes('<s>Strike</s>'));
});

test('Notes Save sits between Redo and Delete and writes without waiting for idle', async () => {
  notes = [sample(81)];
  mount(React.createElement(Notes));
  fireEvent.click(await screen.findByRole('button', { name: 'Open Note 81' }));
  await screen.findByRole('dialog', { name: 'Note editor' });
  const userEvent = require('@testing-library/user-event').default;
  const title = await screen.findByRole('textbox', { name: 'Note title' });
  await userEvent.clear(title);
  await userEvent.type(title, 'Immediate save');
  await waitFor(() => assert.equal(screen.getByRole('button', { name: 'Save' }).disabled, false));
  const save = screen.getByRole('button', { name: 'Save' });
  const actions = [...save.parentElement.querySelectorAll('button')].map(button => button.getAttribute('aria-label'));
  assert.deepEqual(actions, ['Undo', 'Redo', 'Save', 'Delete note']);
  fireEvent.click(save);
  await waitFor(() => assert.equal(saves.at(-1)?.title, 'Immediate save'));
  await screen.findByText('Saved');
  notes = [sample(1), sample(2)];
  saves = [];
});
afterEach(() => { cleanup(); });
const mount = (component, route = '/notes') => render(React.createElement(MemoryRouter, { initialEntries: [route] }, component));

async function protectedDiaryFixture(run) {
  const original=encryptionSettings, originalDerive=deriveOverride, originalEntries=requests.GetUserEntriesRequest;
  const c=require('../src/reusables/encryption/crypto.ts');
  const key=await crypto.subtle.importKey('raw',new Uint8Array(32),'AES-GCM',false,['encrypt','decrypt']);
  const owner={entity_id:'fixture-entity',user_id:'fixture-user'}, id='11111111-1111-4111-8111-111111111111';
  const config={...c.PROFILE,...owner,id,name:'Everyday',purpose:'diary',is_active:true,salt:btoa('s'.repeat(16)),created_at:'2026-10-20',...await c.createVerification(owner,id,key)};
  encryptionSettings={owner,supported_profile:c.PROFILE,purposes:[{purpose:'diary',configurations:[config],active_configuration_id:id,scope_version:'fixture'}],consumer_capabilities:{diary:{format_version:1}}};
  deriveOverride=async()=>key;
  let reads=0; requests.GetUserEntriesRequest=async()=>{reads++;return{results:[],next:null};};
  const open=()=>mount(React.createElement(Routes,null,React.createElement(Route,{path:'/:userID/diary',element:React.createElement(Diary)}),React.createElement(Route,{path:'/:userID',element:React.createElement('p',null,'Personal profile')})),'/owner/diary');
  try{await run({c,key,owner,id,config,open,reads:()=>reads});}
  finally{cleanup();encryptionSettings=original;deriveOverride=originalDerive;requests.GetUserEntriesRequest=originalEntries;}
}
test('switching active passphrases verifies both rows locally and sends proofs without phrases',async()=>{
  await protectedDiaryFixture(async f=>{
    const oldMutation=changeEncryptionOverride;
    const targetId='22222222-2222-4222-8222-222222222222';
    const target={...f.config,id:targetId,name:'Travel journal',is_active:false,...await f.c.createVerification(f.owner,targetId,f.key)};
    encryptionSettings.purposes[0].configurations.push(target);
    const activeProof=await f.c.verifyConfiguration(f.config,f.owner,f.key),targetProof=await f.c.verifyConfiguration(target,f.owner,f.key);
    const verified=[]; deriveOverride=async(phrase,configuration)=>{verified.push({phrase,id:configuration.id});return f.key;};
    let mutation;
    changeEncryptionOverride=async(action,id,payload)=>{mutation={action,id,payload:structuredClone(payload)};return{...encryptionSettings.purposes[0],active_configuration_id:targetId,configurations:[{...f.config,is_active:false},{...target,is_active:true}]};};
    try {
      mount(React.createElement(require('../src/app/tabs/settings/section/Passphrases.tsx').default));
      await screen.findByText('Travel journal');fireEvent.click(screen.getByRole('button',{name:'Activate',exact:true}));
      fireEvent.change(screen.getByLabelText('Current passphrase · Everyday'),{target:{value:'current phrase never sent'}});
      fireEvent.change(screen.getByLabelText('Selected passphrase · Travel journal'),{target:{value:'target phrase never sent'}});
      fireEvent.click(screen.getByRole('button',{name:'Activate passphrase',exact:true}));
      await waitFor(()=>assert.ok(mutation));
      assert.deepEqual(verified,[{phrase:'current phrase never sent',id:f.id},{phrase:'target phrase never sent',id:targetId}]);
      assert.deepEqual(mutation,{action:'activate',id:targetId,payload:{expected_scope_version:'fixture',active_verification_proof:activeProof,target_verification_proof:targetProof}});
      assert.equal(document.querySelector('input[type=password]'),null);
    }finally{changeEncryptionOverride=oldMutation;}
  });
});
test('Diary fetches no content before base unlock and exits to profile on a wrong phrase',async()=>{
  await protectedDiaryFixture(async f=>{
    deriveOverride=async()=>{throw new Error('Wrong phrase');};
    f.open();await screen.findByRole('dialog',{name:'Unlock your Diary'});assert.equal(f.reads(),0);
    fireEvent.change(screen.getByLabelText('Everyday'),{target:{value:'wrong phrase'}});fireEvent.click(screen.getByRole('button',{name:'Unlock',exact:true}));
    await screen.findByText('Personal profile');assert.equal(f.reads(),0);assert.equal(document.querySelector('input[type=password]'),null);
  });
});
test('cancelling a pending base derivation prevents late unlock and content fetch',async()=>{
  await protectedDiaryFixture(async f=>{
    let finish;deriveOverride=()=>new Promise(resolve=>{finish=resolve;});
    f.open();await screen.findByRole('dialog',{name:'Unlock your Diary'});
    fireEvent.change(screen.getByLabelText('Everyday'),{target:{value:'a long passphrase'}});fireEvent.click(screen.getByRole('button',{name:'Unlock',exact:true}));
    await waitFor(()=>assert.equal(typeof finish,'function'));fireEvent.click(screen.getByRole('button',{name:'Cancel'}));await screen.findByText('Personal profile');
    await act(async()=>finish(f.key));assert.equal(f.reads(),0);assert.equal(screen.queryByLabelText('Entry title'),null);
  });
});
test('Escape cancels the base unlock prompt without exposing Diary content',async()=>{
  await protectedDiaryFixture(async f=>{
    f.open();await screen.findByRole('dialog',{name:'Unlock your Diary'});
    fireEvent.keyDown(document,{key:'Escape'});
    await screen.findByText('Personal profile');
    assert.equal(f.reads(),0);
  });
});

test('base prompt Cancel and Escape return to the actual previous page and preserve its URL',async()=>{
  await protectedDiaryFixture(async f=>{
    const originalUrl=window.location.href,originalState=window.history.state;
    try {
      for(const [previous,cancel] of [['/feed?filter=following','button'],['/settings?section=data-and-privacy','escape']]){
        window.history.replaceState(null,'',previous);
        render(React.createElement(BrowserRouter,null,React.createElement(Routes,null,
          React.createElement(Route,{path:'/feed',element:React.createElement(Link,{to:'/owner/diary'},'Open Diary')}),
          React.createElement(Route,{path:'/settings',element:React.createElement(Link,{to:'/owner/diary'},'Open Diary')}),
          React.createElement(Route,{path:'/:userID/diary',element:React.createElement(Diary)}),
          React.createElement(Route,{path:'/:userID',element:React.createElement('p',null,'Personal profile')})
        )));
        fireEvent.click(screen.getByRole('link',{name:'Open Diary'}));
        await screen.findByRole('dialog',{name:'Unlock your Diary'});
        if(cancel==='button')fireEvent.click(screen.getByRole('button',{name:'Cancel'}));
        else fireEvent.keyDown(document,{key:'Escape'});
        await screen.findByRole('link',{name:'Open Diary'});
        assert.equal(window.location.pathname+window.location.search,previous);
        assert.equal(f.reads(),0);
        assert.equal(document.querySelector('input[type=password]'),null);
        cleanup();
      }
    }finally{cleanup();window.history.replaceState(originalState,'',originalUrl);}
  });
});
test('pagehide locks the visit, clears draft history, and requires another base proof',async()=>{
  await protectedDiaryFixture(async f=>{
    f.open();await screen.findByRole('dialog',{name:'Unlock your Diary'});fireEvent.change(screen.getByLabelText('Everyday'),{target:{value:'a long passphrase'}});fireEvent.click(screen.getByRole('button',{name:'Unlock',exact:true}));
    const title=await screen.findByLabelText('Entry title');fireEvent.change(title,{target:{value:'secret unsaved title'}});
    await act(async()=>window.dispatchEvent(new window.Event('pagehide')));await screen.findByRole('dialog',{name:'Unlock your Diary'});
    assert.equal(screen.queryByDisplayValue('secret unsaved title'),null);
    fireEvent.change(screen.getByLabelText('Everyday'),{target:{value:'a long passphrase'}});fireEvent.click(screen.getByRole('button',{name:'Unlock',exact:true}));
    assert.equal((await screen.findByLabelText('Entry title')).value,'');
  });
});
test('missing server capability blocks encrypted entry writes without falling back to plaintext',async()=>{
  await protectedDiaryFixture(async f=>{
    delete encryptionSettings.consumer_capabilities;diaryWrites=[];f.open();await screen.findByRole('dialog',{name:'Unlock your Diary'});
    fireEvent.change(screen.getByLabelText('Everyday'),{target:{value:'a long passphrase'}});fireEvent.click(screen.getByRole('button',{name:'Unlock',exact:true}));
    fireEvent.change(await screen.findByLabelText('Entry title'),{target:{value:'Private title'}});
    const editor=document.querySelector('.ql-editor');await act(async()=>{editor.innerHTML='<p>Private writing</p>';fireEvent.input(editor);await new Promise(resolve=>setTimeout(resolve,20));});
    fireEvent.click(screen.getByRole('button',{name:'Save',exact:true}));await screen.findByText(/needs a server update/);assert.equal(diaryWrites.length,0);
  });
});
test('older encrypted entries show placeholder bars without raw ciphertext and unlock only their matching configuration',async()=>{
  await protectedDiaryFixture(async f=>{
    const older='22222222-2222-4222-8222-222222222222';
    const metadata={...f.config,id:older,name:'Older journal',is_active:false,...await f.c.createVerification(f.owner,older,f.key)};
    encryptionSettings.purposes[0].configurations.push(metadata);
    const encrypted=await f.c.encryptEntry({title:'Older secret title',content:'<p>Older secret body</p>'},f.owner,older,f.key);
    const entry={...encrypted,id:'older-entry',entry_date:'2026-10-20',created_at:'2026-10-20T08:00:00Z',tag_objects:[],attachments:[],mood:null};
    requests.GetUserEntriesRequest=async()=>({results:[entry],next:null});requests.GetEntryRequest=async()=>entry;
    f.open();await screen.findByRole('dialog',{name:'Unlock your Diary'});fireEvent.change(screen.getByLabelText('Everyday'),{target:{value:'a long passphrase'}});fireEvent.click(screen.getByRole('button',{name:'Unlock',exact:true}));
    const row=await screen.findByRole('button',{name:/Locked entry/});assert.ok(row.querySelector('.diary-locked-bars'));assert.equal(document.body.textContent.includes(encrypted.title),false);assert.equal(document.body.textContent.includes('Older secret title'),false);
    fireEvent.click(row);await screen.findByRole('dialog',{name:'Unlock older entries'});
    assert.ok(document.querySelector('.writing-document .diary-locked-title'));
    assert.ok(document.querySelector('.writing-document .diary-locked-content'));
    assert.equal(document.body.textContent.includes('Older secret title'),false);
    fireEvent.click(screen.getByRole('button',{name:'Cancel',exact:true}));
    assert.ok(document.querySelector('.writing-document .diary-locked-content'));
    assert.equal(screen.queryByRole('dialog',{name:'Unlock older entries'}),null);
    fireEvent.click(screen.getByRole('button',{name:'Unlock entry',exact:true}));
    await screen.findByRole('dialog',{name:'Unlock older entries'});
    fireEvent.change(screen.getByLabelText('Older journal'),{target:{value:'older correct phrase'}});fireEvent.click(screen.getByRole('button',{name:'Unlock',exact:true}));
    await screen.findByRole('heading',{name:'Older secret title'});assert.equal(encryptionSettings.purposes[0].active_configuration_id,f.id);
    delete requests.GetEntryRequest;
  });
});

test('unlocking one entry updates it locally without refetching or resetting the paginated list', async () => {
  await protectedDiaryFixture(async f => {
    const older = '22222222-2222-4222-8222-222222222222';
    encryptionSettings.purposes[0].configurations.push({...f.config, id:older, name:'Older journal', is_active:false, ...await f.c.createVerification(f.owner,older,f.key)});
    const fields = await f.c.encryptEntry({title:'Older secret title',content:'<p>Older secret body</p>'},f.owner,older,f.key);
    const target = {...fields,id:'older-entry',entry_date:'2026-10-20',created_at:'2026-10-20T08:00:00Z',tag_objects:[],attachments:[],mood:null};
    const other = {...target,id:'other-entry',entry_date:'2026-10-19'};
    const first = {...target,id:'first-entry',title:'Keep this visible',content:'<p>First page</p>',is_encrypted:false};
    const pages=[];
    let detailReads=0;
    const originalDetail=requests.GetEntryRequest;
    requests.GetUserEntriesRequest=async({page})=>{pages.push(page);return page===1?{results:[first],next:'page2'}:{results:[target,other],next:'page3'};};
    requests.GetEntryRequest=async()=>{detailReads++;return target;};
    try {
      f.open();await screen.findByRole('dialog',{name:'Unlock your Diary'});
      fireEvent.change(screen.getByLabelText('Everyday'),{target:{value:'current passphrase'}});
      fireEvent.click(screen.getByRole('button',{name:'Unlock',exact:true}));
      await screen.findByRole('button',{name:/^Keep this visible/});
      await waitFor(()=>assert.equal(screen.getByRole('button',{name:'Load more entries'}).disabled,false));
      fireEvent.click(screen.getByRole('button',{name:'Load more entries'}));
      await waitFor(()=>assert.equal(screen.getAllByRole('button',{name:/^Locked entry/}).length,2));
      fireEvent.click(screen.getAllByRole('button',{name:/^Locked entry/})[0]);
      await screen.findByRole('dialog',{name:'Unlock older entries'});
      fireEvent.click(screen.getByRole('button',{name:'Cancel',exact:true}));
      const search=screen.getByRole('searchbox',{name:'Search diary entries'});
      fireEvent.change(search,{target:{value:'Keep'}});
      const list=document.querySelector('.diary-list');list.scrollTop=235;
      const readsBefore={pages:[...pages],detailReads};
      fireEvent.click(screen.getByRole('button',{name:'Unlock entry',exact:true}));
      await screen.findByRole('dialog',{name:'Unlock older entries'});
      fireEvent.change(screen.getByLabelText('Older journal'),{target:{value:'original passphrase'}});
      fireEvent.click(screen.getByRole('button',{name:'Unlock',exact:true}));
      await screen.findByRole('heading',{name:'Older secret title'});
      assert.deepEqual({pages,detailReads},readsBefore,'unlock must use the already fetched ciphertext');
      assert.equal(document.querySelector('.diary-list'),list);
      assert.equal(list.scrollTop,235);
      assert.equal(search.value,'Keep');
      assert.equal(list.getAttribute('aria-busy'),'false');
      assert.ok(screen.getByRole('button',{name:/^Keep this visible/}));
      fireEvent.change(search,{target:{value:''}});
      assert.ok(screen.getByRole('button',{name:/^Older secret title/}));
      assert.equal(screen.getAllByRole('button',{name:/^Locked entry/}).length,1,'other rows stay unchanged');
      assert.ok(screen.getByRole('button',{name:'Load more entries'}));
    } finally {
      if(originalDetail)requests.GetEntryRequest=originalDetail;else delete requests.GetEntryRequest;
    }
  });
});

test('Notes show card skeletons until the list response arrives', async () => {
  const original = api.list;
  let resolve;
  api.list = () => new Promise(done => { resolve = done; });
  try {
    const view = mount(React.createElement(Notes));
    const skeleton = await screen.findByRole('status', { name: 'Loading notes' });
    assert.ok(skeleton.closest('.notes-masonry').querySelectorAll('[data-note-skeleton]').length >= 6);
    await act(async () => resolve({ count: 0, next: null, results: [] }));
    assert.equal(screen.queryByRole('status', { name: 'Loading notes' }), null);
    view.unmount();
  } finally { api.list = original; }
});

test('closing a saved note keeps the list visible without skeletons during refresh', async () => {
  notes = [sample(61), sample(62)];
  const originalList = api.list;
  let resolve;
  try {
    api.list = async (...args) => ({ ...await originalList(...args), next: 'next' });
    mount(React.createElement(Notes));
    fireEvent.click(await screen.findByRole('button', { name: 'Open Note 61' }));
    const userEvent = require('@testing-library/user-event').default;
    const title = await screen.findByRole('textbox', { name: 'Note title' });
    await userEvent.clear(title);
    await userEvent.type(title, 'Updated note');
    api.list = () => new Promise(done => { resolve = done; });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Close note' })); });
    await waitFor(() => assert.equal(Boolean(screen.queryByRole('dialog', { name: 'Note editor' })), false));
    assert.ok(screen.getByRole('button', { name: 'Open Note 62' }));
    assert.equal(screen.getByRole('button', { name: 'Loading…' }).disabled, true);
    assert.equal(screen.getByRole('button', { name: 'Move Note 62. Use arrow keys, Home or End.' }).disabled, true);
    assert.equal(Boolean(screen.queryByRole('status', { name: 'Loading notes' })), false);
    assert.equal(document.querySelector('[data-note-skeleton]'), null);
    await act(async () => resolve(await originalList(1, '')));
    await screen.findByRole('button', { name: 'Open Updated note' });
  } finally { api.list = originalList; notes = [sample(1), sample(2)]; saves = []; }
});

test('loading more Notes fills the masonry gaps and repacks skeletons at every screen width', async () => {
  const originalList = api.list;
  const originalWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
  const originalHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
  let width = 1600;
  let resolve;
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get() { return this.classList.contains('notes-masonry') ? width : 0; } });
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get() { return this.classList.contains('note-card') ? this.hasAttribute('data-note-id') ? 300 : 170 : 0; } });
  api.list = page => page === 1 ? Promise.resolve({ count: 25, next: 'next', results: [sample(1)] }) : new Promise(done => { resolve = done; });
  try {
    mount(React.createElement(Notes));
    await screen.findByRole('button', { name: 'Open Note 1' });
    fireEvent.click(screen.getByRole('button', { name: 'Load more notes' }));
    const status = await screen.findByRole('status', { name: 'Loading notes' });
    const grid = document.querySelector('.notes-masonry');
    assert.ok(grid.contains(status), 'Loading status should belong to the same layout as the loaded notes');
    for (width of [1600, 390, 1040, 1960]) {
      await act(async () => window.dispatchEvent(new window.Event('resize')));
      const gap = width < 600 ? 10 : 16;
      const columns = Math.max(2, Math.floor((width + gap) / (230 + gap)));
      const cardWidth = (width - gap * (columns - 1)) / columns;
      const skeletons = [...grid.querySelectorAll('[data-note-skeleton]')];
      assert.ok(skeletons.length >= columns * 3, 'Loading cards should cover the responsive columns');
      const heights = Array(columns).fill(0);
      heights[0] = 300 + gap;
      skeletons.forEach(card => {
        const column = heights.indexOf(Math.min(...heights));
        assert.equal(parseFloat(card.style.top), heights[column], 'Fill the shortest column rather than starting below the whole collection');
        assert.ok(Math.abs(parseFloat(card.style.left) - column * (cardWidth + gap)) < 0.01);
        assert.ok(Math.abs(parseFloat(card.style.width) - cardWidth) < 0.01);
        heights[column] += 170 + gap;
      });
      assert.equal(parseFloat(grid.style.height), Math.max(...heights) - gap);
    }
    await act(async () => resolve({ count: 25, next: null, results: [sample(2)] }));
    assert.equal(document.querySelector('[data-note-skeleton]'), null);
    assert.equal(screen.queryByRole('status', { name: 'Loading notes' }), null);
    await screen.findByRole('button', { name: 'Open Note 2' });
  } finally {
    cleanup();
    api.list = originalList;
    for (const [name, descriptor] of [['clientWidth', originalWidth], ['offsetHeight', originalHeight]]) {
      if (descriptor) Object.defineProperty(HTMLElement.prototype, name, descriptor);
      else delete HTMLElement.prototype[name];
    }
  }
});

test('Diary list and entry use their own content skeletons while requests are pending', async () => {
  const original = requests.GetUserEntriesRequest;
  let resolve;
  requests.GetUserEntriesRequest = () => new Promise(done => { resolve = done; });
  try {
    const view = mount(React.createElement(Routes, null, React.createElement(Route, { path: '/:userID/diary', element: React.createElement(Diary) })), '/owner/diary');
    const skeleton = await screen.findByRole('status', { name: 'Loading diary entries' });
    assert.ok(skeleton.querySelector('.diary-row-title'));
    assert.ok(skeleton.querySelector('.diary-row-meta'));
    await waitFor(()=>assert.equal(typeof resolve,'function'));
    await act(async () => resolve({ results: [], next: null }));
    assert.equal(screen.queryByRole('status', { name: 'Loading diary entries' }), null);
    view.unmount();
  } finally { requests.GetUserEntriesRequest = original; }
  requests.GetEntryRequest = () => new Promise(done => { resolve = done; });
  try {
    mount(React.createElement(EntryView), '/owner/diary?entry_id=loading-entry');
    const skeleton = await screen.findByRole('status', { name: 'Loading diary entry' });
    assert.ok(skeleton.querySelector('.writing-document'));
    await act(async () => resolve({ id: 'loading-entry', title: 'Loaded entry', content: '<p>Now ready</p>', entry_date: '2026-10-15', tag_objects: [], attachments: [] }));
    assert.equal(screen.queryByRole('status', { name: 'Loading diary entry' }), null);
    await screen.findByText('Loaded entry');
  } finally { delete requests.GetEntryRequest; }
});

test('untouched actual Notes editor closes without a write or discard prompt', async () => {
  mount(React.createElement(Notes));
  await screen.findByRole('button', { name: 'Open Note 1' });
  fireEvent.click(screen.getByRole('button', { name: 'New note' }));
  await screen.findByRole('textbox', { name: 'Note title' });
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
  fireEvent.click(screen.getByRole('button', { name: 'Close note' }));
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
  await waitFor(() => assert.equal(screen.queryByRole('dialog', { name: 'Note editor' }), null));
  assert.equal(screen.queryByRole('alertdialog'), null); assert.equal(saves.length, 0);
});

test('title-only actual Notes editor flushes on close without entering body history', async () => {
  mount(React.createElement(Notes));
  fireEvent.click(screen.getByRole('button', { name: 'New note' }));
  const userEvent = require('@testing-library/user-event').default;
  await userEvent.type(await screen.findByRole('textbox', { name: 'Note title' }), 'Hello world');
  assert.equal(screen.getByRole('textbox', { name: 'Note title' }).value, 'Hello world');
  fireEvent.click(screen.getByRole('button', { name: 'Close note' }));
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
  await waitFor(() => assert.equal(screen.queryByRole('dialog', { name: 'Note editor' }), null));
  assert.equal(saves.at(-1).title, 'Hello world');
  fireEvent.click(screen.getByRole('button', { name: 'New note' }));
  fireEvent.change(await screen.findByRole('textbox', { name: 'Note title' }), { target: { value: 'Undo me' } });
  assert.equal(screen.getByRole('button', { name: 'Undo' }).disabled, true);
  assert.equal(screen.getByRole('textbox', { name: 'Note title' }).value, 'Undo me');
  fireEvent.click(screen.getByRole('button', { name: 'Close note' }));
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
  await waitFor(() => assert.equal(screen.queryByRole('dialog', { name: 'Note editor' }), null));
  assert.equal(screen.queryByRole('alertdialog'), null);
});

test('saved Notes can undo and redo edits back to the loaded body without recording HTML normalization', async () => {
  notes = [{ ...sample(41), content: '<p dir="ltr"><strong>Saved body</strong></p>' }];
  mount(React.createElement(Notes));
  fireEvent.click(await screen.findByRole('button', { name: 'Open Note 41' }));
  await screen.findByRole('dialog', { name: 'Note editor' });
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
  assert.equal(screen.getByRole('button', { name: 'Undo' }).disabled, true, 'Opening a saved note must not add a history step');
  const editor = document.querySelector('.ql-editor');
  await act(async () => { editor.innerHTML = '<p><strong>Saved body</strong> plus edit</p>'; fireEvent.input(editor); await new Promise(resolve => setTimeout(resolve, 20)); });
  fireEvent.change(screen.getByRole('textbox', { name: 'Note title' }), { target: { value: 'Retain this title' } });
  fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
  assert.equal(editor.textContent.trim(), 'Saved body');
  assert.equal(screen.getByRole('button', { name: 'Redo' }).disabled, false);
  assert.equal(screen.getByRole('button', { name: 'Undo' }).disabled, true);
  fireEvent.click(screen.getByRole('button', { name: 'Redo' }));
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
  assert.equal(editor.textContent.trim(), 'Saved body plus edit');
  assert.equal(screen.getByRole('textbox', { name: 'Note title' }).value, 'Retain this title');
  fireEvent.click(screen.getByRole('button', { name: 'Close note' }));
  await waitFor(() => assert.ok(!screen.queryByRole('dialog', { name: 'Note editor' }), screen.queryByRole('dialog', { name: 'Note editor' })?.textContent));
});

test('saved Notes show image, video and audio attachments with independent removal', async () => {
  const files = [
    { id: 'image', url: 'https://media.test/photo.png', file_name: 'Photo.png', file_type: 'image/png' },
    { id: 'video', url: 'https://media.test/clip.mp4', file_name: 'Clip.mp4', file_type: 'video/mp4' },
    { id: 'audio', url: 'https://media.test/memo.wav', file_name: 'Memo.wav', file_type: 'audio/wav' },
  ];
  notes = [{ ...sample(42), attachments: files }];
  mount(React.createElement(Notes));
  fireEvent.click(await screen.findByRole('button', { name: 'Open Note 42' }));
  const dialog = await screen.findByRole('dialog', { name: 'Note editor' });
  await waitFor(() => assert.ok(dialog.querySelector('img[src="https://media.test/photo.png"]')));
  assert.ok(dialog.querySelector('video'));
  assert.ok(dialog.querySelector('audio source[src="https://media.test/memo.wav"]'));
  fireEvent.click(screen.getByRole('button', { name: 'Remove Photo.png' }));
  assert.equal(dialog.querySelector('img[src="https://media.test/photo.png"]'), null);
  assert.ok(dialog.querySelector('video'));
  assert.equal(screen.getByRole('button', { name: 'Undo' }).disabled, true, 'Removing media must not enter body history');
  fireEvent.click(screen.getByRole('button', { name: 'Close note' }));
  await waitFor(() => assert.ok(!screen.queryByRole('dialog', { name: 'Note editor' }), screen.queryByRole('dialog', { name: 'Note editor' })?.textContent));
});

test('repeated Undo/Redo of a saved list keeps its original paragraph spacing', async () => {
  notes = [{ ...sample(43), content: '<p>Saved paragraph</p><ul><li>Saved list</li></ul>' }];
  mount(React.createElement(Notes));
  fireEvent.click(await screen.findByRole('button', { name: 'Open Note 43' }));
  await screen.findByRole('dialog', { name: 'Note editor' });
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
  const editor = document.querySelector('.ql-editor');
  const initial = editor.innerHTML;
  const quill = document.querySelector('.ql-container').__quill;
  await act(async () => { quill.insertText(quill.getLength() - 1, ' edited', 'user'); });
  await waitFor(() => assert.equal(screen.getByRole('button', { name: 'Undo' }).disabled, false));
  for (let i = 0; i < 3; i++) {
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
    assert.equal(editor.innerHTML, initial, 'Restoring a list must not insert blank paragraphs');
    fireEvent.click(screen.getByRole('button', { name: 'Redo' }));
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
    assert.ok(editor.textContent.endsWith('Saved list edited'));
  }
  fireEvent.click(screen.getByRole('button', { name: 'Close note' }));
  await waitFor(() => assert.ok(!screen.queryByRole('dialog', { name: 'Note editor' })));
});

test('saved-note history restores the caret at the changed text instead of another line', async () => {
  notes = [{ ...sample(44), content: '<p>First paragraph</p><p>Second paragraph</p><ul><li>List item</li></ul>' }];
  mount(React.createElement(Notes));
  fireEvent.click(await screen.findByRole('button', { name: 'Open Note 44' }));
  await screen.findByRole('dialog', { name: 'Note editor' });
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
  const quill = document.querySelector('.ql-container').__quill;
  const original = quill.getText();
  await act(async () => { quill.setSelection(6, 0, 'silent'); quill.insertText(6, 'XYZ', 'user'); quill.setSelection(9, 0, 'silent'); });
  // Restoring HTML can also repair list attributes after the text edit. That
  // formatting repair must not move the text-edit caret to the end of the list.
  await act(async () => { quill.formatLine(quill.getLength() - 2, 1, 'list', false, 'api'); });
  for (let i = 0; i < 2; i++) {
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
    assert.equal(quill.getText(), original);
    assert.equal(quill.getSelection()?.index, 6, 'Undo caret belongs at the removed insertion');
    fireEvent.click(screen.getByRole('button', { name: 'Redo' }));
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
    assert.equal(quill.getSelection()?.index, 9, 'Redo caret belongs after the restored insertion');
    assert.equal(quill.getText(), original.slice(0, 6) + 'XYZ' + original.slice(6));
  }
  fireEvent.click(screen.getByRole('button', { name: 'Close note' }));
  await waitFor(() => assert.ok(!screen.queryByRole('dialog', { name: 'Note editor' })));
});

test('Diary cards style title, mood and tags while retaining preview and entry details', async () => {
  mount(React.createElement(Routes, null, React.createElement(Route, { path: '/:userID/diary', element: React.createElement(Diary) })), '/owner/diary');
  await screen.findByText('Just a quote of the day');
  const card = document.querySelector('.diary-row');
  assert.equal(card.querySelector('.diary-row-mood')?.textContent, '🌟Hopeful');
  assert.deepEqual([...card.querySelectorAll('.writing-tag')].map(tag => tag.textContent), ['garden', 'bloom']);
  assert.equal(card.querySelector('.diary-row-preview')?.textContent, 'Body stays in the entry reader');
  assert.ok(card.querySelector('.diary-row-meta')?.textContent.includes('Private'));
  assert.equal(card.querySelector('.diary-row-meta time')?.getAttribute('datetime'), '2026-10-15T08:00:00Z');
});

test('pointer drag works on the whole note and moves it to the final grid slot', async () => {
  notes = [sample(1), sample(2), sample(3)];
  mount(React.createElement(Notes));
  await screen.findByRole('button', { name: 'Open Note 1' });
  const grid = document.querySelector('.notes-grid');
  [...grid.children].forEach((card, index) => { card.getBoundingClientRect = () => ({ left: index * 240, top: 100, width: 220, height: 180, right: index * 240 + 220, bottom: 280 }); });
  document.querySelector('.notes-scroll').getBoundingClientRect = () => ({ top: 0, bottom: 800 });
  fireEvent.pointerDown(screen.getByRole('button', { name: 'Open Note 1' }), { pointerId: 1, pointerType: 'mouse', clientX: 90, clientY: 160, button: 0 });
  fireEvent.pointerMove(grid, { pointerId: 1, pointerType: 'mouse', clientX: 580, clientY: 160 });
  assert.deepEqual([...grid.children].map(card => card.dataset.noteId), ['note-2', 'note-3', 'note-1']);
  fireEvent.pointerUp(grid, { pointerId: 1, pointerType: 'mouse', clientX: 580, clientY: 160 });
  await waitFor(() => assert.deepEqual(reorders.at(-1), { id: 'note-1', before: null }));
  assert.equal(notes.at(-1).id, 'note-1');
});

test('neighboring Notes interpolate to their new masonry position instead of snapping', async () => {
  notes = [sample(1), sample(2)];
  mount(React.createElement(Notes));
  await screen.findByRole('button', { name: 'Open Note 1' });
  const neighbor = document.querySelector('[data-note-id="note-2"]');
  const translateX = () => (parseFloat(neighbor.style.left) || 0) + Number(/translateX\(([-\d.]+)px\)/.exec(neighbor.style.transform)?.[1] || 0);
  await waitFor(() => assert.equal(translateX(), 308, 'Initial placement should land at the measured column'));
  fireEvent.keyDown(screen.getByRole('button', { name: 'Move Note 1. Use arrow keys, Home or End.' }), { key: 'End' });
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 45)); });
  assert.ok(translateX() > 0 && translateX() < 308, `The neighboring card should be in motion, got x=${translateX()}`);
  await waitFor(() => assert.ok(Math.abs(translateX()) < 0.1), { timeout: 1500 });
});

test('failed new note remains recoverable with a visible mobile resume action', async () => {
  const save = api.save;
  api.save = async () => { throw new Error('fixture offline'); };
  try {
    const mounted = mount(React.createElement(Notes));
    fireEvent.click(screen.getByRole('button', { name: 'New note' }));
    fireEvent.change(await screen.findByRole('textbox', { name: 'Note title' }), { target: { value: 'Recover this note' } });
    fireEvent.click(screen.getByRole('button', { name: 'Close note' }));
    await screen.findByRole('alertdialog', { name: 'Discard unsaved changes?' });
    fireEvent.click(screen.getByRole('button', { name: 'Keep writing' }));
    mounted.unmount();
    mount(React.createElement(Notes));
    const resume = await screen.findByRole('button', { name: 'Resume unsaved note: Recover this note' });
    assert.equal(resume.hidden, false);
    const css = fs.readFileSync(path.join(root, 'app/tabs/profile/writing/writing.css'), 'utf8');
    assert.equal(/\.notes-resume\s*\{[^}]*display\s*:\s*none/.test(css), false);
    fireEvent.click(resume);
    assert.equal(screen.getByRole('textbox', { name: 'Note title' }).value, 'Recover this note');
    fireEvent.click(screen.getByRole('button', { name: 'Close note' }));
    await screen.findByRole('alertdialog', { name: 'Discard unsaved changes?' });
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
  } finally { api.save = save; }
});

test('keyboard reorder across loaded page boundary resolves a server anchor', async () => {
  notes = Array.from({ length: 26 }, (_, i) => sample(i + 1));
  mount(React.createElement(Notes));
  const handle = await screen.findByRole('button', { name: 'Move Note 23. Use arrow keys, Home or End.' });
  fireEvent.keyDown(handle, { key: 'ArrowDown' });
  await waitFor(() => assert.equal(reorders.at(-1)?.before, 'note-25'));
  assert.equal(reorders.at(-1).id, 'note-23');
  await waitFor(() => assert.equal(screen.getByRole('button', { name: 'Move Note 23. Use arrow keys, Home or End.' }).disabled, false));
});

test('Diary history treats Quill empty normalization as untouched', () => {
  let state;
  function Harness() { state = useWritingHistory({ title: '', content: '' }); return null; }
  mount(React.createElement(Harness));
  act(() => state.change({ title: '', content: '<p><br></p>' }));
  assert.equal(state.dirty, false); assert.equal(state.canUndo, false);
  act(() => state.change({ title: 'Title', content: '<p>Body</p>' }));
  act(() => state.change({ title: 'Current title', content: '<p>Body</p>', tags: ['Life'] }));
  act(() => state.undo()); assert.equal(state.value.content, '');
  assert.equal(state.value.title, 'Current title'); assert.deepEqual(state.value.tags, ['Life']);
  act(() => state.redo()); assert.equal(state.value.content, '<p>Body</p>');
  assert.equal(state.value.title, 'Current title');
});

test('touch-accessible move-to-end action moves a note across the full collection', async () => {
  notes = Array.from({ length: 26 }, (_, i) => sample(i + 1));
  mount(React.createElement(Notes));
  fireEvent.click(await screen.findByRole('button', { name: 'Move Note 1 to end' }));
  await waitFor(() => assert.equal(reorders.at(-1)?.before, null));
  assert.equal(reorders.at(-1).id, 'note-1');
  assert.equal(notes.at(-1).id, 'note-1');
});

test('actual Diary composer loads paginated mood grid and creates inline tags', async () => {
  const userEvent = require('@testing-library/user-event').default;
  mount(React.createElement(Routes, null, React.createElement(Route, { path: '/:userID/diary', element: React.createElement(NewEntry, { reload() {} }) })), '/owner/diary?entry_id=new');
  fireEvent.click(screen.getByRole('button', { name: 'How are you feeling?' }));
  await screen.findByRole('button', { name: '🙂 Mood 1' });
  fireEvent.click(screen.getByRole('button', { name: 'Load more moods' }));
  await screen.findByRole('button', { name: '🙂 Mood 20' });
  fireEvent.click(screen.getByRole('button', { name: '🙂 Mood 20' }));
  assert.deepEqual(moodPages, [1, 2]);
  const tags = screen.getByRole('combobox', { name: 'Tags' });
  await userEvent.type(tags, 'NewTag');
  fireEvent.click(await screen.findByText('Create “NewTag”'));
  assert.ok(tagQueries.includes('NewTag'));
  fireEvent.change(screen.getByRole('textbox', { name: 'Entry title' }), { target: { value: 'Fixture diary' } });
  const editor = document.querySelector('.ql-editor');
  await act(async () => { editor.innerHTML = '<p>A fixture body</p>'; fireEvent.input(editor); await new Promise(resolve => setTimeout(resolve, 20)); });
  await waitFor(() => assert.equal(screen.getByRole('button', { name: 'Save' }).disabled, false));
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => assert.equal(diaryWrites.length, 1));
  assert.equal(diaryWrites[0].payload.mood.name, 'Mood 20');
  assert.equal(diaryWrites[0].payload.tags[0].name, 'NewTag');
  assert.equal(diaryWrites[0].payload.is_private, true);
});
