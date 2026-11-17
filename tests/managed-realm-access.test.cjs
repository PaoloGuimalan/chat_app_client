const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { load, state, reset, renderHook, act, cleanup } = require('./realm-management-fixture.cjs');
afterEach(cleanup);
const { useManagedRealm } = load('app/tabs/realms/manage/useManagedRealm.ts');
test('manager context clears before a realm/entity switch and rejects late settings responses', async () => {
  reset(); const view = renderHook(({ realm }) => useManagedRealm(realm), { initialProps: { realm: 'old-club' } });
  await act(async () => state.calls[0].resolve({ data: { data: { id: 'old-club', type: 'community' } } }));
  assert.equal(view.result.current.realmInfo.id, 'old-club');
  view.rerender({ realm: 'new-club' });
  assert.equal(view.result.current.realmInfo, null);
  state.actor = 'different-admin'; state.token = 'different-token'; view.rerender({ realm: 'new-club' });
  await act(async () => state.calls[1].resolve({ data: { data: { id: 'new-club', type: 'community', name: 'Old actor' } } }));
  assert.equal(view.result.current.realmInfo, null);
  await act(async () => state.calls[2].resolve({ data: { data: { id: 'new-club', type: 'community', name: 'Current actor' } } }));
  assert.equal(view.result.current.realmInfo.name, 'Current actor');
});
