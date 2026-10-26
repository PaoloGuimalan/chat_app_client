const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<html><body></body></html>', { url: 'https://fixture.test' });
Object.assign(global, { window: dom.window, document: dom.window.document });
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
const auth = { auth: true, user: { entity_id: 'person', userID: 'person-account', username: 'person' }, active_entity_context: { id: 'acting-page' } };
const empty = { count: 0, results: [], next: null, previous: null };
const community = { realm_id: 'garden', entity_id: 'garden-entity', name: 'Garden Club', is_member: true, is_private: false };
let requests = [], inView = false, composer, momentCalls = 0, thoughtCalls = 0;
const originalLoad = Module._load;
const root = path.join(__dirname, '../src');
const plain = ({ children }) => React.createElement('div', null, children);
const motion = new Proxy({}, {
  get(target, tag) {
    return target[tag] ||= React.forwardRef(({ children, className }, ref) => React.createElement(tag, { className, ref }, children));
  },
});
Module._extensions['.ts'] = Module._extensions['.tsx'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, filename);
Module._load = function (request, parent, isMain) {
  if (request === '@/reusables/hooks/errormessages') return { notifyRequestError() {} };
  if (request === 'react-redux') return { useSelector: fn => fn({ authentication: auth, screensizelistener: { W: 1200 } }), useDispatch: () => () => {} };
  if (request === 'react-router-dom') return { useParams: () => ({ userID: 'ordinary-user' }), useNavigate: () => () => {} };
  if (request === 'framer-motion') return { useInView: () => inView, motion };
  if (request === '@/reusables/hooks/requests') return {
    GetFeedEmojisRequest: async () => [],
    GetPostRequest: query => new Promise((resolve, reject) => requests.push({ query, resolve, reject })),
    GetMomentRingsRequest: async () => { momentCalls++; return {}; },
    GetThoughtsRequest: async () => { thoughtCalls++; return {}; },
  };
  if (request === '@/redux/actions/states') return { postsliststate: empty };
  if (request === '@/redux/types') return { SET_EMOJIS_LIST: 'emojis' };
  if (request === '@/reusables/design') return { Card: plain };
  if (request === '@/reusables/design/primitives2') return { Avatar: () => null };
  if (request === './PostItem') return { __esModule: true, default: ({ mp }) => React.createElement('span', { 'data-member': String(mp.community?.is_member) }, mp.caption) };
  if (request === '@/app/reusables/loaders/PostItemLoader') return { __esModule: true, default: () => React.createElement('span', null, 'Loading post') };
  if (request === '@/app/reusables/ProfileComposerContent') return { __esModule: true, default: props => React.createElement('button', { onClick: () => props.onOpen(false) }, props.placeholder) };
  if (request === '@/app/widgets/modals/CreatePost/NewPostModal') return { NewPostModal: props => { composer = props; return React.createElement('button', { onClick: props.getpostprocess }, 'Publish'); } };
  if (/(?:UploadProfileMedia|FullscreenImageViewer)$/.test(request)) return { __esModule: true, default: () => null };
  if (request === '@/app/tabs/moments/ephemeral') return { MOMENTS_CHANGED_EVENT: 'moments', THOUGHTS_CHANGED_EVENT: 'thoughts' };
  if (request === '@/app/tabs/moments/Thoughts') return {};
  if (request.startsWith('@/')) request = path.join(root, request.slice(2));
  return originalLoad.call(this, request, parent, isMain);
};
const { render, fireEvent, act, cleanup } = require('@testing-library/react');
const PostsContainer = require('../src/app/tabs/profile/user/PostsContainer.tsx').default;
const ProfilePicContainer = require('../src/app/tabs/profile/user/ProfilePicContainer.tsx').default;
const props = extra => ({ community, ...extra });
const postPage = (caption, next = null, isMember = true) => ({ ...empty, count: 1, next, results: [{ post_id: caption, caption, date_posted: '2026-10-26', community: { ...community, is_member: isMember } }] });
afterEach(() => { cleanup(); requests = []; inView = false; composer = undefined; auth.active_entity_context.id = 'acting-page'; });

test('failed community pages stop automatic paging and can retry the same page', async () => {
  const screen = render(React.createElement(PostsContainer, props()));
  await act(async () => requests[0].resolve(postPage('First page', '/page2')));
  inView = true;
  screen.rerender(React.createElement(PostsContainer, props()));
  assert.equal(requests.at(-1).query.page, 2);
  await act(async () => requests.at(-1).reject(new Error('Feed failed')));
  assert.equal(requests.length, 2);
  assert.equal(screen.queryByText('Feed failed'), null);
  fireEvent.click(screen.getByText('Try again'));
  assert.equal(requests.at(-1).query.page, 2);
  await act(async () => requests.at(-1).resolve(postPage('Second page')));
  assert.ok(screen.getByText('First page'));
  assert.ok(screen.getByText('Second page'));
});

test('community feed uses the acting identity and real destination without pretagging a profile', async () => {
  const screen = render(React.createElement(PostsContainer, props()));
  assert.deepEqual(requests[0].query, { current_user_id: 'acting-page', userID: 'garden', page: 1, range: 20 });
  assert.equal(screen.getAllByText('Loading post').length, 8);
  fireEvent.click(screen.getByText('Share something with Garden Club…'));
  assert.equal(composer.community, community);
  assert.equal(composer.profileInfo, undefined);
  await act(async () => requests[0].resolve(empty));
  assert.ok(screen.getByText('No Posts yet'));
  screen.rerender(React.createElement(PostsContainer, props({ community: { ...community, is_member: false } })));
  assert.equal(screen.queryByText('Share something with Garden Club…'), null);
  assert.equal(screen.queryByText('Publish'), null);
});

