const { test } = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./realm-management-fixture.cjs');
const tabs = load('app/tabs/realms/manage/manageTabs.ts');
test('an invite-only community delegate has a Members destination without roster authority', () => {
 assert.deepEqual(Array.from(tabs.manageRealmTabs({ type:'community', capabilities:{can_invite_members:true}}), x=>x.key), ['members']);
});
