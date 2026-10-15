/* Actual React components and Quill, served entirely by local request fixtures. */
const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://local.test/' });
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'SVGElement', 'Element', 'Node', 'Text', 'MutationObserver', 'DOMParser', 'localStorage', 'sessionStorage', 'getComputedStyle', 'Range']) global[key] = dom.window[key];
window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
window.PointerEvent = class extends window.MouseEvent { constructor(type, init = {}) { super(type, init); this.pointerId = init.pointerId || 1; this.pointerType = init.pointerType || 'mouse'; } };
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.hasPointerCapture = () => true;
global.requestAnimationFrame = fn => setTimeout(fn, 0);
global.cancelAnimationFrame = clearTimeout;
global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
global.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
window.HTMLMediaElement.prototype.pause = function() {};
global.crypto = require('node:crypto').webcrypto;
document.execCommand = () => false;
document.createRange = (() => { const create = document.createRange.bind(document); return () => { const range = create(); range.getBoundingClientRect = () => ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }); range.getClientRects = () => []; return range; }; })();
window.confirm = () => true;
localStorage.setItem('authtoken', 'fixture-token');

const React = require('react');
const { render, screen, fireEvent, waitFor, cleanup, act } = require('@testing-library/react');
const { MemoryRouter, Routes, Route } = require('react-router-dom');
const originalLoad = Module._load;
const root = path.join(__dirname, '../src');
const auth = { user: { entity_id: 'fixture-entity', username: 'owner', fullName: { firstName: 'Owner', lastName: 'Fixture' }, profile: 'none' }, active_entity_context: { id: 'fixture-entity', is_switched: false }, allowed_modules: ['module.notes.access', 'module.diary.access'] };
const sample = index => ({ id: `note-${index}`, entity_id: 'fixture-entity', title: `Note ${index}`, content: '<p>A local fixture</p>', attachments: [], version: 1, sort: 100 - index, created_at: '2026-10-15T00:00:00Z', updated_at: '2026-10-15T00:00:00Z' });
let notes = [sample(1), sample(2)], saves = [], reorders = [], moodPages = [], tagQueries = [], diaryWrites = [];
const api = {
  async list(page, search) { const filtered = notes.filter(note => `${note.title} ${note.content}`.toLowerCase().includes(search.toLowerCase())); return { count: filtered.length, next: page * 24 < filtered.length ? 'next' : null, results: structuredClone(filtered.slice((page - 1) * 24, page * 24)) }; },
  async get(id) { return structuredClone(notes.find(note => note.id === id)); },
  async save(value, previous) { saves.push(structuredClone(value)); const note = { ...sample(99), ...structuredClone(value), id: previous?.id || `created-${saves.length}`, version: (previous?.version || 0) + 1 }; notes = previous ? notes.map(item => item.id === note.id ? note : item) : [note, ...notes]; return note; },
  async reorder(id, before) { reorders.push({ id, before }); const item = notes.find(note => note.id === id); notes = notes.filter(note => note.id !== id); const index = before === null ? notes.length : notes.findIndex(note => note.id === before); notes.splice(index, 0, item); notes.forEach((note, index) => note.sort = notes.length - index); return { order: notes.map(({ id, sort }) => ({ id, sort })) }; },
  async remove(note) { notes = notes.filter(item => item.id !== note.id); },
};
const requests = {
  async GetUserEntriesRequest() { return { results: [{ id: 'design-entry', title: 'Just a quote of the day', content: '<p>Body stays in the entry reader</p>', entry_date: '2026-10-15', created_at: '2026-10-15T08:00:00Z', is_private: true, attachments: [], tag_objects: [{ id: 1, name: 'garden' }, { id: 2, name: 'bloom' }], mood: { id: 1, name: 'Hopeful', emoji: '🌟' } }], next: null }; },
  async GetMoodListRequest({ page }) { moodPages.push(page); return { results: Array.from({ length: 10 }, (_, i) => ({ id: (page - 1) * 10 + i + 1, name: `Mood ${(page - 1) * 10 + i + 1}`, emoji: '🙂' })), next: page < 2 ? 'next' : null }; },
  async GetTagsListRequest({ search }) { tagQueries.push(search); return { results: { is_new: Boolean(search), list: search ? [] : [{ id: 1, name: 'Life' }] }, next: null }; },
  firstPartyClient: { async post(url, payload) { diaryWrites.push({ url, payload }); return { data: { ...payload, id: 'entry-created', attachments: [], tag_objects: [] } }; } },
};
Module._extensions['.ts'] = Module._extensions['.tsx'] = (module, filename) => {
  const result = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } });
  module._compile(result.outputText, filename);
};
Module._extensions['.css'] = () => {};
Module._extensions['.png'] = (module, filename) => { module.exports = filename; };
Module._load = function(request, parent, isMain) {
  if (request === 'react-redux') return { useSelector: selector => selector({ authentication: auth, screensizelistener: { W: 1200, H: 844 } }) };
  if (request === './notesApi') return { notesApi: () => api };
  if (request === '@/reusables/hooks/requests') return requests;
  if (request === '@/reusables/hooks/mediaUpload') return { uploadFiles: async () => [] };
  if (request === '@/reusables/hooks/env_configs') return { __esModule: true, default: { USER_SERVICE_API: 'https://fixture.invalid' } };
  if (request === '@/reusables/hooks/useLinkPreview') return { useLinkPreview: () => ({ status: 'idle' }) };
  if (request === '@/reusables/hooks/reusable') return { formatToDjangoDate: () => '2026-10-15', extractFirstUrlFromHtml: () => null };
  if (request === '@/reusables/hooks/useDragAndDrop') return { useDragAndDrop: () => ({ isDragging: false, dragHandlers: {} }) };
  if (request === '@/reusables/vars/uploads') return { limitFor: () => ({ maxBytes: 1e8, label: '100 MB' }) };
  if (request === '@/app/reusables/LinkPreviewCard' || request === './PendingAttachmentItem') return { __esModule: true, default: () => null };
  if (request.startsWith('@/')) request = path.join(root, request.slice(2));
  return originalLoad.call(this, request, parent, isMain);
};
const Notes = require('../src/app/tabs/profile/notes/Notes.tsx').default;
const NewEntry = require('../src/app/tabs/profile/diary/NewEntry.tsx').default;
const Diary = require('../src/app/tabs/profile/diary/Diary.tsx').default;
const EntryView = require('../src/app/tabs/profile/diary/EntryView.tsx').default;
const { useWritingHistory } = require('../src/app/tabs/profile/writing/writingHooks.ts');
afterEach(() => { cleanup(); });
const mount = (component, route = '/notes') => render(React.createElement(MemoryRouter, { initialEntries: [route] }, component));

