const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { webcrypto } = require('node:crypto');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<html><body></body></html>', { url: 'https://chatterloop.test/' });
Object.assign(global, { window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true });
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
const { Provider } = require('react-redux');
const { createStore } = require('redux');
const { MemoryRouter, Routes, Route, useNavigate } = require('react-router-dom');
let root, host;
afterEach(async () => { if (root) await act(async () => root.unmount()); host?.remove(); root = null; });
const owner = { entity_id: 'entity-vector', user_id: 'user-vector' };
function modules(loadConfigurations) {
  const cache = new Map();
  const load = file => {
    if (cache.has(file)) return cache.get(file);
    const exports = {}; cache.set(file, exports);
    const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
    const localRequire = name => {
      if (name.endsWith('.css')) return {};
      if (name === '@/reusables/encryption/api') return { loadConfigurations };
      // Argon2 is covered by independent crypto vectors; keep the verification real.
      if (name === '@/reusables/encryption/derive') return { deriveKey: async phrase => webcrypto.subtle.importKey('raw', new Uint8Array(32).fill(phrase === 'correct phrase' ? 0 : 1), 'AES-GCM', false, ['encrypt', 'decrypt']) };
      if (name.startsWith('@/') || name.startsWith('.')) {
        const base = name.startsWith('@/') ? path.join(__dirname, '../src', name.slice(2)) : path.resolve(path.dirname(file), name);
        const target = ['', '.ts', '.tsx'].map(ext => base + ext).find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
        return load(target);
      }
      return require(name);
    };
    vm.runInNewContext(source, { exports, require: localRequire, window, document, HTMLElement, crypto: webcrypto, TextEncoder, TextDecoder, Uint8Array, AbortController, btoa, atob, console });
    return exports;
  };
  const c = load(path.join(__dirname, '../src/reusables/encryption/crypto.ts'));
  const components = () => load(path.join(__dirname, '../src/app/tabs/messenger/MessagesProtection.tsx'));
  return { c, components, component: () => components().default };
}
async function fixture({ active = true, enabled = true } = {}) {
  const { c } = modules(() => {});
  const key = await webcrypto.subtle.importKey('raw', new Uint8Array(32), 'AES-GCM', false, ['encrypt', 'decrypt']);
  const id = '11111111-1111-4111-8111-111111111111';
  const proof = await c.createVerification(owner, id, key, 'diary');
  const config = { ...c.PROFILE, ...owner, ...proof, id, name: 'Personal passphrase', purpose: 'diary', purposes: ['messages'], verification_purpose: 'diary', is_active: active, salt: btoa('s'.repeat(16)), created_at: '2026-10-22T00:00:00Z' };
  return { owner, supported_profile: c.PROFILE, purposes: [{ purpose: 'messages', label: 'Messages', is_active: enabled, configurations: [config], active_configuration_id: active ? id : null, scope_version: 'a'.repeat(64) }] };
}
async function mount(load, initial = ['/previous', '/messages/direct'], index = 1) {
  window.history.replaceState({idx: index}, '');
  const Gate = modules(load).component();
  const auth = { user: { id: owner.user_id, userID: owner.user_id, entity_id: owner.entity_id }, active_entity_context: { id: owner.entity_id } };
  const store = createStore((state = { authentication: auth }, action) => action.type === 'account' ? { authentication: action.authentication } : state);
  let navigate;
  let builds = 0;
  function Navigation() { navigate = useNavigate(); return null; }
  function Private() { builds++; return React.createElement('div', null, 'Private messages'); }
  host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
  await act(async () => root.render(React.createElement(Provider, { store }, React.createElement(MemoryRouter, { initialEntries: initial, initialIndex: index }, React.createElement(Navigation), React.createElement(Routes, null,
    React.createElement(Route, { path: '/messages/*', element: React.createElement(Gate, null, React.createElement(Private)) }),
    React.createElement(Route, { path: '/previous', element: React.createElement('div', null, 'Actual previous page') }),
    React.createElement(Route, { path: '/', element: React.createElement('div', null, 'Safe home') })
  )))));
  return { navigate: async to => act(async () => navigate(to)), store, builds: () => builds };
}
async function click(label) { await act(async () => [...host.querySelectorAll('button')].find(button => button.textContent === label).click()); }
async function unlock(phrase) {
  await act(async () => {
    const input = host.querySelector('input');
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, phrase);
    input.dispatchEvent(new window.Event('input', { bubbles: true }));
    input.dispatchEvent(new window.Event('change', { bubbles: true }));
  });
  await act(async () => { host.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })); await new Promise(resolve => setTimeout(resolve, 30)); });
}
test('direct conversation stays unmounted until verified; wrong phrase is inline and retry works', async () => {
  const data = await fixture();
  const app = await mount(async purpose => { assert.equal(purpose, 'messages'); return data; });
  assert.equal(app.builds(), 0);
  assert.match(host.textContent, /Unlock your Messages/);
  await unlock('wrong');
  assert.equal(app.builds(), 0);
  assert.match(host.querySelector('[role=alert]').textContent, /Check your passphrase/);
  assert.equal(host.querySelector('input').value, '');
  await unlock('correct phrase');
  assert.match(host.textContent, /Private messages/);
});
test('inactive purpose and no active linked configuration bypass without setup', async () => {
  for (const settings of [{ enabled: false }, { active: false }]) {
    const data = await fixture(settings);
    await mount(async () => data);
    assert.match(host.textContent, /Private messages/);
    assert.equal(host.querySelector('[role=dialog]'), null);
    await act(async () => root.unmount()); host.remove(); root = null;
  }
});
test('one visit covers conversation navigation; leaving and browser back asks again', async () => {
  const data = await fixture(); const app = await mount(async () => data);
  await unlock('correct phrase');
  await app.navigate('/messages/another');
  assert.match(host.textContent, /Private messages/);
  await app.navigate('/previous'); await app.navigate(-1);
  assert.match(host.textContent, /Unlock your Messages/);
  assert.doesNotMatch(host.textContent, /Private messages/);
});
test('cancel restores actual prior navigation and direct visit falls back home', async () => {
  const data = await fixture(); await mount(async () => data); await click('Cancel');
  assert.match(host.textContent, /Actual previous page/);
  await act(async () => root.unmount()); host.remove(); root = null;
  await mount(async () => data, ['/messages/direct'], 0); await click('Cancel');
  assert.match(host.textContent, /Safe home/);
});
test('load failures stay closed with retry/cancel and stale account responses never open', async () => {
  const data = await fixture(); let attempts = 0;
  const app = await mount(async () => { if (++attempts === 1) throw Error('offline'); return data; });
  assert.equal(app.builds(), 0); assert.match(host.textContent, /Could not load Messages protection/);
  await click('Retry'); assert.match(host.textContent, /Unlock your Messages/);
  await act(async () => app.store.dispatch({ type: 'account', authentication: { user: { ...owner, id: 'other', userID: 'other' }, active_entity_context: { id: 'other' } } }));
  assert.equal(app.builds(), 0); assert.doesNotMatch(host.textContent, /Private messages/);
});

