const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<html><body></body></html>', { url: 'https://fixture.test' });
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
const React = require('react');
const { render, fireEvent, act } = require('@testing-library/react');

const source = ts.transpileModule(fs.readFileSync(path.join(__dirname,
  '../src/app/tabs/servers/partials/Default.tsx'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
    jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;
const page = (ids, next = null) => ({ count: ids.length, next, previous: null,
  results: ids.map(id => ({ id, name: id })) });

function fixture(t) {
  const requests = [], timers = new Map();
  let timerId = 0;
  const exports = {};
  vm.runInNewContext(source, {
    exports, console,
    setTimeout(fn) { timers.set(++timerId, fn); return timerId; },
    clearTimeout(id) { timers.delete(id); },
    require(name) {
      if (name === '@/reusables/hooks/requests') return {
        GetTopRealmsRequest: (...args) => new Promise((resolve, reject) => {
          requests.push({ args, resolve, reject });
        }),
      };
      if (name === 'react-redux') return {
        useSelector: selector => selector({ screensizelistener: { W: 1200 } }),
      };
      if (name === '@/redux/actions/states') return { genericpaginationstate: page([]) };
      if (name.endsWith('/PublicServerItem')) return { __esModule: true,
        default: ({ mp }) => React.createElement('span', { 'data-server': mp.id }, mp.name) };
      if (name.startsWith('@/app/')) return { __esModule: true, default: () => null };
      if (name.startsWith('react-icons/')) return new Proxy({}, { get: () => () => null });
      return require(name);
    },
  });
  const view = render(React.createElement(exports.default));
  t.after(() => view.unmount());
  return {
    requests,
    ids: () => [...view.container.querySelectorAll('[data-server]')].map(el => el.dataset.server),
    change: value => fireEvent.change(view.getByPlaceholderText('Search something...'), { target: { value } }),
    more: () => fireEvent.click(view.getByText('Load more')),
    async tick() { await act(async () => {
      for (const [id, fn] of [...timers]) { timers.delete(id); fn(); }
    }); },
    async respond(index, value) { await act(async () => { requests[index].resolve(value); }); },
    unmount: view.unmount,
  };
}

for (const empty of ['', '   ']) {
  test(`clearing search to ${JSON.stringify(empty)} replaces private matches with public servers`, async t => {
    const f = fixture(t);
    await f.respond(0, page(['public']));
    f.change('private'); await f.tick();
    assert.deepEqual(f.requests[1].args, [1, 10, 'server', 'private']);
    await f.respond(1, page(['private-match']));
    assert.deepEqual(f.ids(), ['private-match']);
    f.change(empty);
    assert.deepEqual(f.ids(), []);
    await f.tick();
    assert.deepEqual(f.requests[2].args, [1, 10, 'server', null]);
    await f.respond(2, page(['public']));
    assert.deepEqual(f.ids(), ['public']);
  });
}

test('each query resets pagination and load more stays within the current query', async t => {
  const f = fixture(t);
  await f.respond(0, page(['public-1'], '/page/2'));
  f.more(); await f.tick();
  await f.respond(1, page(['public-1', 'public-2']));
  assert.deepEqual(f.ids(), ['public-1', 'public-2']);
  f.change('private'); await f.tick();
  assert.deepEqual(f.requests[2].args, [1, 10, 'server', 'private']);
  await f.respond(2, page(['private-1'], '/page/2'));
  f.more(); await f.tick();
  assert.deepEqual(f.requests[3].args, [2, 10, 'server', 'private']);
  await f.respond(3, page(['private-1', 'private-2'], '/page/3'));
  assert.deepEqual(f.ids(), ['private-1', 'private-2']);
  f.change(''); await f.tick();
  assert.deepEqual(f.requests[4].args, [1, 10, 'server', null]);
  await f.respond(4, page(['public-1'], '/page/2'));
  assert.deepEqual(f.ids(), ['public-1']);
  f.more(); await f.tick();
  assert.deepEqual(f.requests[5].args, [2, 10, 'server', null]);
  await f.respond(5, page(['public-1', 'public-2']));
  assert.deepEqual(f.ids(), ['public-1', 'public-2']);
});

test('late search responses cannot restore private matches after clearing', async t => {
  const f = fixture(t);
  await f.respond(0, page(['public']));
  f.change('private'); await f.tick();
  f.change(''); await f.tick();
  await f.respond(2, page(['public']));
  await f.respond(1, page(['private-match']));
  assert.deepEqual(f.ids(), ['public']);
});

test('superseded debounce and unmounted searches do not issue requests', async t => {
  const f = fixture(t);
  await f.respond(0, page(['public']));
  f.change('old'); f.change('new'); await f.tick();
  assert.equal(f.requests.length, 2);
  assert.deepEqual(f.requests[1].args, [1, 10, 'server', 'new']);
  f.change('pending'); f.unmount(); await f.tick();
  assert.equal(f.requests.length, 2);
});
