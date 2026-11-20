const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { load, React, render, cleanup } = require('./realm-management-fixture.cjs');
afterEach(cleanup);
const tabs = load('app/tabs/realms/manage/manageTabs.ts');
test('an invite-only community delegate has a Members destination without roster authority', () => {
 assert.deepEqual(Array.from(tabs.manageRealmTabs({ type:'community', capabilities:{can_invite_members:true}}), x=>x.key), ['members']);
});

for (const compact of [true, false]) {
 test(`public inherited channel membership keeps Remove and Leave hidden (compact=${compact})`, () => {
  const panels = [];
  const Members = load('app/tabs/realms/tabs/Members.tsx', {
   '@/app/widgets/members/RoleSelect': { __esModule: true, default: () => null },
   '@/reusables/hooks/useRoleDefinitions': { useRoleDefinitions: () => ({ roles: [] }) },
   '@/reusables/vars/roles': { canInviteWithRole: () => true, defaultRole: () => undefined },
   '@/app/widgets/invites/CommunityRequests': { __esModule: true, default: () => null },
   '@/reusables/hooks/communityState': { canManageCommunitySettings: () => true, canReviewCommunityRequests: () => false },
   '@/app/widgets/members/ContactMember': { __esModule: true, default: () => null },
   '@/app/widgets/members/RealmMembers': { __esModule: true, default: props => { panels.push(props); return null; } },
   '@/app/widgets/invites/InvitePeople': { __esModule: true, default: () => null },
   '@/app/widgets/invites/invites': {},
  }).default;
  render(React.createElement(Members, { compact, realm: { id:'channel',realm_id:'channel',type:'channel',is_private:false,
    my_role:'owner',capabilities:{can_view_members:true,can_remove_members:true,can_assign_roles:true} } }));
  assert.ok(Array.from(panels.at(-1).hide).includes('remove-user-btn'));
 });
}
