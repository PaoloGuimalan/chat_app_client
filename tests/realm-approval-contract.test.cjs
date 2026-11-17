const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, client) {
  const module = { exports: {} };
  const source = fs.readFileSync(path.join(__dirname, '../src', file), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText,
    { module, exports: module.exports, localStorage: { getItem: () => 'acting-page-token' },
      require: name => name.endsWith('requests') ? { firstPartyClient: client } : { __esModule: true, default: { USER_SERVICE_API: 'https://fixture.invalid' } } });
  return module.exports;
}

test('approval, permission and author requests preserve exact acting scope, versions and API errors', async () => {
  const calls = [];
  const client = Object.fromEntries(['get', 'post', 'put', 'delete'].map(method => [method, async (...args) => {
    calls.push([method, ...args]); return { data: { status: true, result: {}, data: {}, results: [] } };
  }]));
  const api = load('reusables/hooks/communityRequests.ts', client);
  assert.equal(typeof api.listCommunityApprovals, 'function');
  await api.listCommunityApprovals('club', { kind: 'posts', state: 'not_approved', page: 2 });
  const review = { action: 'reject', expected_approval: 0, expected_version: '2026-11-16T00:00:00+00:00', reason: 'Outside our topic' };
  await api.reviewCommunityPost('club', 'post/one', review);
  await api.reviewCommunityInvitation('club', 'invites', 'invite', 'approve', 'for_approval');
  await api.getRealmPermissions('club');
  await api.saveRealmPermissions('club', [{ role_id: 2, permissions: ['realm.post.submit'] }]);
  await api.createRealmRole('club', 'Post Reviewer', ['realm.post.review']);
  await api.updateRealmRole('club', 3, { name: 'Review team' });
  await api.deleteRealmRole('club', 3);
  await api.listAuthorSubmissions({ page: 2 });
  await api.getAuthorSubmission('post/one');
  await api.getRealmReviewDecision('cb48b3df-bd09-44b5-b218-b47f1afce820');
  await api.listCommunityArchive('club', 1);
  await api.archiveCommunityPost('club', 'post/one', true);
  assert.deepEqual(calls.map(row => [row[0], row[1].replace('https://fixture.invalid', '')]), [
    ['get', '/api/realm/communities/club/approvals'], ['post', '/api/realm/communities/club/approvals/posts/post%2Fone'],
    ['post', '/api/realm/communities/club/approvals/invites/invite'], ['get', '/api/realm/realms/club/permissions'],
    ['put', '/api/realm/realms/club/permissions'], ['post', '/api/entity/roles'], ['put', '/api/entity/roles/3'],
    ['delete', '/api/entity/roles/3'], ['get', '/api/newsfeed/submissions'], ['get', '/api/newsfeed/submissions/post%2Fone'],
    ['get', '/api/entity/realm-review/cb48b3df-bd09-44b5-b218-b47f1afce820/'], ['get', '/api/realm/communities/club/archive'],
    ['post', '/api/realm/communities/club/archive/post%2Fone'],
  ]);
  assert.equal(JSON.stringify(calls[1][2]), JSON.stringify(review));
  assert.equal(calls[2][2].expected_status, 'for_approval');
  assert.equal(calls[5][2].realm_id, 'club');
  assert.equal(Object.hasOwn(calls[5][2], 'code'), false);
  for (const [method, , body, options] of calls) {
    const config = method === 'get' || method === 'delete' ? body : options;
    assert.equal(config.headers['x-access-token'], 'acting-page-token');
  }
  const failure = { response: { status: 409, data: { detail: 'This submission has changed.' } } };
  const failing = load('reusables/hooks/communityRequests.ts', { post: async () => { throw failure; } });
  await assert.rejects(failing.reviewCommunityPost('club', 'post', review), error => error === failure);
});
