const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { load, state, reset, React, render, fireEvent, act, cleanup } = require('./realm-management-fixture.cjs');
afterEach(cleanup);
const Permissions = load('app/tabs/realms/tabs/Permissions.tsx').default;
const realm = { id: 'club', realm_id: 'club', type: 'community', capabilities: { can_manage_roles: true, can_manage_permissions: true } };
const config = () => ({ capabilities: realm.capabilities, features: { realm_role_configuration: true }, roles: [
  { id: 1, name: 'Owner', code: 'owner', is_default: true, editable: false, permissions_editable: false, permissions: ['realm.post.submit', 'realm.post.publish'] },
  { id: 2, name: 'Member', code: 'member', is_default: true, editable: true, permissions_editable: true, permissions: ['realm.post.submit', 'realm.post.publish'] },
], catalog: [{ permission: 'realm.post.submit', description: 'Submit posts', grantable: true },
  { permission: 'realm.post.publish', description: 'Publish posts without approval', grantable: true }] });
test('Owner is immutable; changing Member permissions sends one atomic scoped grant update', async () => {
  reset(); assert.equal(typeof Permissions, 'function');
  const view = render(React.createElement(Permissions, { realm }));
  await act(async () => state.calls[0].resolve(config()));
  fireEvent.click(view.getByRole('button', { name: 'Owner' }));
  assert.equal(view.getByLabelText('Submit posts').disabled, true);
  fireEvent.click(view.getByRole('button', { name: 'Member' }));
  fireEvent.click(view.getByLabelText('Publish posts without approval'));
  fireEvent.click(view.getByRole('button', { name: 'Save permissions' }));
  assert.equal(state.calls[1].method, 'saveRealmPermissions');
  assert.equal(JSON.stringify(state.calls[1].args), JSON.stringify(['club', [{ role_id: 2, permissions: ['realm.post.submit'] }]]));
  assert.equal(view.getByRole('button', { name: 'Saving…' }).disabled, true);
  await act(async () => state.calls[1].resolve({ status: true }));
  assert.equal(state.notices[0][0], 'success');
});
test('switching acting identity clears the old configuration and ignores late responses', async () => {
  reset(); assert.equal(typeof Permissions, 'function');
  const view = render(React.createElement(Permissions, { realm }));
  state.actor = 'different-admin'; state.token = 'different-token';
  view.rerender(React.createElement(Permissions, { realm }));
  await act(async () => state.calls[0].resolve(config()));
  assert.equal(view.queryByRole('button', { name: 'Member' }), null);
  await act(async () => state.calls[1].resolve(config()));
  assert.ok(view.getByRole('button', { name: 'Member' }));
});
test('unavailable grants can be removed but cannot be added back', async () => {
  reset(); const view = render(React.createElement(Permissions, { realm }));
  const data = config(); data.catalog[1].grantable = false;
  await act(async () => state.calls[0].resolve(data));
  fireEvent.click(view.getByRole('button', { name: 'Member' }));
  const checkbox = view.getByLabelText('Publish posts without approval');
  assert.equal(checkbox.disabled, false);
  fireEvent.click(checkbox);
  assert.equal(checkbox.checked, false);
  assert.equal(checkbox.disabled, true);
});
test('role creation accepts a display name and uses server-generated identity', async () => {
  reset(); const view = render(React.createElement(Permissions, { realm }));
  await act(async () => state.calls[0].resolve(config()));
  fireEvent.click(view.getByRole('button', { name: 'Create role' }));
  fireEvent.change(view.getByLabelText('Role name'), { target: { value: 'Review team' } });
  assert.equal(view.queryByLabelText(/code/i), null);
  fireEvent.click(view.getByRole('button', { name: 'Save role' }));
  assert.equal(state.calls[1].method, 'createRealmRole');
  assert.deepEqual(state.calls[1].args, ['club', 'Review team']);
  await act(async () => state.calls[1].resolve({ id: 3, name: 'Review team' }));
  assert.equal(view.queryByRole('dialog'), null);
  assert.equal(state.calls.at(-1).method, 'getRealmPermissions');
});


test('permission names and supporting descriptions render while saves retain canonical codes', async () => {
  reset(); const view = render(React.createElement(Permissions, { realm }));
  const data = config();
  data.catalog[0] = { code: 'realm.post.submit', permission: 'realm.post.submit', name: 'Submit community posts', description: 'Submit posts for review when required.', grantable: true };
  await act(async () => state.calls[0].resolve(data));
  fireEvent.click(view.getByRole('button', { name: 'Member' }));
  assert.ok(view.getByRole('checkbox', { name: 'Submit community posts' }));
  assert.ok(view.getByText('Submit posts for review when required.'));
  fireEvent.click(view.getByRole('checkbox', { name: 'Submit community posts' }));
  fireEvent.click(view.getByRole('button', { name: 'Save permissions' }));
  assert.deepEqual(Array.from(state.calls[1].args[1][0].permissions), ['realm.post.publish']);
});

test('matrix403 falls back to current scoped roles without offering permission edits', async () => {
  reset(); const view = render(React.createElement(Permissions, { realm }));
  await act(async () => state.calls[0].reject({ response: { status: 403 } }));
  assert.equal(state.calls[1]?.method, 'GetRoleDefinitionsRequest');
  assert.equal(state.calls[1]?.args[0], 'club');
  await act(async () => state.calls[1].resolve(config().roles.map(role => ({ ...role, permissions_editable: false }))));
  assert.ok(view.getByRole('button', { name: 'Member' }));
  assert.equal(view.queryByRole('button', { name: 'Save permissions' }), null);
  assert.equal(state.errors.length, 0);
});
