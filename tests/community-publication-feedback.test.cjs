const { test } = require('node:test');const assert = require('node:assert/strict');
const {load}=require('./realm-management-fixture.cjs');
const api=load('reusables/hooks/communityState.ts');
test('pending originals and shares acknowledge submission rather than publication',()=>{
 assert.equal(typeof api.postPublicationMessage,'function');assert.match(api.postPublicationMessage(0),/submitted for approval/i);assert.match(api.postPublicationMessage(1),/saved/i);
});
