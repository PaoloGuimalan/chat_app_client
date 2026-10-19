const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://local.test/' });
for (const key of ['window','document','navigator','HTMLElement','SVGElement','Element','Node','MutationObserver','localStorage','getComputedStyle']) global[key] = dom.window[key];
window.PointerEvent = class extends window.MouseEvent { constructor(type, init = {}) { super(type, init); this.pointerId = init.pointerId || 1; } };
HTMLElement.prototype.setPointerCapture = () => {};
global.ResizeObserver = class { observe() {} disconnect() {} };
global.requestAnimationFrame = fn => setTimeout(fn, 0);
global.cancelAnimationFrame = clearTimeout;
const React = require('react');
const { render, screen, fireEvent, waitFor, cleanup, act } = require('@testing-library/react');
const { MemoryRouter } = require('react-router-dom');
const root = path.join(__dirname, '../src');
const originalLoad = Module._load;
const palette = ['Love','Laugh','Wow'].map((emoji_title, i) => ({ emoji_id:`emoji-${i}`, emoji_title, emoji_content:['❤️','😂','😮'][i] }));
let replies = [], reactions = [];
Module._extensions['.ts'] = Module._extensions['.tsx'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true} }).outputText, filename);
};
Module._extensions['.css'] = () => {};
Module._load = function(request, parent, isMain) {
  if (request === 'react-redux') return {useSelector:selector=>selector({emojilist:palette,activeuserslist:[],authentication:{user:{entity_id:'self'}}}),useDispatch:()=>()=>{}};
  if (request === '@/reusables/hooks/requests') return {
    ReactionSaveRequest:async value=>{reactions.push(value);},
    SendEphemeralReplyRequest:async value=>{replies.push(value);},
    GetEphemeralViewersRequest:async()=>({results:[],count:0,next:null,totals:{views:0,reactions:0,replies:0}}),
  };
  if (request.startsWith('@/')) request = path.join(root, request.slice(2));
  return originalLoad.call(this, request, parent, isMain);
};
const MobileMomentViewer = require('../src/app/tabs/moments/MobileMomentViewer.tsx').default;
const { mobileMomentMediaFit } = require('../src/app/tabs/moments/mobileMomentMediaFit.ts');
const moment = {post_id:'moment-1',entity:{id:'author',type:'user',details:{first_name:'Maya',last_name:'Reyes'}},caption:'By the water',details:{allow_replies:true},privacy_status:'public',date_posted:new Date().toISOString(),expires_at:new Date(Date.now()+3600000).toISOString()};
function mount(overrides = {}) {
  const holds = [], navigation = [];
  function Viewer() {
    const [value,setValue] = React.useState(moment);
    return React.createElement(MobileMomentViewer, {moment:value,moments:[value],index:0,progress:.25,own:false,archived:false,video:false,paused:false,muted:true,onClose:()=>navigation.push('close'),onNext:()=>navigation.push('next'),onPrevious:()=>navigation.push('previous'),onAuthor:offset=>navigation.push(offset),onPause(){},onMute(){},onHold:React.useCallback(value=>holds.push(value),[]),onReacted:id=>setValue(previous=>({...previous,entity_reaction:id})),onReport(){},onDelete(){},onArchive(){},onUnarchive(){},onChanged(){},...overrides},React.createElement('img',{src:'/moment.jpg',alt:'Moment media'}));
  }
  render(React.createElement(MemoryRouter,null,React.createElement(Viewer)));
  return {holds,navigation};
}
afterEach(()=>{cleanup();replies=[];reactions=[];});

test('native media fitting fills matching portrait screens and preserves wider media', () => {
  assert.equal(mobileMomentMediaFit(9 / 16, 390, 844), 'cover');
  assert.equal(mobileMomentMediaFit(16 / 9, 390, 844), 'contain');
  assert.equal(mobileMomentMediaFit(9 / 16, 320, 844), 'contain');
  assert.equal(mobileMomentMediaFit(16 / 9, 844, 390), 'cover');
  assert.equal(mobileMomentMediaFit(0, 390, 844), 'contain');
});

