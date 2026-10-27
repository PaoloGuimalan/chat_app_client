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

let actor = 'manager', calls = [], acknowledgments = [], errors = [], destinations = [];
function load(relative, overrides = {}) {
  const fixture = { exports: {} };
  const compiled = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src', relative), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(compiled, {
    module: fixture, exports: fixture.exports, document, URL,
    localStorage: { getItem: () => 'fixture-token' },
    require(name) {
      if (overrides[name]) return overrides[name];
      if (name === 'react' || name === 'react/jsx-runtime') return require(name);
      if (name === 'react-redux') return { useSelector: selector => selector({ authentication: { user: { entity_id: actor } } }) };
      if (name === 'react-router-dom') return { useNavigate: () => route => destinations.push(route) };
      if (name === '@/reusables/hooks/communityRequests') return {
        listCommunityNotifications: (...args) => new Promise((resolve, reject) => calls.push({ args, resolve, reject })),
        acknowledgeCommunityNotifications: async (...args) => acknowledgments.push(args),
      };
      if (name === '@/reusables/hooks/errormessages') return { notifyRequestError: (...args) => errors.push(args) };
      if (name === '@/reusables/hooks/reusable') return { timeSince: () => 'just now' };
      if (name === '@/app/reusables/ContributionAuthor') return { AnonymousAvatar: () => React.createElement('span', { role: 'img', 'aria-label': 'Anonymous member' }) };
      if (name === '@/reusables/design') return {
        Avatar: ({ id, name, src }) => React.createElement('span', { 'data-avatar-id': id, 'data-avatar-name': name, 'data-avatar-src': src }),
        Card: ({ children, className }) => React.createElement('div', { className }, children),
        Btn: ({ children, onClick, disabled }) => React.createElement('button', { onClick, disabled }, children),
        Icon: ({ n }) => React.createElement('span', { 'data-icon': n }),
        PageFlag: ({ realmType }) => realmType === 'page' ? React.createElement('span', { title: 'Page' }) : null,
        BotFlag: ({ type }) => type === 'bot' ? React.createElement('span', { title: 'Bot' }) : null,
      };
      if (name === 'react-loading-skeleton') return { __esModule: true, default: () => null, SkeletonTheme: ({ children }) => children };
      if (name.endsWith('.css')) return {};
      throw new Error(`Unmocked import ${name}`);
    },
  });
  return fixture.exports;
}
const Notifications = load('app/tabs/realms/tabs/Notifications.tsx').default;
const realm = { id: 'community', realm_id: 'community', name: 'Garden Club', type: 'community' };
const row = extra => ({ id: 'notice', type: 'community_join_request', description: 'Mika wants to join Garden Club.',
  actor: { id: 'mika', type: 'user', details: { first_name: 'Mika', profile: '/mika.jpg' } },
  is_anonymous: false, created_at: '2026-10-27T00:00:00Z', request_id: 'request', request_status: 'pending', post_id: null, anchor: null, ...extra });
const page = (results, next = null) => ({ results, next, previous: null, count: results.length, activity_revision: 12 });
function mount(props = {}) {
  actor = 'manager'; calls = []; acknowledgments = []; errors = []; destinations = [];
  return render(React.createElement(Notifications, { realm, ...props }));
}

test('join requests show current status and review only pending requests', async () => {
  const view = mount();
  assert.ok(view.getByRole('status'));
  await act(async () => calls[0].resolve(page([row(), row({ id: 'old', request_status: 'accepted' })])));
  assert.equal(view.getAllByText('Review request').length, 1);
  assert.ok(view.getByText('Approved'));
  assert.equal(JSON.stringify(acknowledgments), JSON.stringify([['community', 12, ['notice', 'old']]]));
  fireEvent.click(view.getByText('Review request'));
  assert.deepEqual(destinations, ['/realms/community/members']);
});

test('media activity opens its permalink and anonymous rows discard every actor field', async () => {
  const view = mount();
  await act(async () => calls[0].resolve(page([row({ type: 'post_comment', post_id: 'photo', anchor: 'comment-1', request_status: null,
    is_anonymous: true, description: 'An anonymous member commented on your community’s post.' })])));
  assert.match(view.container.innerHTML, /Anonymous member/);
  assert.doesNotMatch(view.container.innerHTML, /mika|Mika/);
  fireEvent.click(view.getByText('View post'));
  assert.deepEqual(destinations, ['/post/photo?anchor=comment-1']);
});

