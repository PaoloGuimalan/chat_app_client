const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./realm-management-fixture.cjs');
const { manageRealmTabs, canManageRealm } = load('app/tabs/realms/manage/manageTabs.ts');

for (const type of ['community', 'page', 'server', 'group', 'channel', 'voice', 'conference']) {
  test(`${type} management exposes Permissions to a capable custom manager only`, () => {
    const realm = { type, is_admin: false, capabilities: { can_manage: true, can_manage_roles: true } };
    assert.equal(canManageRealm(realm), true);
    assert.ok(manageRealmTabs(realm).some(tab => tab.key === 'permissions'));
    assert.equal(manageRealmTabs({ ...realm, capabilities: {} }).some(tab => tab.key === 'permissions'), false);
    assert.equal(manageRealmTabs({ ...realm, capabilities: undefined, is_admin: true }).some(tab => tab.key === 'permissions'), false);
    if (type !== 'community') {
      const tabs = manageRealmTabs({ ...realm, capabilities: { ...realm.capabilities, can_review_posts: true,
        can_view_notifications: true, can_archive_community_posts: true } });
      assert.equal(tabs.some(tab => ['approvals', 'archived', 'notifications'].includes(tab.key)), false);
    }
  });
}