test('mobile shows the author and caption over the media, with reactions behind one button', () => {
  mount();
  const viewer = screen.getByRole('region',{name:'Moments viewer'});
  assert.ok(viewer.contains(screen.getByAltText('Moment media')));
  assert.ok(screen.getByText('Maya Reyes'));
  assert.ok(screen.getByText('By the water'));
  assert.equal(screen.queryByRole('button',{name:'React Love'}),null);
  fireEvent.click(screen.getByRole('button',{name:'Reactions'}));
  assert.ok(screen.getByRole('button',{name:'React Love'}));
});

test('reply submits trimmed text to the current Moment and clears the input', async () => {
  const {holds} = mount();
  const input = screen.getByRole('textbox',{name:'Reply to Maya'});
  fireEvent.focus(input);
  assert.equal(holds.at(-1),true);
  fireEvent.change(input,{target:{value:'  Beautiful afternoon  '}});
  await act(async()=>fireEvent.click(screen.getByRole('button',{name:'Send reply'})));
  assert.deepEqual(replies,[{authorEntityId:'author',kind:'moment',postId:'moment-1',content:'Beautiful afternoon'}]);
  assert.equal(input.value,'');
});

test('reacting locks other reactions and tapping the chosen one does not write twice', async () => {
  mount();
  fireEvent.click(screen.getByRole('button',{name:'Reactions'}));
  await act(async()=>fireEvent.click(screen.getByRole('button',{name:'React Love'})));
  assert.equal(screen.getByRole('button',{name:'React Laugh'}).disabled,true);
  await act(async()=>fireEvent.click(screen.getByRole('button',{name:'React Love'})));
  assert.deepEqual(reactions,[{post_id:'moment-1',emoji_id:'emoji-0',method:'POST'}]);
  assert.ok(screen.getByText('You reacted ❤️ · Maya will see it'));
});

test('media taps navigate; holding pauses until release without advancing', async () => {
  const {holds,navigation} = mount();
  const media = screen.getByAltText('Moment media').parentElement;
  media.getBoundingClientRect = () => ({left:0,width:390});
  fireEvent.pointerDown(media,{clientX:20,clientY:300,button:0});fireEvent.pointerUp(media,{clientX:20,clientY:300});
  fireEvent.pointerDown(media,{clientX:300,clientY:300,button:0});fireEvent.pointerUp(media,{clientX:300,clientY:300});
  assert.deepEqual(navigation,['previous','next']);
  fireEvent.pointerDown(media,{clientX:300,clientY:300,button:0});
  await act(async()=>new Promise(resolve=>setTimeout(resolve,210)));
  assert.equal(holds.at(-1),true);
  fireEvent.pointerUp(media,{clientX:300,clientY:300});
  assert.equal(holds.at(-1),false);
  assert.deepEqual(navigation,['previous','next']);
});

test('own Moment opens viewers in a dismissible sheet and pauses playback', async () => {
  const {holds} = mount({own:true});
  fireEvent.click(screen.getByRole('button',{name:'Viewers'}));
  assert.ok(await screen.findByRole('dialog',{name:'Moment viewers and settings'}));
  assert.equal(holds.at(-1),true);
  await screen.findByText('No one has seen this Moment yet.');
  fireEvent.keyDown(window,{key:'Escape'});
  await waitFor(()=>assert.equal(screen.queryByRole('dialog'),null));
  assert.equal(holds.at(-1),false);
});

test('disabled replies hide both reaction and reply controls', () => {
  mount({moment:{...moment,details:{allow_replies:false}}});
  assert.equal(screen.queryByRole('textbox'),null);
  assert.equal(screen.queryByRole('button',{name:'Reactions'}),null);
  assert.ok(screen.getByText('Replies are off for this moment'));
});
