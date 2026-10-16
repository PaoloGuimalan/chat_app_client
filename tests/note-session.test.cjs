const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/app/tabs/profile/notes/noteSession.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const settle = () => new Promise(resolve => setImmediate(resolve));
function fixture() {
  let now = 0, id = 0;
  const timers = new Map();
  const exports = {};
  vm.runInNewContext(source, { exports, structuredClone, Date: class extends Date { static now() { return now; } }, setTimeout: (fn, ms) => { timers.set(++id, { fn, due: now + ms }); return id; }, clearTimeout: timer => timers.delete(timer) });
  return { ...exports, async tick(ms) { now += ms; for (const [key, timer] of timers) if (timer.due <= now) { timers.delete(key); timer.fn(); } await settle(); } };
}
const saved = (value, previous) => ({ ...structuredClone(value), id: previous?.id || 'note-1', entity_id: 'entity-a', version: (previous?.version || 0) + 1, sort: 1, created_at: '2026-10-15T00:00:00Z', updated_at: '2026-10-15T00:00:00Z' });
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };

test('title-only and body-only save after precisely 2000ms; empty markup never creates', async () => {
  const f = fixture(); let writes = 0;
  const save = async (value, previous) => { writes++; return saved(value, previous); };
  const session = new f.NoteSession(null, save);
  session.change({ title: '', content: '<p><br></p>', attachments: [] });
  assert.equal(session.dirty, false);
  await f.tick(5000); assert.equal(writes, 0);
  session.change({ title: 'A title', content: '', attachments: [] });
  await f.tick(1999); assert.equal(writes, 0);
  await f.tick(1); assert.equal(writes, 1); assert.equal(session.state, 'Saved');
  const body = new f.NoteSession(null, save);
  body.change({ title: '', content: '<p>Body only</p>', attachments: [] });
  await f.tick(2000); assert.equal(writes, 2); assert.equal(body.note.title, '');
  assert.equal(f.hasNoteValue({ title: '\u200b', content: '<script>alert(1)</script><p>&#8203;</p>', attachments: [] }), false);
  assert.equal(f.plainText('<p>R&amp;D &lt;3 &quot;ideas&quot;</p>'), 'R&D <3 "ideas"');
});

test('typing during a request retains newer text and waits 2000ms from that edit', async () => {
  const f = fixture(), pending = deferred(); const calls = [];
  const session = new f.NoteSession(null, (value, previous) => { calls.push({ value: structuredClone(value), previous }); return calls.length === 1 ? pending.promise : Promise.resolve(saved(value, previous)); });
  session.change({ title: 'First', content: '', attachments: [] });
  await f.tick(2000); assert.equal(calls.length, 1);
  await f.tick(500); session.change({ ...session.value, content: '<p>Later typing</p>' });
  await f.tick(300); pending.resolve(saved(calls[0].value, null)); await settle();
  assert.equal(session.value.content, '<p>Later typing</p>'); assert.equal(calls.length, 1);
  await f.tick(1699); assert.equal(calls.length, 1);
  await f.tick(1); assert.equal(calls.length, 2); assert.equal(calls[1].previous.version, 1); assert.equal(session.state, 'Saved');
});

test('explicit leave flush drains newer changes serially without duplicate creates', async () => {
  const f = fixture(), pending = deferred(); const calls = [];
  const session = new f.NoteSession(null, (value, previous) => { calls.push({ value: structuredClone(value), previous }); return calls.length === 1 ? pending.promise : Promise.resolve(saved(value, previous)); });
  session.change({ title: 'First', content: '', attachments: [] });
  const first = session.flush(); await settle();
  session.change({ ...session.value, title: 'Second' });
  const leave = session.flush(); assert.equal(calls.length, 1);
  pending.resolve(saved(calls[0].value, null));
  assert.equal(await first, true); assert.equal(await leave, true);
  assert.equal(calls.length, 2); assert.equal(calls[1].previous.id, 'note-1'); assert.equal(session.note.version, 2);
});

