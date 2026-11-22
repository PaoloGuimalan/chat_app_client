const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { load, React, render, fireEvent, cleanup } = require('./realm-management-fixture.cjs');
const router = require('react-router-dom');
afterEach(cleanup);

for (const width of [390, 1280]) {
  test(`Manage Realm back returns to the previous browser entry at ${width}px`, () => {
    const overrides = {
      'react-router-dom': router,
      'react-redux': { useSelector: fn => fn({ screensizelistener: { W: width } }) },
      'framer-motion': { motion: { div: ({ children, className }) => React.createElement('div', { className }, children) } },
      '@/app/reusables/CommunityName': { __esModule: true, default: () => 'Club' },
      '@/reusables/design': { Avatar: () => null },
      './manageTabs': load('app/tabs/realms/manage/manageTabs.ts'),
      './section/RealmLifecycle': { __esModule: true, default: () => null },
    };
    for (const tab of ['Dashboard', 'Details', 'Media', 'CommunityArchive', 'Members', 'Followers', 'Notifications', 'Permissions', 'Approvals']) {
      overrides[`../tabs/${tab}`] = { __esModule: true, default: () => React.createElement('div', null, tab) };
    }
    const ManageRealm = load('app/tabs/realms/manage/ManageRealm.tsx', overrides).default;
    function Location() { return React.createElement('output', null, router.useLocation().pathname); }
    const view = render(React.createElement(router.MemoryRouter, {
      initialEntries: ['/communities', '/realms/club/'], initialIndex: 1,
    }, React.createElement(Location), React.createElement(router.Routes, null,
      React.createElement(router.Route, { path: '/communities', element: React.createElement('div', null, 'Directory') }),
      React.createElement(router.Route, { path: '/realms/:realm/*', element: React.createElement(ManageRealm, { realm: {
        id: 'club', name: 'Club', type: 'community', capabilities: { can_manage: true, can_update_realm: true },
      } }) }))));
    fireEvent.click(view.getByRole('button', { name: 'Back' }));
    assert.equal(view.getByRole('status').textContent, '/communities');
  });
}