test('notification subjects are bold and retain current user, page and bot markers', async () => {
  const view = mount();
  await act(async () => calls[0].resolve(page([
    row({ description: 'Mika wants to join Garden Club.', actor: {
      id: 'mika', type: 'user', details: { first_name: 'Mika', is_badged: true },
    } }),
    row({ id: 'page', description: 'Neon Systems commented on Garden Club’s post.',
      type: 'post_comment', post_id: 'photo', actor: {
        id: 'neon', type: 'realm', details: { name: 'Neon Systems', type: 'page', is_verified: true },
      } }),
    row({ id: 'bot', description: 'Helper reacted to Garden Club’s post.',
      type: 'post_reaction', post_id: 'photo', actor: {
        id: 'helper', type: 'bot', details: { name: 'Helper', is_verified: true },
      } }),
  ])));
  const rows = view.container.querySelectorAll('article');
  assert.equal(rows[0].querySelector('strong')?.textContent, 'Mika');
  assert.ok(rows[0].querySelector('[data-icon="verified"]'));
  assert.equal(rows[1].querySelector('strong')?.textContent, 'Neon Systems');
  assert.ok(rows[1].querySelector('[title="Page"]'));
  assert.ok(rows[2].querySelector('[title="Bot"]'));
  assert.equal(view.container.textContent.match(/Neon Systems/g).length, 1);
});

test('anonymous subjects stay bold without exposing supplied identity markers', async () => {
  const view = mount();
  await act(async () => calls[0].resolve(page([row({
    is_anonymous: true, type: 'post_reaction', post_id: 'photo',
    description: 'An anonymous member reacted to Garden Club’s post.',
    actor: { id: 'private', type: 'realm', details: { name: 'Secret Page', type: 'page', is_verified: true } },
  })])));
  assert.equal(view.container.querySelector('strong')?.textContent, 'An anonymous member');
  assert.equal(view.container.querySelector('[data-icon="verified"]'), null);
  assert.equal(view.container.querySelector('[title="Page"]'), null);
  assert.doesNotMatch(view.container.innerHTML, /Secret Page|private/);
});

test('email verification alone does not display a user identity badge', async () => {
  const view = mount();
  await act(async () => calls[0].resolve(page([row({ actor: {
    id: 'mika', type: 'user', details: { first_name: 'Mika', is_badged: false, is_verified: true },
  } })])));
  assert.equal(view.container.querySelector('[data-icon="verified"]'), null);
});

test('load more appends rows and failures preserve existing activity with a retry', async () => {
  const view = mount();
  await act(async () => calls[0].resolve(page([row()], 'https://api.fixture?page=2')));
  fireEvent.click(view.getByText('Load more'));
  assert.equal(calls[1].args[1].page, 2);
  await act(async () => calls[1].reject(new Error('offline')));
  assert.match(view.container.textContent, /Mika wants to join Garden Club\./);
  assert.equal(errors.length, 1);
  fireEvent.click(view.getByText('Try again'));
  await act(async () => calls[2].resolve(page([row({ id: 'next', description: 'Lee reacted to your community’s post.', type: 'post_reaction', post_id: 'photo' })])));
  assert.match(view.container.textContent, /Mika wants to join Garden Club\./);
  assert.ok(view.getByText('Lee reacted to your community’s post.'));
  assert.equal(acknowledgments.length, 2);
  assert.equal(JSON.stringify(acknowledgments[1]), JSON.stringify(['community', 12, ['next']]));
});

test('actor switch and unmount ignore stale success and failure responses', async () => {
  const view = mount();
  const old = calls[0];
  actor = 'other-manager';
  view.rerender(React.createElement(Notifications, { realm }));
  assert.equal(calls.length, 2);
  await act(async () => old.resolve(page([row()])));
  assert.equal(acknowledgments.length, 0);
  assert.doesNotMatch(view.container.innerHTML, /Mika/);
  view.unmount();
  await act(async () => calls[1].reject(new Error('late failure')));
  assert.equal(errors.length, 0);
});

test('realm events refresh only this community and remove obsolete request actions', async () => {
  const view = mount();
  await act(async () => calls[0].resolve(page([row()])));
  act(() => document.dispatchEvent(new dom.window.CustomEvent('community-changed', { detail: { realm_id: 'elsewhere', event: 'community_notifications_changed' } })));
  assert.equal(calls.length, 1);
  act(() => document.dispatchEvent(new dom.window.CustomEvent('community-changed', { detail: { realm_id: realm.id, event: 'community_requests_changed' } })));
  assert.equal(calls.length, 2);
  assert.equal(view.queryByText('Review request'), null);
  await act(async () => calls[1].resolve(page([row({ request_status: 'revoked' })])));
  assert.ok(view.getByText('Withdrawn'));
});

test('empty notifications explain the activity scope and unknown types have no actions', async () => {
  const view = mount();
  await act(async () => calls[0].resolve(page([])));
  assert.ok(view.getByText('No notifications yet'));
  assert.match(view.container.textContent, /community’s own posts/);
  act(() => document.dispatchEvent(new dom.window.CustomEvent('community-changed', { detail: { realm_id: realm.id } })));
  await act(async () => calls[1].resolve(page([row({ type: 'future_event', description: 'Unknown activity' })])));
  assert.equal(view.queryByText('Unknown activity'), null);
});

test('losing management access clears already rendered notification identities', async () => {
  const view = mount();
  await act(async () => calls[0].resolve(page([row()], 'https://api.fixture?page=2')));
  assert.match(view.container.textContent, /Mika/);
  fireEvent.click(view.getByText('Load more'));
  await act(async () => calls[1].reject({ response: { status: 403 } }));
  assert.doesNotMatch(view.container.textContent, /Mika/);
  assert.equal(view.queryByText('Review request'), null);
});

