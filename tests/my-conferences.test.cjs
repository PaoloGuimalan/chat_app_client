const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const f = require('./realm-management-fixture.cjs');

afterEach(() => { f.cleanup(); f.reset(); });

const owned = {
  id: 'new', name: 'Sprint planning', slug: 'sprint-planning', my_role: 'owner',
  starts_at: '2026-11-27T02:00:00Z', capabilities: { can_delete_realm: true },
};
const joined = {
  id: 'old', name: 'Design sync', slug: 'design-sync', my_role: 'member',
  starts_at: null, capabilities: { can_delete_realm: false },
};

function component(list, lifecycle = {}) {
  const Confirm = f.load('app/widgets/modals/ConfirmModal.tsx').default;
  const Panel = f.load('app/conference/MyConferences.tsx', {
    '@/reusables/hooks/requests': { GetMyRealmsRequest: list },
    '@/reusables/hooks/realmLifecycleRequests': lifecycle,
    '@/app/widgets/modals/ConfirmModal': { __esModule: true, default: Confirm },
    'react-router-dom': { Link: ({ to, ...props }) => f.React.createElement('a', { href: to, ...props }) },
  }).default;
  assert.equal(typeof Panel, 'function');
  return Panel;
}

test('renders schedule and membership labels, opens lobby links and appends older conferences', async () => {
  const calls = [];
  const Panel = component(async (page, pageSize, type) => {
    calls.push([page, pageSize, type]);
    return page === 1 ? { results: [owned], next: 'page=2' } : { results: [joined], next: null };
  });
  f.render(f.React.createElement(Panel));
  const join = await f.screen.findByRole('link', { name: 'Join Sprint planning lobby' });
  assert.equal(join.getAttribute('href'), '/conference/sprint-planning');
  assert.equal(f.screen.getByText('Scheduled').textContent, 'Scheduled');
  assert.equal(f.screen.getByText('Owner').textContent, 'Owner');
  assert.equal(document.querySelector('time').getAttribute('datetime'), owned.starts_at);
  f.fireEvent.click(f.screen.getByRole('button', { name: 'Load more conferences' }));
  await f.screen.findByRole('link', { name: 'Join Design sync lobby' });
  assert.deepEqual(f.screen.getAllByRole('link').map(link => link.textContent.trim()), ['Join', 'Join']);
  assert.deepEqual(f.screen.getAllByRole('link').map(link => link.getAttribute('href')), ['/conference/sprint-planning', '/conference/design-sync']);
  assert.equal(f.screen.getByText('Instant').textContent, 'Instant');
  assert.equal(f.screen.getByText('Member').textContent, 'Member');
  assert.deepEqual(calls.map(([page, , type]) => [page, type]), [[1, 'conference'], [2, 'conference']]);
  assert.equal(f.screen.queryByRole('button', { name: 'Delete Design sync' }), null);
});

test('uses the current realm name for typed confirmation and removes the row after acceptance', async () => {
  const calls = [];
  let deleted = false;
  const Panel = component(async () => ({ results: deleted ? [joined] : [owned, joined], next: null }), {
    getRealmLifecycle: async () => ({ realm_id: 'new', name: 'Renamed planning', owned_realm_blocker_count: 0, capabilities: { can_delete_realm: true } }),
    deleteRealm: async (...args) => { calls.push(args); deleted = true; },
  });
  f.render(f.React.createElement(Panel));
  f.fireEvent.click(await f.screen.findByRole('button', { name: 'Delete Sprint planning' }));
  const confirmation = await f.screen.findByLabelText('Enter Renamed planning to confirm');
  const confirm = f.screen.getByRole('button', { name: 'Permanently delete' });
  assert.equal(confirm.disabled, true);
  f.fireEvent.change(confirmation, { target: { value: owned.name } });
  assert.equal(confirm.disabled, true);
  f.fireEvent.change(confirmation, { target: { value: 'Renamed planning' } });
  f.fireEvent.click(confirm);
  await f.waitFor(() => assert.equal(Boolean(f.screen.queryByText('Sprint planning')), false));
  assert.deepEqual(calls, [['new', 'Renamed planning']]);
  assert.ok(f.screen.getByText('Design sync'));
});

test('keeps the row and reports the error if permanent deletion fails', async () => {
  const Panel = component(async () => ({ results: [owned], next: null }), {
    getRealmLifecycle: async () => ({ realm_id: 'new', name: owned.name, owned_realm_blocker_count: 0, capabilities: { can_delete_realm: true } }),
    deleteRealm: async () => { throw Error('Deletion refused'); },
  });
  f.render(f.React.createElement(Panel));
  f.fireEvent.click(await f.screen.findByRole('button', { name: 'Delete Sprint planning' }));
  f.fireEvent.change(await f.screen.findByLabelText('Enter Sprint planning to confirm'), { target: { value: owned.name } });
  f.fireEvent.click(f.screen.getByRole('button', { name: 'Permanently delete' }));
  await f.waitFor(() => assert.equal(f.state.errors.length, 1));
  assert.ok(f.screen.getByText('Sprint planning'));
});

test('offers retry on a list error and shows the empty state after recovery', async () => {
  let failed = false;
  const Panel = component(async () => {
    if (failed) return { results: [], next: null };
    failed = true;
    throw Error('Request failed');
  });
  f.render(f.React.createElement(Panel));
  assert.equal((await f.screen.findByRole('alert')).textContent, 'Couldn’t load conferences.');
  f.fireEvent.click(f.screen.getByRole('button', { name: 'Retry' }));
  await f.screen.findByText('You don’t have any conferences yet.');
});

test('cancels a previous profile’s list request when the panel is remounted', async () => {
  let previousRequest;
  let signal;
  const Panel = component((page, size, type, search, requestSignal) => {
    if (previousRequest) return Promise.resolve({ results: [joined], next: null });
    signal = requestSignal;
    return new Promise(resolve => { previousRequest = resolve; });
  });
  const view = f.render(f.React.createElement(Panel, { key: 'personal' }));
  view.rerender(f.React.createElement(Panel, { key: 'page' }));
  await f.screen.findByText('Design sync');
  assert.equal(signal.aborted, true);
  await f.act(async () => previousRequest({ results: [owned], next: null }));
  assert.equal(f.screen.queryByText('Sprint planning'), null);
});
