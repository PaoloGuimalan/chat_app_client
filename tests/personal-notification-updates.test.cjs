const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<html><body></body></html>', { url: 'https://fixture.test' });
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
const { render, cleanup, act, fireEvent } = require('@testing-library/react');
afterEach(cleanup);

let loads, reads;
function loadNotifications() {
  loads = [];
  reads = [];
  const module = { exports: {} };
  const compiled = ts.transpileModule(fs.readFileSync(path.join(__dirname,
    '../src/app/tabs/feed/Notifications.tsx'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(compiled, {
    module, exports: module.exports, document, window, console,
    require(name) {
      if (name === 'react' || name === 'react/jsx-runtime') return require(name);
      if (name === 'react-redux') return {
        useSelector: selector => selector({ notificationslist: { total: 1 }, screensizelistener: { W: 400 }, alerts: [] }),
        useDispatch: () => () => {},
      };
      if (name === 'react-router-dom') return { useNavigate: () => () => {} };
      if (name.endsWith('/requests')) return {
        NotificationsGroupedOverviewRequest: () => new Promise(resolve => loads.push(resolve)),
        ReadNotificationsRequest: async items => { reads.push(items); },
      };
      if (name === '@/reusables/hooks/reusable') return { needsMoreToFill: () => false };
      if (name === '@/reusables/hooks/notificationActions' || name === '@/redux/types') return {};
      if (name === '@/reusables/design') return {
        Card: ({ children }) => React.createElement('section', null, children),
        Icon: () => null,
        IconBtn: ({ onClick, title }) => React.createElement('button', { onClick }, title),
        useTheme: () => ({ theme: 'light' }),
      };
      if (name.endsWith('/NotificationRow')) return { __esModule: true,
        default: ({ notification }) => React.createElement('p', null, notification.content.details) };
      if (name.endsWith('/GroupedNotificationRow')) return { __esModule: true, default: () => null };
      if (name.endsWith('/NotificationSkeletons')) return { NotificationRowSkeleton: () => null };
      throw new Error(`Unmocked import ${name}`);
    },
  });
  return module.exports.default;
}

function overview(revision, details) {
  const item = { notificationID: 'summary', type: 'community_admin_activity',
    activity_revision: revision, isRead: false, content: { details } };
  const empty = { groups: [], total: 0, unread: 0, next: false };
  return { activity: { groups: [{ key: 'summary', count: 1, unread: 1, items: [item] }],
    total: 1, unread: 1, next: false }, connections: empty, system: empty };
}

test('personal Activity refreshes an updated summary even when document total is unchanged', async () => {
  const Notifications = loadNotifications();
  const view = render(React.createElement(Notifications));
  await act(async () => loads[0](overview(2, '2 new activities')));
  assert.ok(view.getByText('2 new activities'));
  act(() => document.dispatchEvent(new dom.window.CustomEvent('personal-notifications-changed', {
    detail: { event: 'community_admin_preview_changed', realm_id: 'garden' },
  })));
  assert.equal(loads.length, 2);
  await act(async () => loads[1](overview(3, '3 new activities')));
  assert.ok(view.getByText('3 new activities'));
  assert.equal(view.queryByText('2 new activities'), null);
  assert.equal(reads.length, 1, 'new arrivals are not automatically read during an open visit');
});

test('automatic and explicit reads use only the summary revisions actually displayed', async () => {
  const Notifications = loadNotifications();
  const view = render(React.createElement(Notifications));
  await act(async () => loads[0](overview(2, '2 new activities')));
  assert.equal(reads[0]?.[0]?.activity_revision, 2);
  assert.equal(reads[0]?.[0]?.notificationID, 'summary');
  fireEvent.click(view.getByRole('button', { name: /mark all/i }));
  assert.equal(reads[1]?.[0]?.activity_revision, 2);
  await act(async () => {});
  assert.equal(loads.length, 2, 'explicit reads reconcile summaries that advanced during the request');
  await act(async () => loads[1](overview(3, 'A newer unread activity')));
  assert.ok(view.getByText('A newer unread activity'));
});

test('a delayed overview cannot replace a newer summary response', async () => {
  const Notifications = loadNotifications();
  const view = render(React.createElement(Notifications));
  act(() => document.dispatchEvent(new dom.window.CustomEvent('personal-notifications-changed', {
    detail: { event: 'community_admin_preview_changed', realm_id: 'garden' },
  })));
  await act(async () => loads[1](overview(3, '3 new activities')));
  await act(async () => loads[0](overview(2, '2 new activities')));
  assert.ok(view.getByText('3 new activities'));
  assert.equal(view.queryByText('2 new activities'), null);
  assert.equal(reads[0][0].activity_revision, 3);
});

test('read transport sends valid summary snapshots and retains ordinary bulk reads', async () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/reusables/hooks/requests.ts'), 'utf8');
  const start = source.indexOf('const ReadNotificationsRequest =');
  const end = source.indexOf('// const DeclineContactRequest', start);
  const compiled = ts.transpileModule(source.slice(start, end) + '\nthis.read = ReadNotificationsRequest;', {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const requests = [];
  const context = {
    Axios: { post: async (...args) => { requests.push(args); return { data: { status: true } }; } },
    envs: { CHATTERLOOP_API: 'https://api.fixture' },
    localStorage: { getItem: () => 'token' }, console,
  };
  vm.runInNewContext(compiled, context);
  await context.read([
    { notificationID: 'summary', type: 'community_admin_activity' },
    { notificationID: '', type: 'community_admin_activity' },
    { notificationID: 'follow', type: 'follow', activity_revision: 4 },
  ]);
  await context.read();
  assert.equal(requests[0][0], 'https://api.fixture/u/readnotifications');
  assert.equal(JSON.stringify(requests[0][1]), JSON.stringify({ community_summaries: [
    { notificationID: 'summary' },
  ] }));
  assert.equal(JSON.stringify(requests[1][1]), '{"community_summaries":[]}');
  assert.equal(requests[0][2].headers['x-access-token'], 'token');
});

test('immediate inbox activity does not refresh the personal preview before its batch', async () => {
  const Notifications = loadNotifications();
  const view = render(React.createElement(Notifications));
  await act(async () => loads[0](overview(2, '2 saved activities')));
  act(() => document.dispatchEvent(new dom.window.CustomEvent('community-changed', {
    detail: { event: 'community_notifications_changed', realm_id: 'garden' },
  })));
  assert.equal(loads.length, 1);
  assert.ok(view.getByText('2 saved activities'));
});
