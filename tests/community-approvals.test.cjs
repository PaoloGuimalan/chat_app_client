const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { load, state, reset, React, render, fireEvent, act, cleanup } = require('./realm-management-fixture.cjs');
afterEach(cleanup);
const Approvals = load('app/tabs/realms/tabs/Approvals.tsx').default;
const realm = { id: 'club', realm_id: 'club', entity: 'community', type: 'community', capabilities: { can_review_posts: true } };
const submission = { approval: 0, content_version: '2026-11-16T00:00:00+00:00', decision: null,
  post: { post_id: 'post', caption: 'Pending contribution', is_owner: false, community: { entity_id: 'community' } } };
const page = (results = [submission]) => ({ results, count: results.length, next: null, counts: { posts: results.length } });
test('a post-only reviewer sees the reused read-only card and cannot inspect join/invitation sections', async () => {
  reset(); assert.equal(typeof Approvals, 'function');
  const view = render(React.createElement(Approvals, { realm }));
  await act(async () => state.calls[0].resolve(page()));
  assert.equal(view.getByText('Pending contribution').getAttribute('data-read-only'), 'true');
  assert.equal(view.queryByRole('button', { name: /Join requests/ }), null);
  assert.equal(view.queryByRole('button', { name: /Invitations/ }), null);
  fireEvent.click(view.getByRole('button', { name: 'Reject post' }));
  const confirm = view.getByRole('button', { name: 'Reject submission' });
  assert.equal(confirm.disabled, true);
  fireEvent.change(view.getByLabelText('Reason for the author'), { target: { value: 'Outside our topic' } });
  fireEvent.click(confirm);
  assert.equal(state.calls[1].method, 'reviewCommunityPost');
  assert.equal(JSON.stringify(state.calls[1].args), JSON.stringify(['club', 'post', {
    action: 'reject', expected_approval: 0, expected_version: submission.content_version, reason: 'Outside our topic',
  }]));
  await act(async () => state.calls[1].resolve({ status: true }));
  assert.equal(view.queryByText('Pending contribution'), null);
});
test('stale review conflicts use the global alert and reload the authoritative queue', async () => {
  reset(); assert.equal(typeof Approvals, 'function');
  const view = render(React.createElement(Approvals, { realm }));
  await act(async () => state.calls[0].resolve(page()));
  fireEvent.click(view.getByRole('button', { name: 'Approve post' }));
  fireEvent.click(view.getByRole('button', { name: 'Approve' }));
  const error = { response: { status: 409, data: { detail: 'This submission changed.' } } };
  await act(async () => state.calls[1].reject(error));
  assert.equal(state.errors[0][0], error);
  assert.equal(view.queryByText('Pending contribution'), null);
  assert.equal(state.calls.at(-1).method, 'listCommunityApprovals');
});
