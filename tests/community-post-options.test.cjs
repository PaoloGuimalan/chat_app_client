const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { load, state, reset, React, render, fireEvent, act, cleanup } = require('./realm-management-fixture.cjs');
afterEach(cleanup);
const patches = [];
const PostOptions = load('app/tabs/profile/user/PostOptions.tsx', {
  'react-dom': { createPortal: child => child },
  '@/reusables/hooks/postUpdates': { publishPostUpdate: (patch, token) => patches.push({ patch, token }) },
}).default;
const post = { post_id: 'post', caption: 'Contribution', entity: { id: 'community', details: {} }, is_owner: false,
  tagging: [], on_feed: 'feed', approval: 1, updated_at: null, date_posted: '2026-11-16T00:00:00+00:00',
  community: { realm_id: 'club', entity_id: 'community', is_member: true } };
function mount(value = post) {
  reset(); patches.length = 0;
  return render(React.createElement(PostOptions, { post: value, onProcess() {}, onFinish() {}, onError() {} }));
}
test('community-authored archive actions use delegated archive without pretending to own the post', async () => {
  const view = mount();
  fireEvent.click(view.getByRole('button', { name: 'Post options' }));
  assert.equal(state.calls[0]?.method, 'getCommunity');
  await act(async () => state.calls[0].resolve({ result: { capabilities: { can_archive_community_posts: true } } }));
  fireEvent.click(view.getByText('Archive'));
  assert.equal(state.calls[1].method, 'archiveCommunityPost');
  assert.deepEqual(state.calls[1].args, ['club', 'post', true]);
  await act(async () => state.calls[1].resolve({ status: true }));
  assert.equal(view.queryByText('Edit post'), null);
  assert.equal(view.queryByText('Delete'), null);
});
test('member takedown captures the reviewed version and invalidates mounted post copies', async () => {
  const memberPost = { ...post, entity: { id: 'member', details: {} } };
  const view = mount(memberPost);
  fireEvent.click(view.getByRole('button', { name: 'Post options' }));
  assert.equal(state.calls[0]?.method, 'getCommunity');
  await act(async () => state.calls[0].resolve({ result: { capabilities: { can_take_down_posts: true } } }));
  fireEvent.click(view.getByText('Take down post'));
  fireEvent.change(view.getByLabelText('Reason for the author'), { target: { value: 'Outside our topic' } });
  fireEvent.click(view.getByRole('button', { name: 'Confirm takedown' }));
  assert.equal(state.calls[1].method, 'reviewCommunityPost');
  assert.equal(state.calls[1].args[2].expected_version, post.date_posted);
  assert.equal(state.calls[1].args[2].action, 'takedown');
  await act(async () => state.calls[1].resolve({ status: true }));
  assert.equal(patches[0].patch.approval, 2);
});
