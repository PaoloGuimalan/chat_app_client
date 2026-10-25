const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, require_) {
  const api = {};
  const source = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText, { exports: api, require: require_, localStorage: { getItem: () => 'fixture-token' } });
  return api;
}
const identity = load(path.join(__dirname, '../src/reusables/hooks/contributionIdentity.ts'));
test('server ownership is authoritative and anonymous replies never mention a real actor', () => {
  const own = { entity: null, is_anonymous: true, is_owner: true };
  assert.equal(identity.ownsContribution(own, 'viewer'), true);
  assert.equal(identity.replyMentionFor(own, 'viewer'), null);
  assert.equal(identity.replyMentionFor({ ...own, is_owner: false }, 'viewer'), null);
  const named = { entity: { id: 'viewer', details: { username: 'viewer' } } };
  assert.equal(identity.ownsContribution(named, 'viewer'), true);
  assert.equal(identity.ownsContribution({ ...named, is_owner: false }, 'viewer'), false);
  assert.equal(identity.replyMentionFor({ entity: { id: 'other', details: { slug: 'page' } } }, 'viewer'), 'page');
  assert.equal(identity.contributionAuthor({ ...named, is_anonymous: true }), null);
  assert.equal(identity.ownsContribution({ entity: { id: '', details: {} } }, ''), false);
});
test('community lifecycle uses the existing signed client and exact backend endpoints', async () => {
  const calls = [];
  const response = { status: true, result: { realm_id: 'realm', entity_id: 'community', name: 'Garden' } };
  const client = { get: async (...args) => { calls.push(['get', ...args]); return { data: response }; }, post: async (...args) => { calls.push(['post', ...args]); return { data: response }; } };
  const api = load(path.join(__dirname, '../src/reusables/hooks/communityRequests.ts'), name => name.endsWith('requests') ? { firstPartyClient: client } : { __esModule: true, default: { USER_SERVICE_API: 'https://fixture.invalid' } });
  assert.equal(typeof api.listCommunities, 'function');
  await api.listCommunities({ search: 'garden', joined: true, page: 2, page_size: 10 });
  await api.getCommunity('garden club');
  await api.createCommunity({ name: 'Garden', is_private: true });
  await api.joinCommunity('realm');
  await api.leaveCommunity('realm');
  assert.deepEqual(calls.map(call => [call[0], call[1]]), [['get', 'https://fixture.invalid/api/realm/communities'], ['get', 'https://fixture.invalid/api/realm/communities/garden%20club'], ['post', 'https://fixture.invalid/api/realm/communities'], ['post', 'https://fixture.invalid/api/realm/communities/realm/join'], ['post', 'https://fixture.invalid/api/realm/communities/realm/leave']]);
  assert.equal(calls[0][2].params.joined, true);
  assert.equal(calls[0][2].headers['x-access-token'], 'fixture-token');
});
test('community errors preserve 403 and 404 for access state handling', async () => {
  for (const status of [403, 404]) {
    const cause = { response: { status, data: { detail: 'Unavailable' } } };
    const api = load(path.join(__dirname, '../src/reusables/hooks/communityRequests.ts'), name => name.endsWith('requests') ? { firstPartyClient: { get: async () => { throw cause; } } } : { __esModule: true, default: { USER_SERVICE_API: 'https://fixture.invalid' } });
    await assert.rejects(() => api.getCommunity('private'), error => error === cause);
  }
});
test('post and comment reaction updates omit identity unless explicitly selected', async () => {
  const calls = [];
  const axios = async (config) => {
    calls.push(config);
    return { data: { status: true } };
  };
  axios.interceptors = { request: { use() { } }, response: { use() { } } };
  const api = load(path.join(__dirname, '../src/reusables/hooks/requests.ts'), name => {
    if (name === 'axios')
      return { create: () => axios };
    if (name === './env_configs')
      return { __esModule: true, default: { USER_SERVICE_API: 'https://fixture.invalid' } };
    return {};
  });
  for (const [request, key] of [[api.ReactionSaveRequest, 'post_id'], [api.CommentReactionSaveRequest, 'comment_id']]) {
    await request({ [key]: 'target', emoji_id: 'smile', method: 'PUT' });
    assert.equal(Object.hasOwn(calls.at(-1).data, 'is_anonymous'), false);
    await request({ [key]: 'target', emoji_id: 'smile', method: 'PUT', is_anonymous: true });
    assert.equal(calls.at(-1).data.is_anonymous, true);
    await request({ [key]: 'target', emoji_id: 'smile', method: 'PUT', is_anonymous: false });
    assert.equal(calls.at(-1).data.is_anonymous, false);
  }
});