test('actor and destination changes clear community content and reject stale replies', async () => {
  const screen = render(React.createElement(PostsContainer, props()));
  await act(async () => requests[0].resolve(postPage('Old actor')));
  auth.active_entity_context.id = 'other-page';
  screen.rerender(React.createElement(PostsContainer, props()));
  assert.equal(screen.queryByText('Old actor'), null);
  assert.equal(requests.at(-1).query.current_user_id, 'other-page');
  const oldRequest = requests.at(-1);
  screen.rerender(React.createElement(PostsContainer, props({ community: { ...community, realm_id: 'other-garden' } })));
  await act(async () => oldRequest.resolve(postPage('Stale actor')));
  assert.equal(screen.queryByText('Stale actor'), null);
  assert.equal(requests.at(-1).query.userID, 'other-garden');
  await act(async () => requests.at(-1).resolve(postPage('Current garden')));
  assert.ok(screen.getByText('Current garden'));
});

test('publishing reloads page one and replaces old pages while rejecting pending pagination', async () => {
  const screen = render(React.createElement(PostsContainer, props()));
  await act(async () => requests[0].resolve(postPage('First page', '/page2')));
  inView = true;
  screen.rerender(React.createElement(PostsContainer, props()));
  assert.equal(requests.at(-1).query.page, 2);
  const pendingPage = requests.at(-1);
  fireEvent.click(screen.getByText('Share something with Garden Club…'));
  fireEvent.click(screen.getByText('Publish'));
  const reload = requests.at(-1);
  assert.equal(reload.query.page, 1);
  await act(async () => reload.resolve(postPage('Fresh first page')));
  await act(async () => pendingPage.resolve(postPage('Stale second page')));
  assert.equal(screen.queryByText('First page'), null);
  assert.equal(screen.queryByText('Stale second page'), null);
  assert.ok(screen.getByText('Fresh first page'));
});

test('current membership overrides old feed metadata and access denials clear the reader', async () => {
  let denied;
  const current = props({ onCommunityAccessDenied: error => denied = error });
  const screen = render(React.createElement(PostsContainer, current));
  await act(async () => requests[0].resolve(postPage('Member card', '/page2', false)));
  assert.equal(screen.getByText('Member card').dataset.member, 'true');
  inView = true;
  screen.rerender(React.createElement(PostsContainer, current));
  const error = { status: 403 };
  await act(async () => requests.at(-1).reject(error));
  assert.equal(denied, error);
  assert.equal(screen.queryByText('Member card'), null);
  assert.equal(screen.queryByText('Share something with Garden Club…'), null);
});

test('unmounted community responses cannot invoke access callbacks', async () => {
  let called = false;
  const screen = render(React.createElement(PostsContainer, props({ onCommunityAccessDenied: () => called = true })));
  screen.unmount();
  await act(async () => requests[0].reject({ status: 403 }));
  assert.equal(called, false);
});

test('private membership revocation removes loaded cards and cannot restart an unauthorized feed', async () => {
  const screen = render(React.createElement(PostsContainer, props({ community: { ...community, is_private: true } })));
  await act(async () => requests[0].resolve(postPage('Private member post')));
  assert.ok(screen.getByText('Private member post'));
  screen.rerender(React.createElement(PostsContainer, props({ community: { ...community, is_private: true, is_member: false } })));
  assert.equal(screen.queryByText('Private member post'), null);
  assert.equal(screen.queryByText('Share something with Garden Club…'), null);
  assert.equal(requests.length, 1);
});

test('ordinary profiles retain their wall composer and account feed destination', async () => {
  const profileInfo = { id: 'profile-id', entityID: 'profile-entity', userID: 'someone', fullname: { firstName: 'Someone' } };
  const screen = render(React.createElement(PostsContainer, { profileInfo }));
  assert.equal(requests[0].query.current_user_id, 'person');
  assert.equal(requests[0].query.userID, 'ordinary-user');
  fireEvent.click(screen.getByText("Write on Someone's wall..."));
  assert.equal(composer.profileInfo.entityID, 'profile-entity');
  assert.equal(composer.community, undefined);
  await act(async () => requests[0].resolve(empty));
});

test('community avatar skips Moments and Thoughts while ordinary avatars retain them', () => {
  momentCalls = thoughtCalls = 0;
  const base = { userID: 'garden', entityId: 'garden-entity', realm_id: 'garden', type: 'realm', profile: 'photo.jpg', isAllowed: true, getpostprocess() {} };
  const screen = render(React.createElement(ProfilePicContainer, { ...base, realm_type: 'community' }));
  assert.equal(momentCalls, 0);
  assert.equal(thoughtCalls, 0);
  assert.ok(screen.getByText('Upload New Photo'));
  assert.ok(screen.getByText('View Photo'));
  screen.rerender(React.createElement(ProfilePicContainer, { ...base, realm_type: 'page' }));
  assert.equal(momentCalls, 1);
  assert.equal(thoughtCalls, 1);
});