test('Notes show card skeletons until the list response arrives', async () => {
  const original = api.list;
  let resolve;
  api.list = () => new Promise(done => { resolve = done; });
  try {
    const view = mount(React.createElement(Notes));
    const skeleton = await screen.findByRole('status', { name: 'Loading notes' });
    assert.ok(skeleton.querySelectorAll('.note-card').length >= 6);
    await act(async () => resolve({ count: 0, next: null, results: [] }));
    assert.equal(screen.queryByRole('status', { name: 'Loading notes' }), null);
    view.unmount();
  } finally { api.list = original; }
});

test('Diary list and entry use their own content skeletons while requests are pending', async () => {
  const original = requests.GetUserEntriesRequest;
  let resolve;
  requests.GetUserEntriesRequest = () => new Promise(done => { resolve = done; });
  try {
    const view = mount(React.createElement(Routes, null, React.createElement(Route, { path: '/:userID/diary', element: React.createElement(Diary) })), '/owner/diary');
    const skeleton = await screen.findByRole('status', { name: 'Loading diary entries' });
    assert.ok(skeleton.querySelector('.diary-row-title'));
    assert.ok(skeleton.querySelector('.diary-row-meta'));
    await act(async () => resolve({ results: [], next: null }));
    assert.equal(screen.queryByRole('status', { name: 'Loading diary entries' }), null);
    view.unmount();
  } finally { requests.GetUserEntriesRequest = original; }
  requests.GetEntryRequest = () => new Promise(done => { resolve = done; });
  try {
    mount(React.createElement(EntryView), '/owner/diary?entry_id=loading-entry');
    const skeleton = await screen.findByRole('status', { name: 'Loading diary entry' });
    assert.ok(skeleton.querySelector('.writing-document'));
    await act(async () => resolve({ id: 'loading-entry', title: 'Loaded entry', content: '<p>Now ready</p>', entry_date: '2026-10-15', tag_objects: [], attachments: [] }));
    assert.equal(screen.queryByRole('status', { name: 'Loading diary entry' }), null);
    await screen.findByText('Loaded entry');
  } finally { delete requests.GetEntryRequest; }
});