test('notification transport uses the configured API, encoded realm and authenticated snapshot acknowledgment', async () => {
  const requests = [];
  const api = load('reusables/hooks/communityRequests.ts', {
    './requests': { firstPartyClient: {
      get: async (...args) => { requests.push(['get', ...args]); return { data: page([]) }; },
      post: async (...args) => { requests.push(['post', ...args]); return { data: { status: true } }; },
    } },
    './env_configs': { __esModule: true, default: { USER_SERVICE_API: 'https://users.fixture' } },
  });
  await api.listCommunityNotifications('garden club', { page: 2 });
  await api.acknowledgeCommunityNotifications('garden club', 12, ['notice-1']);
  assert.equal(requests[0][1], 'https://users.fixture/api/realm/communities/garden%20club/notifications');
  assert.equal(requests[0][2].headers['x-access-token'], 'fixture-token');
  assert.equal(requests[0][2].params.page, 2);
  assert.equal(requests[1][1], 'https://users.fixture/api/realm/communities/garden%20club/notifications/read');
  assert.equal(requests[1][2].activity_revision, 12);
  assert.equal(JSON.stringify(requests[1][2].notification_ids), JSON.stringify(['notice-1']));
  assert.equal(requests[1][3].headers['x-access-token'], 'fixture-token');
});

const router = require('react-router-dom');
const stub = text => ({ __esModule: true, default: () => React.createElement('p', null, text) });
function manageImports(info) {
  return {
    'react-router-dom': router,
    'react-redux': { useSelector: selector => selector({ screensizelistener: { W: 1200 } }) },
    '@/app/reusables/CommunityName': { __esModule: true, default: ({ community }) => community.name },
    'react-icons/io5': { IoArrowBack: () => null },
    'react-icons/io': { IoMdClose: () => null, IoMdMenu: () => null },
    'react-icons/ai': { AiOutlineLoading3Quarters: () => null },
    'framer-motion': { motion: { div: ({ children }) => React.createElement('div', null, children) } },
    '../tabs/Dashboard': stub('Dashboard content'), '../tabs/Details': stub('Details content'),
    '../tabs/Media': stub('Media content'), '../tabs/Members': stub('Members content'), '../tabs/Followers': stub('Followers content'),
    '../tabs/Notifications': { __esModule: true, default: ({ onReviewRequests }) => React.createElement('div', null,
      'Notification content', onReviewRequests && React.createElement('button', { onClick: onReviewRequests }, 'Review request')) },
    './manageTabs': { hasMediaTab: () => true },
    './useManagedRealm': { useManagedRealm: () => ({ isloaded: true, realmInfo: info }) },
    '@/app/reusables/Modal': { __esModule: true, default: ({ component }) => component },
  };
}

test('manage route shows notifications only for communities and keeps moderator settings restricted', () => {
  for (const type of ['community', 'server', 'page', 'group', 'conference']) {
    for (const my_role of type === 'community' ? ['owner', 'moderator'] : ['owner']) {
      const info = { ...realm, type, my_role };
      const ManageRealm = load('app/tabs/realms/manage/ManageRealm.tsx', manageImports(info)).default;
      const view = render(React.createElement(router.MemoryRouter, { initialEntries: ['/realms/community/notifications'] },
        React.createElement(router.Routes, null, React.createElement(router.Route, { path: '/realms/:id/*', element: React.createElement(ManageRealm, { realm: info }) }))));
      if (type === 'community') {
        assert.ok(view.getByRole('button', { name: 'Notifications' }));
        assert.ok(view.getByText('Notification content'));
        assert.equal(Boolean(view.queryByRole('button', { name: 'Profile Details' })), my_role !== 'moderator');
      } else {
        assert.equal(view.queryByRole('button', { name: 'Notifications' }), null);
        assert.equal(view.queryByText('Notification content'), null);
      }
      view.unmount();
    }
  }
});

test('community moderators can use modal notifications and review in its existing members pane', () => {
  const info = { ...realm, is_admin: false, my_role: 'moderator' };
  const imports = manageImports(info);
  imports['@/reusables/design'] = {
    Avatar: () => null, Icon: () => null,
    SegTabs: ({ tabs, onChange }) => React.createElement('nav', null, tabs.map(tab => React.createElement('button', { key: tab.key, onClick: () => onChange(tab.key) }, tab.label))),
  };
  const Modal = load('app/tabs/realms/manage/ManageRealmModal.tsx', imports).default;
  const view = render(React.createElement(Modal, { realmId: realm.id, onClose() {} }));
  assert.ok(view.getByText('Members content'));
  assert.equal(view.queryByText('Details'), null);
  fireEvent.click(view.getByText('Notifications'));
  assert.ok(view.getByText('Notification content'));
  fireEvent.click(view.getByText('Review request'));
  assert.ok(view.getByText('Members content'));
});
