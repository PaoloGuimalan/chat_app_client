const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function connect() {
  const sources = [];
  const relayed = [];
  let token = 'fixture';
  class PreviewEvent {
    constructor(type, options) {
      this.type = type;
      this.detail = options.detail;
    }
  }
  class Source {
    constructor() {
      this.listeners = new Map();
      sources.push(this);
    }
    addEventListener(event, callback) {
      this.listeners.set(event, callback);
    }
    close() {}
    emit(event, payload) {
      this.listeners.get(event)?.({ data: JSON.stringify(payload) });
    }
  }
  const filename = path.join(__dirname, '../src/reusables/hooks/sse.ts');
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module,
    exports: module.exports,
    require: (name) => {
      if (name === 'jwt-encode') return () => 'fixture-token';
      if (name.includes('env_configs')) return { __esModule: true, default: {} };
      return {};
    },
    localStorage: { getItem: () => token },
    EventSource: Source,
    CustomEvent: PreviewEvent,
    document: { dispatchEvent: (event) => relayed.push(event) },
  });
  module.exports.SSENotificationsTRequest(() => {}, [], {});
  return { source: sources[0], relayed, setToken: value => token = value };
}

test('community membership signals relay current realm data without messaging actions', () => {
  const { source, relayed } = connect();
  for (const event of ['community_access_changed', 'community_members_changed', 'community_requests_changed', 'community_notifications_changed', 'community_posts_changed']) {
    source.emit(event, { auth: true, status: true, realm_id: 'garden' });
    assert.equal(relayed.at(-1)?.type, 'community-changed');
    assert.equal(relayed.at(-1)?.detail.realm_id, 'garden');
    assert.equal(relayed.at(-1)?.detail.event, event);
  }
  assert.equal(relayed.length, 5);
  source.emit('community_access_changed', { auth: false, status: true, realm_id: 'garden' });
  source.emit('community_access_changed', { auth: true, status: false, realm_id: 'garden' });
  source.emit('community_access_changed', { auth: true, status: true });
  assert.doesNotThrow(() => source.listeners.get('community_access_changed')({ data: 'invalid' }));
  assert.equal(relayed.length, 5);
});

test('late community review signals cannot revive a previous acting identity', () => {
  const { source, relayed, setToken } = connect();
  setToken('different-entity');
  source.emit('community_posts_changed', { auth: true, status: true, result: { realm_id: 'club', target_id: 'post', approval: 2 } });
  assert.equal(relayed.length, 0);
});

test('community access revalidates on a reconnected notification stream', () => {
  const { source, relayed } = connect();
  source.emit('open');
  assert.equal(relayed.length, 0);
  source.emit('open');
  assert.equal(relayed.length, 1);
  assert.equal(relayed[0].type, 'community-changed');
  assert.equal(relayed[0].detail.event, 'reconnected');
});

test('management notifications relay the Redis bridge result envelope', () => {
  const { source, relayed } = connect();
  const payload = {
    auth: true,
    status: true,
    message: 'Community notifications changed',
    result: {
      realm_id: 'garden',
      community_entity_id: 'garden-entity',
      type: 'community_admin_activity',
    },
  };
  source.emit('community_notifications_changed', payload);
  assert.equal(relayed.length, 1);
  assert.equal(relayed[0].detail.realm_id, 'garden');
  assert.equal(relayed[0].detail.community_entity_id, 'garden-entity');
  assert.equal(relayed[0].detail.event, 'community_notifications_changed');

  source.emit('community_notifications_changed', { ...payload, auth: false });
  source.emit('community_notifications_changed', { ...payload, status: false });
  assert.equal(relayed.length, 1);
});

test('personal preview changes use their own signal and never refresh the management inbox', () => {
  const { source, relayed } = connect();
  const payload = { auth: true, status: true, result: { realm_id: 'garden', community_entity_id: 'garden-entity', type: 'community_admin_activity' } };
  source.emit('community_admin_preview_changed', payload);
  assert.equal(relayed.length, 1);
  assert.equal(relayed[0].type, 'personal-notifications-changed');
  assert.equal(relayed[0].detail.event, 'community_admin_preview_changed');
  source.emit('community_admin_preview_changed', { ...payload, auth: false });
  source.emit('community_admin_preview_changed', { ...payload, status: false });
  assert.equal(relayed.length, 1);
});