test('untouched actual Notes editor closes without a write or discard prompt', async () => {
  mount(React.createElement(Notes));
  await screen.findByRole('button', { name: 'Open Note 1' });
  fireEvent.click(screen.getByRole('button', { name: 'New note' }));
  await screen.findByRole('textbox', { name: 'Note title' });
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
  fireEvent.click(screen.getByRole('button', { name: 'Close note' }));
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
  await waitFor(() => assert.equal(screen.queryByRole('dialog', { name: 'Note editor' }), null));
  assert.equal(screen.queryByRole('alertdialog'), null); assert.equal(saves.length, 0);
});

test('title-only actual Notes editor flushes on close without entering body history', async () => {
  mount(React.createElement(Notes));
  fireEvent.click(screen.getByRole('button', { name: 'New note' }));
  const userEvent = require('@testing-library/user-event').default;
  await userEvent.type(await screen.findByRole('textbox', { name: 'Note title' }), 'Hello world');
  assert.equal(screen.getByRole('textbox', { name: 'Note title' }).value, 'Hello world');
  fireEvent.click(screen.getByRole('button', { name: 'Close note' }));
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
  await waitFor(() => assert.equal(screen.queryByRole('dialog', { name: 'Note editor' }), null));
  assert.equal(saves.at(-1).title, 'Hello world');
  fireEvent.click(screen.getByRole('button', { name: 'New note' }));
  fireEvent.change(await screen.findByRole('textbox', { name: 'Note title' }), { target: { value: 'Undo me' } });
  assert.equal(screen.getByRole('button', { name: 'Undo' }).disabled, true);
  assert.equal(screen.getByRole('textbox', { name: 'Note title' }).value, 'Undo me');
  fireEvent.click(screen.getByRole('button', { name: 'Close note' }));
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
  await waitFor(() => assert.equal(screen.queryByRole('dialog', { name: 'Note editor' }), null));
  assert.equal(screen.queryByRole('alertdialog'), null);
});

test('saved Notes can undo and redo edits back to the loaded body without recording HTML normalization', async () => {
  notes = [{ ...sample(41), content: '<p dir="ltr"><strong>Saved body</strong></p>' }];
  mount(React.createElement(Notes));
  fireEvent.click(await screen.findByRole('button', { name: 'Open Note 41' }));
  await screen.findByRole('dialog', { name: 'Note editor' });
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
  assert.equal(screen.getByRole('button', { name: 'Undo' }).disabled, true, 'Opening a saved note must not add a history step');
  const editor = document.querySelector('.ql-editor');
  await act(async () => { editor.innerHTML = '<p><strong>Saved body</strong> plus edit</p>'; fireEvent.input(editor); await new Promise(resolve => setTimeout(resolve, 20)); });
  fireEvent.change(screen.getByRole('textbox', { name: 'Note title' }), { target: { value: 'Retain this title' } });
  fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
  assert.equal(editor.textContent.trim(), 'Saved body');
  assert.equal(screen.getByRole('button', { name: 'Redo' }).disabled, false);
  assert.equal(screen.getByRole('button', { name: 'Undo' }).disabled, true);
  fireEvent.click(screen.getByRole('button', { name: 'Redo' }));
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
  assert.equal(editor.textContent.trim(), 'Saved body plus edit');
  assert.equal(screen.getByRole('textbox', { name: 'Note title' }).value, 'Retain this title');
  fireEvent.click(screen.getByRole('button', { name: 'Close note' }));
  await waitFor(() => assert.ok(!screen.queryByRole('dialog', { name: 'Note editor' }), screen.queryByRole('dialog', { name: 'Note editor' })?.textContent));
});

