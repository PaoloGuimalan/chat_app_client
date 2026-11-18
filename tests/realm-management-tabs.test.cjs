const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./realm-management-fixture.cjs');
const tabs = load('app/tabs/realms/manage/manageTabs.ts');
test('custom reviewers receive only their permitted community management destinations', () => {
  assert.equal(typeof tabs.manageRealmTabs, 'function');
  const realm = { type: 'community', capabilities: { can_manage: true, can_review_posts: true, can_view_notifications: true } };
  assert.deepEqual(Array.from(tabs.manageRealmTabs(realm), row => row.key), ['notifications', 'approvals']);
  assert.equal(tabs.canManageRealm(realm), true);
  assert.equal(tabs.canManageRealm({ ...realm, capabilities: { can_manage: false } }), false);
});
test('server/page management retains its existing destinations and community Owner gets configuration', () => {
  assert.equal(typeof tabs.manageRealmTabs, 'function');
  assert.deepEqual(Array.from(tabs.manageRealmTabs({ type: 'server', is_admin: true }), row => row.key), ['dashboard', 'details', 'media', 'members']);
  assert.deepEqual(Array.from(tabs.manageRealmTabs({ type: 'page', is_admin: true }), row => row.key), ['dashboard', 'details', 'media', 'members', 'followers']);
  const realm = { type: 'community', capabilities: { can_manage: true, can_manage_permissions: true } };
  assert.deepEqual(Array.from(tabs.manageRealmTabs(realm), row => row.key), ['permissions']);
});


test('community archive has its own management entry for archive delegates only', () => {
  const realm = { type: 'community', capabilities: { can_manage: true, can_archive_community_posts: true } };
  assert.deepEqual(Array.from(tabs.manageRealmTabs(realm), row => row.key), ['archived']);
  assert.deepEqual(Array.from(tabs.manageRealmTabs({ ...realm, capabilities: { can_update_media: true } }), row => row.key), ['media']);
  assert.deepEqual(Array.from(tabs.manageRealmTabs({ ...realm, capabilities: {} }), row => row.key), []);
});
