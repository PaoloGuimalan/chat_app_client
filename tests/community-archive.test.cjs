const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { load, state, reset, React, render, fireEvent, act, cleanup, within } = require('./realm-management-fixture.cjs');
afterEach(cleanup);
const Archive = load('app/tabs/realms/tabs/CommunityArchive.tsx').default;
const realm = { id: 'club', realm_id: 'club', entity: 'community', capabilities: { can_archive_community_posts: true } };
test('community archive reuses private cards and delegates restoration without author impersonation', async () => {
  reset(); assert.equal(typeof Archive, 'function');
  const view = render(React.createElement(Archive, { realm }));
  await act(async () => state.calls[0].resolve({ results: [{ post_id: 'photo', caption: 'Community photo', is_owner: false, is_archived: true }], next: null, count: 1 }));
  assert.equal(state.calls[0].method, 'listCommunityArchive');
  assert.equal(view.getByText('Community photo').getAttribute('data-read-only'), 'true');
  fireEvent.click(view.getByRole('button', { name: 'Restore post' }));
  fireEvent.click(within(view.getByRole('dialog')).getByRole('button', { name: 'Restore post' }));
  assert.equal(state.calls[1].method, 'archiveCommunityPost');
  assert.deepEqual(state.calls[1].args, ['club', 'photo', false]);
  await act(async () => state.calls[1].resolve({ status: true }));
  assert.equal(view.queryByText('Community photo'), null);
});
