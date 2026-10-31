const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<html><body></body></html>', { url: 'https://fixture.test' });
Object.assign(global, { window: dom.window, document: dom.window.document });
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
const { render, cleanup, fireEvent, waitFor } = require('@testing-library/react');
afterEach(cleanup);

function load(relative, overrides = {}) {
  const fixture = { exports: {} };
  const compiled = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src', relative), 'utf8'), {
    fileName: relative, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(compiled, {
    module: fixture, exports: fixture.exports, document, window: dom.window, CustomEvent: dom.window.CustomEvent, getComputedStyle: dom.window.getComputedStyle, console, setTimeout, clearTimeout,
    localStorage: { getItem: () => 'fixture-token' },
    require(name) {
      if (overrides[name]) return overrides[name];
      if (name === 'react' || name === 'react/jsx-runtime' || name.startsWith('react-icons/')) return require(name);
      if (name.endsWith('.css')) return {};
      return {};
    },
  });
  return fixture.exports;
}
const roles = [
  { id: 10, name: 'moderator', is_default: true, permissions: ['posts.review'] },
  { id: 11, name: 'moderator', is_default: false, permissions: ['posts.review', 'posts.delete'] },
  { id: 20, name: 'admin', is_default: true, permissions: ['realm.update'] },
];
const roleHelpers = load('reusables/vars/roles.ts');
const RoleSelect = load('app/widgets/members/RoleSelect.tsx', { '@/reusables/vars/roles': roleHelpers }).default;

test('same-name roles remain separate options and defaults require the explicit marker', () => {
  assert.equal(roleHelpers.defaultRole(roles, 'moderator').id, 10);
  assert.equal(roleHelpers.defaultRole([roles[1]], 'moderator'), undefined);
  const selected = [];
  const view = render(React.createElement(RoleSelect, { roles, value: 10, onChange: role => selected.push(role) }));
  assert.equal(view.getByRole('combobox').value, '10');
  assert.match(view.getByRole('option', { name: /#11/ }).textContent, /Moderator/);
  assert.match(view.getByRole('option', { name: /#11/ }).title, /posts.delete/);
  fireEvent.change(view.getByRole('combobox'), { target: { value: '11' } });
  assert.equal(selected[0], roles[1]);
});

test('role API keeps duplicate definitions and member updates send only the exact ID', async () => {
  const calls = [];
  const axios = {
    get: async (...args) => { calls.push(['get', ...args]); return { data: { status: true, result: roles } }; },
    put: async (...args) => { calls.push(['put', ...args]); return { data: { status: true } }; },
    interceptors: { request: { use() {} }, response: { use() {} } },
  };
  const api = load('reusables/hooks/requests.ts', {
    axios: { create: () => axios },
    './env_configs': { __esModule: true, default: { USER_SERVICE_API: 'https://us', CHATTERLOOP_API: 'https://rt' } },
  });
  assert.equal(await api.GetRoleDefinitionsRequest(), roles);
  await api.UpdateMemberRoleRequest('realm', 'member', 11);
  assert.equal(calls[0][1], 'https://us/api/entity/roles');
  assert.equal(calls[0][2].headers['x-access-token'], 'fixture-token');
  assert.equal(JSON.stringify(calls[1][2]), JSON.stringify({ realm_id: 'realm', member_id: 'member', new_role_id: 11 }));
});

test('page manage invites send a selected duplicate role ID and retain follow invites without a role', async () => {
  const sent = [];
  const InvitePeople = load('app/widgets/invites/InvitePeople.tsx', {
    '@/reusables/hooks/useRoleDefinitions': { useRoleDefinitions: () => ({ roles, loading: false, error: false, reload() {} }) },
    '@/reusables/vars/roles': roleHelpers,
    '../members/RoleSelect': { __esModule: true, default: RoleSelect },
    '@/reusables/hooks/requests': {
      CreateRealmInviteRequest: async payload => { sent.push(payload); return { status: true }; },
      GetRealmInviteRequest: async () => ({ result: [] }),
    },
    '@/reusables/design': {
      Btn: props => React.createElement('button', props), Icon: () => null, Avatar: () => null, PageFlag: () => null,
      SegTabs: ({ tabs, value, onChange }) => React.createElement('div', null, tabs.map(tab => React.createElement('button', { key: tab.key, onClick: () => onChange(tab.key), 'aria-pressed': tab.key === value }, tab.label))),
    },
    '@/reusables/hooks/errormessages': { resolveErrorMessage: (_, fallback) => fallback },
  }).default;
  const view = render(React.createElement(InvitePeople, { realmId: 'page', realmType: 'page', realmName: 'Page', showPending: false }));
  fireEvent.click(view.getByText('Help run'));
  assert.equal(view.getByRole('combobox', { name: 'Role' }).value, '10');
  fireEvent.change(view.getByRole('combobox', { name: 'Role' }), { target: { value: '11' } });
  fireEvent.change(view.getByRole('combobox', { name: 'Name, username or email to invite' }), { target: { value: 'hello@example.com' } });
  fireEvent.click(view.getByText('Invite'));
  await waitFor(() => assert.equal(sent.length, 1));
  assert.equal(sent[0].role_id, 11);
  assert.equal(sent[0].purpose, 'manage');
  assert.equal(Object.hasOwn(sent[0], 'role'), false);
  fireEvent.click(view.getByText('Follow'));
  fireEvent.change(view.getByRole('combobox', { name: 'Name, username or email to invite' }), { target: { value: 'other@example.com' } });
  fireEvent.click(view.getByText('Invite'));
  await waitFor(() => assert.equal(sent.length, 2));
  assert.equal(Object.hasOwn(sent[1], 'role_id'), false);
});

test('member management and conference menus select exact definitions rather than toggling names', async () => {
  const changes = [];
  const MembersOptions = load('app/widgets/members/MembersOptions.tsx', {
    '@/reusables/hooks/useRoleDefinitions': { useRoleDefinitions: () => ({ roles, loading: false, error: false, reload() {} }) },
    './RoleSelect': { __esModule: true, default: RoleSelect },
    'react-redux': { useSelector: fn => fn({ alerts: [] }), useDispatch: () => () => {} },
    'react-router-dom': { useNavigate: () => () => {} },
    '@/reusables/hooks/requests': { UpdateMemberRoleRequest: async (...args) => { changes.push(args); return { status: true }; } },
  }).default;
  const view = render(React.createElement(MembersOptions, {
    member: { member_id: 'member', realm: 'realm', role: 'moderator', role_id: 10, entity: { type: 'user', details: { first_name: 'Mika', last_name: 'Santos' } } },
    hide: [], realmNoun: 'server', viewerIsOwner: false, isSelf: false,
  }));
  fireEvent.click(view.getByRole('button'));
  fireEvent.change(view.getByRole('combobox'), { target: { value: '11' } });
  await waitFor(() => assert.equal(changes.length, 1));
  assert.equal(JSON.stringify(changes[0]), JSON.stringify(['realm', 'member', 11]));
  view.unmount();

  const MemberActionsMenu = load('app/conference/MemberActionsMenu.tsx', {
    '../widgets/members/RoleSelect': { __esModule: true, default: RoleSelect },
  }).default;
  const conference = render(React.createElement(MemberActionsMenu, {
    roles, roleId: 10, loadingRoles: false, rolesError: false, onRetryRoles() {}, busy: false, locked: false,
    onSetRole: role => changes.push(role.id), onRemove() {},
  }));
  fireEvent.click(conference.getByRole('button', { name: 'Member options' }));
  fireEvent.change(conference.getByRole('combobox'), { target: { value: '11' } });
  assert.equal(changes[1], 11);
});