test('saved Notes show image, video and audio attachments with independent removal', async () => {
  const files = [
    { id: 'image', url: 'https://media.test/photo.png', file_name: 'Photo.png', file_type: 'image/png' },
    { id: 'video', url: 'https://media.test/clip.mp4', file_name: 'Clip.mp4', file_type: 'video/mp4' },
    { id: 'audio', url: 'https://media.test/memo.wav', file_name: 'Memo.wav', file_type: 'audio/wav' },
  ];
  notes = [{ ...sample(42), attachments: files }];
  mount(React.createElement(Notes));
  fireEvent.click(await screen.findByRole('button', { name: 'Open Note 42' }));
  const dialog = await screen.findByRole('dialog', { name: 'Note editor' });
  await waitFor(() => assert.ok(dialog.querySelector('img[src="https://media.test/photo.png"]')));
  assert.ok(dialog.querySelector('video'));
  assert.ok(dialog.querySelector('audio source[src="https://media.test/memo.wav"]'));
  fireEvent.click(screen.getByRole('button', { name: 'Remove Photo.png' }));
  assert.equal(dialog.querySelector('img[src="https://media.test/photo.png"]'), null);
  assert.ok(dialog.querySelector('video'));
  assert.equal(screen.getByRole('button', { name: 'Undo' }).disabled, true, 'Removing media must not enter body history');
  fireEvent.click(screen.getByRole('button', { name: 'Close note' }));
  await waitFor(() => assert.ok(!screen.queryByRole('dialog', { name: 'Note editor' }), screen.queryByRole('dialog', { name: 'Note editor' })?.textContent));
});

test('repeated Undo/Redo of a saved list keeps its original paragraph spacing', async () => {
  notes = [{ ...sample(43), content: '<p>Saved paragraph</p><ul><li>Saved list</li></ul>' }];
  mount(React.createElement(Notes));
  fireEvent.click(await screen.findByRole('button', { name: 'Open Note 43' }));
  await screen.findByRole('dialog', { name: 'Note editor' });
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
  const editor = document.querySelector('.ql-editor');
  const initial = editor.innerHTML;
  const quill = document.querySelector('.ql-container').__quill;
  await act(async () => { quill.insertText(quill.getLength() - 1, ' edited', 'user'); });
  await waitFor(() => assert.equal(screen.getByRole('button', { name: 'Undo' }).disabled, false));
  for (let i = 0; i < 3; i++) {
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
    assert.equal(editor.innerHTML, initial, 'Restoring a list must not insert blank paragraphs');
    fireEvent.click(screen.getByRole('button', { name: 'Redo' }));
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
    assert.ok(editor.textContent.endsWith('Saved list edited'));
  }
  fireEvent.click(screen.getByRole('button', { name: 'Close note' }));
  await waitFor(() => assert.ok(!screen.queryByRole('dialog', { name: 'Note editor' })));
});

test('saved-note history restores the caret at the changed text instead of another line', async () => {
  notes = [{ ...sample(44), content: '<p>First paragraph</p><p>Second paragraph</p><ul><li>List item</li></ul>' }];
  mount(React.createElement(Notes));
  fireEvent.click(await screen.findByRole('button', { name: 'Open Note 44' }));
  await screen.findByRole('dialog', { name: 'Note editor' });
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
  const quill = document.querySelector('.ql-container').__quill;
  const original = quill.getText();
  await act(async () => { quill.setSelection(6, 0, 'silent'); quill.insertText(6, 'XYZ', 'user'); quill.setSelection(9, 0, 'silent'); });
  // Restoring HTML can also repair list attributes after the text edit. That
  // formatting repair must not move the text-edit caret to the end of the list.
  await act(async () => { quill.formatLine(quill.getLength() - 2, 1, 'list', false, 'api'); });
  for (let i = 0; i < 2; i++) {
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
    assert.equal(quill.getText(), original);
    assert.equal(quill.getSelection()?.index, 6, 'Undo caret belongs at the removed insertion');
    fireEvent.click(screen.getByRole('button', { name: 'Redo' }));
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
    assert.equal(quill.getSelection()?.index, 9, 'Redo caret belongs after the restored insertion');
    assert.equal(quill.getText(), original.slice(0, 6) + 'XYZ' + original.slice(6));
  }
  fireEvent.click(screen.getByRole('button', { name: 'Close note' }));
  await waitFor(() => assert.ok(!screen.queryByRole('dialog', { name: 'Note editor' })));
});

