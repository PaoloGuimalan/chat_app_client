const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const api={};
const file=require('node:path').join(__dirname,'../src/reusables/hooks/communityState.ts');
if(fs.existsSync(file)) vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:api});
test('private access and contribution require authoritative membership',()=>{
 assert.equal(api.canReadCommunity({is_private:true,is_member:false}),false);
 assert.equal(api.canReadCommunity({is_private:false,is_member:false}),true);
 assert.equal(api.canContributeCommunity({is_member:false}),false);
 assert.equal(api.canContributeCommunity({is_member:true}),true);
});
test('destination selection rejects unjoined and stale communities',()=>{
 const joined={entity_id:'one',is_member:true};
 assert.equal(api.selectedCommunity([joined,{entity_id:'two',is_member:false}],'one'),joined);
 assert.equal(api.selectedCommunity([joined],'two'),null);
 assert.equal(api.selectedCommunity([{entity_id:'two',is_member:false}],'two'),null);
});
test('reaction identity is omitted until deliberately changed, including named false',()=>{
 assert.equal(api.reactionIdentity(undefined),undefined);
 assert.equal(api.reactionIdentity(true),true);
 assert.equal(api.reactionIdentity(false),false);
});
test('community request review is available to moderators but settings require admins',()=>{
 assert.equal(api.canReviewCommunityRequests('moderator'),true);
 assert.equal(api.canReviewCommunityRequests('member'),false);
 assert.equal(api.canManageCommunitySettings('moderator'),false);
 assert.equal(api.canManageCommunitySettings('admin'),true);
 assert.equal(api.canManageCommunitySettings('owner'),true);
});
