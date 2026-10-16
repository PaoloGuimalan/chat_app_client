const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const file = path.join(__dirname, '../src/reusables/hooks/postEditing.ts');
const exports_ = {};
const source = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: exports_ });
const { editablePostMedia, postMediaDraft, postEditDirty, postEditFields } = exports_;
const post = { post_id: 'p', caption: 'Original', content_type: 'media', is_shared: false,
  references: [{ reference_id: 'a', reference: '/a.jpg', reference_media_type: 'image/jpeg', reference_name: 'a.jpg' },
    { reference_id: 'b', reference: '/b.mp4', reference_media_type: 'video/mp4', reference_name: 'b.mp4' }] };
const plain = value => JSON.parse(JSON.stringify(value));

test('unchanged content and restored edits are clean; caption changes send only caption', () => {
  assert.equal(typeof postEditDirty, 'function');
  const media = postMediaDraft(post);
  assert.equal(postEditDirty(post, 'Original', media), false);
  assert.deepEqual(plain(postEditFields(post, 'Revised', media)), { caption: 'Revised' });
  assert.equal(postEditDirty(post, 'Original', media), false);
});

test('removed files are omitted; retained IDs stay; only fresh uploads use URL', () => {
  const kept = postMediaDraft(post).slice(0, 1);
  const media = [...kept, { key: 'new', src: 'blob:new', mime: 'image/jpeg', name: 'new.jpg', uploadedUrl: '/fresh.jpg' }];
  assert.equal(postEditDirty(post, 'Original', media), true);
  assert.deepEqual(plain(postEditFields(post, 'Original', media)), { references: [{ reference_id: 'a' }, { url: '/fresh.jpg' }] });
  assert.deepEqual(plain(postEditFields(post, 'Original', [])), { references: [] });
});

test('profile, cover and shared media stay immutable while caption can change', () => {
  for (const special of [{ content_type: 'profile' }, { content_type: 'cover_photo' }, { content_type: 'shared_post', is_shared: true }]) {
    const fixed = { ...post, ...special };
    assert.equal(editablePostMedia(fixed), false);
    assert.deepEqual(plain(postEditFields(fixed, 'Revised', [])), { caption: 'Revised' });
  }
});

test('new local files require upload completion before a manifest can be sent', () => {
  const media = [{ key: 'new', src: 'blob:new', mime: 'image/jpeg', name: 'new.jpg' }];
  assert.throws(() => postEditFields(post, 'Original', media), /upload/i);
});

function updatesFixture() {
  const api = {}, storage = { token: 'session-a' };
  const code = fs.readFileSync(path.join(__dirname, '../src/reusables/hooks/postUpdates.ts'), 'utf8');
  vm.runInNewContext(ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    exports: api, localStorage: { getItem: () => storage.token },
    require: () => ({ useRef: current => ({ current }), useEffect: effect => effect() }),
  });
  return { ...api, storage };
}

test('editing then archiving does not replay an obsolete archive flag on remount', () => {
  const f = updatesFixture();
  f.publishPostUpdate({ post_id: 'p', caption: 'Edited', is_archived: false }, 'session-a');
  let remounted = { ...post, is_archived: true };
  f.usePostUpdate(remounted, patch => { remounted = { ...remounted, ...patch }; });
  assert.equal(remounted.caption, 'Edited');
  assert.equal(remounted.is_archived, true);
});

test('newer fetched content wins over an older cached edit', () => {
  const f = updatesFixture();
  f.publishPostUpdate({ post_id: 'p', caption: 'Earlier edit', updated_at: '2026-10-16T01:00:00Z' }, 'session-a');
  let fresh = { ...post, caption: 'Latest server edit', updated_at: '2026-10-16T02:00:00Z' };
  f.usePostUpdate(fresh, patch => { fresh = { ...fresh, ...patch }; });
  assert.equal(fresh.caption, 'Latest server edit');
});

test('session changes clear cached patches and ignore late saves from the former identity', () => {
  const f = updatesFixture();
  f.publishPostUpdate({ post_id: 'p', caption: 'Prior identity edit' }, 'session-a');
  f.storage.token = 'session-b';
  let changes = 0;
  f.usePostUpdate(post, () => { changes++; });
  f.publishPostUpdate({ post_id: 'p', caption: 'Late response' }, 'session-a');
  assert.equal(changes, 0);
});