test('Diary cards style title, mood and tags while retaining preview and entry details', async () => {
  mount(React.createElement(Routes, null, React.createElement(Route, { path: '/:userID/diary', element: React.createElement(Diary) })), '/owner/diary');
  await screen.findByText('Just a quote of the day');
  const card = document.querySelector('.diary-row');
  assert.equal(card.querySelector('.diary-row-mood')?.textContent, '🌟Hopeful');
  assert.deepEqual([...card.querySelectorAll('.writing-tag')].map(tag => tag.textContent), ['garden', 'bloom']);
  assert.equal(card.querySelector('.diary-row-preview')?.textContent, 'Body stays in the entry reader');
  assert.ok(card.querySelector('.diary-row-meta')?.textContent.includes('Private'));
  assert.equal(card.querySelector('.diary-row-meta time')?.getAttribute('datetime'), '2026-10-15T08:00:00Z');
});

test('pointer drag works on the whole note and moves it to the final grid slot', async () => {
  notes = [sample(1), sample(2), sample(3)];
  mount(React.createElement(Notes));
  await screen.findByRole('button', { name: 'Open Note 1' });
  const grid = document.querySelector('.notes-grid');
  [...grid.children].forEach((card, index) => { card.getBoundingClientRect = () => ({ left: index * 240, top: 100, width: 220, height: 180, right: index * 240 + 220, bottom: 280 }); });
  document.querySelector('.notes-scroll').getBoundingClientRect = () => ({ top: 0, bottom: 800 });
  fireEvent.pointerDown(screen.getByRole('button', { name: 'Open Note 1' }), { pointerId: 1, pointerType: 'mouse', clientX: 90, clientY: 160, button: 0 });
  fireEvent.pointerMove(grid, { pointerId: 1, pointerType: 'mouse', clientX: 580, clientY: 160 });
  assert.deepEqual([...grid.children].map(card => card.dataset.noteId), ['note-2', 'note-3', 'note-1']);
  fireEvent.pointerUp(grid, { pointerId: 1, pointerType: 'mouse', clientX: 580, clientY: 160 });
  await waitFor(() => assert.deepEqual(reorders.at(-1), { id: 'note-1', before: null }));
  assert.equal(notes.at(-1).id, 'note-1');
});

test('neighboring Notes interpolate to their new masonry position instead of snapping', async () => {
  notes = [sample(1), sample(2)];
  mount(React.createElement(Notes));
  await screen.findByRole('button', { name: 'Open Note 1' });
  const neighbor = document.querySelector('[data-note-id="note-2"]');
  const translateX = () => (parseFloat(neighbor.style.left) || 0) + Number(/translateX\(([-\d.]+)px\)/.exec(neighbor.style.transform)?.[1] || 0);
  await waitFor(() => assert.equal(translateX(), 308, 'Initial placement should land at the measured column'));
  fireEvent.keyDown(screen.getByRole('button', { name: 'Move Note 1. Use arrow keys, Home or End.' }), { key: 'End' });
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 45)); });
  assert.ok(translateX() > 0 && translateX() < 308, `The neighboring card should be in motion, got x=${translateX()}`);
  await waitFor(() => assert.ok(Math.abs(translateX()) < 0.1), { timeout: 1500 });
});

test('failed new note remains recoverable with a visible mobile resume action', async () => {
  const save = api.save;
  api.save = async () => { throw new Error('fixture offline'); };
  try {
    const mounted = mount(React.createElement(Notes));
    fireEvent.click(screen.getByRole('button', { name: 'New note' }));
    fireEvent.change(await screen.findByRole('textbox', { name: 'Note title' }), { target: { value: 'Recover this note' } });
    fireEvent.click(screen.getByRole('button', { name: 'Close note' }));
    await screen.findByRole('alertdialog', { name: 'Discard unsaved changes?' });
    fireEvent.click(screen.getByRole('button', { name: 'Keep writing' }));
    mounted.unmount();
    mount(React.createElement(Notes));
    const resume = await screen.findByRole('button', { name: 'Resume unsaved note: Recover this note' });
    assert.equal(resume.hidden, false);
    const css = fs.readFileSync(path.join(root, 'app/tabs/profile/writing/writing.css'), 'utf8');
    assert.equal(/\.notes-resume\s*\{[^}]*display\s*:\s*none/.test(css), false);
    fireEvent.click(resume);
    assert.equal(screen.getByRole('textbox', { name: 'Note title' }).value, 'Recover this note');
    fireEvent.click(screen.getByRole('button', { name: 'Close note' }));
    await screen.findByRole('alertdialog', { name: 'Discard unsaved changes?' });
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
  } finally { api.save = save; }
});