test('floating conversations and routed messages share one visit and cancel only closes popup', async () => {
  const data = await fixture();
  const { MessagesProtectionProvider, MessagesProtectionContent } = modules(async purpose => { assert.equal(purpose, 'messages'); return data; }).components();
  const auth = { user: {id: owner.user_id, userID: owner.user_id, entity_id: owner.entity_id}, active_entity_context: {id: owner.entity_id} };
  const store = createStore(() => ({authentication: auth}));
  let navigate, setFloating;
  function App() {
    const location = require('react-router-dom').useLocation();
    navigate = useNavigate();
    const [floating, updateFloating] = React.useState(true); setFloating = updateFloating;
    const routeActive = location.pathname.startsWith('/messages');
    return React.createElement(MessagesProtectionProvider, { active: routeActive || floating, routeActive, onCancel: () => updateFloating(false) },
      React.createElement('div', null, 'Current profile'),
      floating && React.createElement(MessagesProtectionContent, null, React.createElement('div', null, 'Floating private chat')),
      React.createElement(Routes, null, React.createElement(Route, {path: '/messages/*', element: React.createElement(MessagesProtectionContent, null, React.createElement('div', null, 'Routed private chat'))}), React.createElement(Route, {path: '/profile', element: null})));
  }
  host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host);
  await act(async () => root.render(React.createElement(Provider, {store}, React.createElement(MemoryRouter, {initialEntries: ['/profile']}, React.createElement(App)))));
  assert.doesNotMatch(host.textContent, /Floating private chat/);
  await click('Cancel');
  assert.match(host.textContent, /Current profile/);
  assert.equal(host.querySelector('[role=dialog]'), null);
  await act(async () => setFloating(true)); await unlock('correct phrase');
  assert.match(host.textContent, /Floating private chat/);
  await act(async () => navigate('/messages/direct'));
  assert.match(host.textContent, /Routed private chat/);
  assert.equal(host.querySelector('[role=dialog]'), null);
  await act(async () => { setFloating(false); navigate('/profile'); });
  await act(async () => navigate('/messages'));
  assert.match(host.textContent, /Unlock your Messages/);
  assert.doesNotMatch(host.textContent, /Routed private chat/);
});

test('late responses for an old account cannot bypass a new account visit', async () => {
  const pending = [];
  const app = await mount(() => new Promise(resolve => pending.push(resolve)));
  const oldData = await fixture({active: false});
  await act(async () => app.store.dispatch({type: 'account', authentication: {user: {id: 'new-user', userID: 'new-user', entity_id: 'new-entity'}, active_entity_context: {id: 'new-entity'}}}));
  await act(async () => pending[0](oldData));
  assert.equal(app.builds(), 0);
  assert.match(host.textContent, /Loading Messages protection/);
  const currentData = await fixture();
  await act(async () => pending[1](currentData));
  assert.equal(app.builds(), 0);
  assert.match(host.textContent, /Unlock your Messages/);
});

test('account switch after unlock immediately hides content and pagehide ends the visit', async () => {
  const data = await fixture(); const app = await mount(async () => data);
  await unlock('correct phrase');
  assert.match(host.textContent, /Private messages/);
  await act(async () => app.store.dispatch({type: 'account', authentication: {user: {id: 'new-user', userID: 'new-user', entity_id: 'new-entity'}, active_entity_context: {id: 'new-entity'}}}));
  assert.doesNotMatch(host.textContent, /Private messages/);
  assert.match(host.textContent, /Unlock your Messages/);
  await unlock('correct phrase');
  await act(async () => window.dispatchEvent(new window.Event('pagehide')));
  assert.doesNotMatch(host.textContent, /Private messages/);
  assert.match(host.textContent, /Unlock your Messages/);
});