test('a new edit retries a failed autosave after its own idle delay', async () => {
  const f = fixture(); let writes = 0;
  const session = new f.NoteSession(null, async (value, previous) => { if (++writes === 1) throw new Error('offline'); return saved(value, previous); });
  session.change({ title: 'Keep this', content: '', attachments: [] });
  await f.tick(2000); assert.equal(session.state, "Couldn't save");
  session.change({ ...session.value, content: '<p>Also keep this</p>' });
  assert.equal(session.state, 'Unsaved changes'); await f.tick(1999); assert.equal(writes, 1);
  await f.tick(1); assert.equal(writes, 2);
  assert.equal(await session.flush(true), true); assert.equal(session.note.content, '<p>Also keep this</p>');
});

test('title whitespace and formatting-only changes autosave; manual save skips the debounce', async () => {
  const f = fixture(); const calls = [];
  const note = saved({ title: 'Title', content: '<p>Body</p>', attachments: [] }, null);
  const session = new f.NoteSession(note, async (value, previous) => { calls.push(value); return saved(value, previous); });
  session.change({ ...session.value, title: 'Title ' });
  await f.tick(2000); assert.equal(calls.length, 1);
  session.change({ ...session.value, content: '<p><strong>Body</strong></p>' });
  assert.equal(await session.flush(true), true);
  assert.equal(calls.length, 2); assert.equal(calls[1].content, '<p><strong>Body</strong></p>');
  await f.tick(4000); assert.equal(calls.length, 2);
});

test('409 never silently overwrites; restored conflict stays paused', async () => {
  const f = fixture(); let writes = 0;
  const note = saved({ title: 'Remote', content: '', attachments: [] }, null);
  const session = new f.NoteSession(note, async () => { writes++; throw { response: { status: 409 } }; });
  session.change({ ...session.value, title: 'My copy' });
  await f.tick(2000); assert.equal(session.state, 'Conflict');
  assert.equal(await session.flush(true), false); assert.equal(writes, 1); assert.equal(session.value.title, 'My copy');
  const recovered = new f.NoteSession(note, async () => { writes++; return note; });
  recovered.recover(session.value, true); await f.tick(5000); assert.equal(writes, 1); assert.equal(recovered.conflict, true);
});

test('undo and redo affect only body and preserve current title and attachments', () => {
  const f = fixture(); const session = new f.NoteSession(null, async value => saved(value, null));
  session.change({ title: 'Title', content: '', attachments: [] });
  assert.equal(session.canUndo, false);
  session.change({ ...session.value, content: '<p>Body</p>' });
  const files = [{ url: 'https://files.test/a', file_name: 'a.pdf', file_type: 'application/pdf' }];
  session.change({ ...session.value, title: 'Current title', attachments: files });
  session.undo(); assert.equal(session.value.content, ''); assert.equal(session.value.title, 'Current title');
  assert.equal(session.value.attachments, files); assert.equal(session.canUndo, false);
  session.redo(); assert.equal(session.value.content, '<p>Body</p>');
  assert.equal(session.value.title, 'Current title'); assert.equal(session.value.attachments, files); session.stop();
});

test('server attachment ids do not produce phantom dirty follow-up saves', async () => {
  const f = fixture(), pending = deferred(); let writes = 0;
  const save = (value, previous) => { writes++; return writes === 1 ? pending.promise : Promise.resolve(saved(value, previous)); };
  const session = new f.NoteSession(null, save);
  session.change({ title: 'Upload', content: '', attachments: [{ url: 'https://files.test/a', file_name: 'a.pdf', file_type: 'application/pdf' }] });
  await f.tick(2000); session.change({ ...session.value, title: 'Upload edited' });
  pending.resolve(saved({ title: 'Upload', content: '', attachments: [{ id: 'file-a', url: 'https://files.test/a', file_name: 'a.pdf', file_type: 'application/pdf' }] }, null)); await settle();
  await f.tick(2000); assert.equal(writes, 2); assert.equal(session.dirty, false);
  await f.tick(9000); assert.equal(writes, 2);
});

test('a retained session can retry with refreshed credentials for the same entity', async () => {
  const f = fixture(); const used = [];
  const session = new f.NoteSession(null, async () => { used.push('old-token'); throw new Error('expired'); });
  session.change({ title: 'Keep', content: '', attachments: [] }); await f.tick(2000);
  session.rebind(async (value, previous) => { used.push('new-token'); return saved(value, previous); });
  assert.equal(await session.flush(true), true); assert.deepEqual(used, ['old-token', 'new-token']);
});