test('keyboard reorder across loaded page boundary resolves a server anchor', async () => {
  notes = Array.from({ length: 26 }, (_, i) => sample(i + 1));
  mount(React.createElement(Notes));
  const handle = await screen.findByRole('button', { name: 'Move Note 23. Use arrow keys, Home or End.' });
  fireEvent.keyDown(handle, { key: 'ArrowDown' });
  await waitFor(() => assert.equal(reorders.at(-1)?.before, 'note-25'));
  assert.equal(reorders.at(-1).id, 'note-23');
  await waitFor(() => assert.equal(screen.getByRole('button', { name: 'Move Note 23. Use arrow keys, Home or End.' }).disabled, false));
});

test('Diary history treats Quill empty normalization as untouched', () => {
  let state;
  function Harness() { state = useWritingHistory({ title: '', content: '' }); return null; }
  mount(React.createElement(Harness));
  act(() => state.change({ title: '', content: '<p><br></p>' }));
  assert.equal(state.dirty, false); assert.equal(state.canUndo, false);
  act(() => state.change({ title: 'Title', content: '<p>Body</p>' }));
  act(() => state.change({ title: 'Current title', content: '<p>Body</p>', tags: ['Life'] }));
  act(() => state.undo()); assert.equal(state.value.content, '');
  assert.equal(state.value.title, 'Current title'); assert.deepEqual(state.value.tags, ['Life']);
  act(() => state.redo()); assert.equal(state.value.content, '<p>Body</p>');
  assert.equal(state.value.title, 'Current title');
});

test('touch-accessible move-to-end action moves a note across the full collection', async () => {
  notes = Array.from({ length: 26 }, (_, i) => sample(i + 1));
  mount(React.createElement(Notes));
  fireEvent.click(await screen.findByRole('button', { name: 'Move Note 1 to end' }));
  await waitFor(() => assert.equal(reorders.at(-1)?.before, null));
  assert.equal(reorders.at(-1).id, 'note-1');
  assert.equal(notes.at(-1).id, 'note-1');
});

test('actual Diary composer loads paginated mood grid and creates inline tags', async () => {
  const userEvent = require('@testing-library/user-event').default;
  mount(React.createElement(Routes, null, React.createElement(Route, { path: '/:userID/diary', element: React.createElement(NewEntry, { reload() {} }) })), '/owner/diary?entry_id=new');
  fireEvent.click(screen.getByRole('button', { name: 'How are you feeling?' }));
  await screen.findByRole('button', { name: '🙂 Mood 1' });
  fireEvent.click(screen.getByRole('button', { name: 'Load more moods' }));
  await screen.findByRole('button', { name: '🙂 Mood 20' });
  fireEvent.click(screen.getByRole('button', { name: '🙂 Mood 20' }));
  assert.deepEqual(moodPages, [1, 2]);
  const tags = screen.getByRole('combobox', { name: 'Tags' });
  await userEvent.type(tags, 'NewTag');
  fireEvent.click(await screen.findByText('Create “NewTag”'));
  assert.ok(tagQueries.includes('NewTag'));
  fireEvent.change(screen.getByRole('textbox', { name: 'Entry title' }), { target: { value: 'Fixture diary' } });
  const editor = document.querySelector('.ql-editor');
  await act(async () => { editor.innerHTML = '<p>A fixture body</p>'; fireEvent.input(editor); await new Promise(resolve => setTimeout(resolve, 20)); });
  await waitFor(() => assert.equal(screen.getByRole('button', { name: 'Save' }).disabled, false));
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => assert.equal(diaryWrites.length, 1));
  assert.equal(diaryWrites[0].payload.mood.name, 'Mood 20');
  assert.equal(diaryWrites[0].payload.tags[0].name, 'NewTag');
  assert.equal(diaryWrites[0].payload.is_private, true);
});
