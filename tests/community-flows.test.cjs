const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<html><body></body></html>', { url: 'https://fixture.test' });
Object.assign(global, { window: dom.window, document: dom.window.document, localStorage: dom.window.localStorage, CustomEvent: dom.window.CustomEvent });
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
global.URL.createObjectURL = () => 'blob:fixture';
global.URL.revokeObjectURL = () => {};
localStorage.setItem('authtoken', 'fixture-token');
const root = path.join(__dirname, '../src');
const auth = { auth: true, user: { entity_id: 'human', userID: 'human-user', username: 'human' }, active_entity_context: { id: 'human', name: 'Human', profile: 'none' } };
const community = { realm_id: 'realm', entity_id: 'destination', name: 'Garden Club', slug: 'garden', profile: 'none', description: 'Grow together', is_member: true, is_private: true, my_role: 'owner', member_count: 2 };
let directory, detail, feed, requestRows, commentRows, files, uploads, saves, typing, reactions, invitations, navigations, closes, loadFeed;
const empty = { results: [], next: null, previous: null, count: 0 };
function reset() {
  directory = [{ ...community }]; detail = { ...community }; feed = []; requestRows = []; commentRows = []; files = [];
  uploads = []; saves = []; typing = []; reactions = []; invitations = []; navigations = []; closes = [];
  auth.active_entity_context.id = 'human';
  loadFeed = async () => ({ ...empty, results: feed });
}
reset();
const requests = {
  GetPostRequest: (...args) => loadFeed(...args),
  GetRealmMembersRequest: async () => empty,
  CreatePostRequest: async payload => { saves.push(payload); return { data: { status: true } }; },
  UploadMediaRequest: async (...args) => { uploads.push(args); return { data: { result: [{ fileName: 'photo', fileType: 'image/jpeg', fileDetails: { data: '/uploaded.jpg' } }] } }; },
  GetRealmInviteRequest: async () => ({ result: requestRows }),
  UpdateRealmInviteRequest: async payload => { invitations.push(payload); requestRows = requestRows.filter(row => row.invite_token !== payload.invite_token); return { status: true }; },
  GetCommentsRequest: async () => ({ ...empty, results: commentRows, count: commentRows.length }),
  NetworkOverviewRequest: async () => ({ connections: { results: [] }, following: { results: [] } }),
  SaveCommentRequest: async (...args) => { saves.push(args); return { status: true }; },
  CommentTypingBroadcastRequest: (...args) => typing.push(args),
  ReactionSaveRequest: async payload => reactions.push(payload),
  CommentReactionSaveRequest: async payload => reactions.push(payload),
  GetCommentReactionTotalRequest: async () => [],
  LottieJSONRequest: async () => null,
};
const api = {
  listCommunities: async query => ({ ...empty, results: directory.filter(row => (!query.joined || row.is_member) && (!query.search || row.name.toLowerCase().includes(query.search.toLowerCase()))) }),
  getCommunity: async () => ({ result: detail }),
  createCommunity: async input => ({ status: true, result: { ...community, ...input } }),
  joinCommunity: async () => { detail = { ...detail, is_member: !detail.is_private, request_pending: detail.is_private }; return { status: true }; },
  leaveCommunity: async () => { detail = { ...detail, is_member: false, request_pending: false }; return { status: true }; },
};
const plain = ({ children }) => React.createElement('div', null, children);
const original = Module._load;
Module._extensions['.ts'] = Module._extensions['.tsx'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, filename);
Module._extensions['.css'] = () => {};
Module._load = function(request, parent, isMain) {
  if (request === 'react-redux') return { useSelector: fn => fn({ authentication: auth, alerts: [], emojilist: [{ emoji_id: 'smile', emoji_content: ':)', priority: 1 }], screensizelistener: { W: 1200 } }), useDispatch: () => () => {} };
  if (request === 'react-router-dom') return { useNavigate: () => value => navigations.push(value), useParams: () => ({ communityId: 'garden' }), useLocation: () => ({ pathname: '/realms/realm' }), Routes: plain, Route: () => null, Navigate: () => null };
  if (request === 'framer-motion') return { motion: new Proxy({}, { get: (_, tag) => ({ children, className }) => React.createElement(tag, { className }, children) }) };
  if (request === '@/reusables/design') return { Icon: () => null, Avatar: ({ name }) => { assert.equal(typeof name, 'string'); return React.createElement('span', null, name.split(' ')[0]); }, Card: plain, Btn: ({ children, onClick, disabled }) => React.createElement('button', { onClick, disabled }, children), PageFlag: () => null, BotFlag: () => null };
  if (request === '@/reusables/hooks/requests') return requests;
  if (request === '@/reusables/hooks/communityRequests') return api;
  if (request === '@/reusables/hooks/errormessages') return { resolveErrorMessage: (error, fallback) => error.message || fallback, notifyRequestError() {} };
  if (request === '@/reusables/hooks/pickFiles') return { pickFiles: async () => files };
  if (request === '@/reusables/hooks/useDragAndDrop') return { useDragAndDrop: () => ({ dragHandlers: {}, isDragging: false }) };
  if (request === '@/reusables/hooks/useLinkPreview') return { useLinkPreview: () => ({ dismiss() {} }) };
  if (request === '@/reusables/hooks/reusable') return { getActiveAvatar: () => ({ name: 'Human', src: undefined }), timeSince: () => 'Now' };
  if (request === '@/reusables/hooks/hashtags') return { useHashtagNavigation: () => ({}) };
  if (request === '@/reusables/hooks/postRealtime') return { usePostActivityStream() {} };
  if (request === '@/reusables/hooks/localforagehelper') return { getLottieData: async () => null, persistLottieData() {} };
  if (request === '@/redux/actions/states') return { commentsliststate: empty };
  if (request === '@/app/reusables/Modal') return { __esModule: true, default: props => props.component };
  if (request === '@/app/reusables/HashtagField') return { __esModule: true, default: plain };
  if (request === '@/app/tabs/messenger/partials/MessageContent') return { __esModule: true, default: ({ content }) => React.createElement('span', null, content) };
  if (/(?:PostItem|PostMediaPreview|LinkPreviewCard|ContactMember|RealmMembers|InvitePeople|MessageContent|CommentOptions|PostCommentLoader|Dashboard|Details|Media|Members|Followers)$/.test(request)) return { __esModule: true, default: () => null };
  if (request.startsWith('@/')) request = path.join(root, request.slice(2));
  return original.call(this, request, parent, isMain);
};
const { render, fireEvent, waitFor, act, cleanup, within } = require('@testing-library/react');
const Communities = require('../src/app/tabs/communities/Communities.tsx').default;
const Profile = require('../src/app/tabs/communities/CommunityProfile.tsx').default;
const { NewPostModal } = require('../src/app/widgets/modals/CreatePost/NewPostModal.tsx');
const Comments = require('../src/app/widgets/items/PostComment.tsx').default;
const Emojis = require('../src/app/reusables/PostEmojis.tsx').default;
const CommunityRequests = require('../src/app/widgets/invites/CommunityRequests.tsx').default;
const ManageRealm = require('../src/app/tabs/realms/manage/ManageRealm.tsx').default;
const composerProps = { community, toShare: false, withImage: false, setcreateposttext() {}, getpostprocess() {}, onclose: value => closes.push(value) };

test('directory searches and opens actual communities without switching identity', async () => {
  reset(); const screen = render(React.createElement(Communities));
  await waitFor(() => assert.ok(screen.queryByText('Garden Club')));
  fireEvent.click(screen.getByText('Garden Club')); assert.deepEqual(navigations, ['/communities/garden']);
  fireEvent.change(screen.getByLabelText('Search communities'), { target: { value: 'missing' } });
  await waitFor(() => assert.ok(screen.queryByText('No communities found.')));
  assert.equal(auth.active_entity_context.id, 'human'); cleanup();
});

test('private profile immediately clears after membership loss and does not refetch its feed', async () => {
  reset(); let feedCalls = 0; loadFeed = async () => { feedCalls++; return empty; };
  const screen = render(React.createElement(Profile));
  await waitFor(() => assert.ok(screen.queryByText('Leave community')));
  await waitFor(() => assert.equal(feedCalls, 1));
  const before = feedCalls; detail = { ...community, is_member: false, my_role: null };
  act(() => document.dispatchEvent(new CustomEvent('community-changed', { detail: { realm_id: 'realm' } })));
  assert.ok(!screen.queryByText('Leave community'), 'Membership controls clear immediately');
  await waitFor(() => assert.ok(screen.queryByText('This community is private')));
  assert.equal(feedCalls, before); cleanup();
});

test('community profile reuses the profile composer and opens Photo with a protected destination', async () => {
  reset();
  const screen = render(React.createElement(Profile));
  await waitFor(() => assert.ok(screen.queryByPlaceholderText('Share something with Garden Club…')));
  fireEvent.click(screen.getByRole('button', { name: 'Photo', exact: true }));
  await waitFor(() => assert.ok(screen.queryByText('Drag & drop photos or videos here')));
  fireEvent.click(screen.getByRole('button', { name: 'Post in', exact: true }));
  assert.equal(screen.getByLabelText('Post in').value, 'destination');
  assert.equal(screen.getByLabelText('Post in').disabled, true);
  cleanup();
});

test('uploaded covers render as images in the directory and profile', async () => {
  reset();
  const cover = 'https://media.example.test/community/cover photo (1).jpg';
  directory = [{ ...community, cover_photo: cover }];
  detail = { ...community, cover_photo: cover };
  try {
    const directoryScreen = render(React.createElement(Communities));
    await waitFor(() => assert.ok(directoryScreen.queryByText('Garden Club')));
    const cardCover = directoryScreen.container.querySelector('.cl-community-card-cover img');
    assert.ok(cardCover, 'Directory cover uses an image element');
    assert.equal(cardCover.getAttribute('src'), cover);
    cleanup();

    const profileScreen = render(React.createElement(Profile));
    await waitFor(() => assert.ok(profileScreen.queryByText('Leave community')));
    const profileCover = profileScreen.container.querySelector('.cl-community-cover img');
    assert.ok(profileCover, 'Profile cover uses an image element');
    assert.equal(profileCover.getAttribute('src'), cover);
  } finally {
    cleanup();
  }
});

test('anonymous composer submits exact destination and upload context before publication', async () => {
  reset(); files = [new dom.window.File(['photo'], 'photo.jpg', { type: 'image/jpeg' })];
  const screen = render(React.createElement(NewPostModal, { ...composerProps, withImage: true }));
  assert.ok(screen.queryByRole('combobox', { name: 'Post in' }) === null);
  fireEvent.click(screen.getByRole('button', { name: 'Post in' }));
  await waitFor(() => assert.ok(screen.queryByLabelText('Post as')));
  fireEvent.change(screen.getByLabelText('Post as'), { target: { value: 'anonymous' } });
  assert.equal(screen.queryByPlaceholderText('Type your caption'), null);
  fireEvent.click(screen.getByRole('button', { name: 'Done' }));
  fireEvent.change(screen.getByPlaceholderText('Type your caption'), { target: { value: 'A private contribution' } });
  await act(async () => fireEvent.click(screen.getByText('Drag & drop photos or videos here')));
  fireEvent.click(screen.getByText('Create'));
  await waitFor(() => assert.equal(saves.length, 1));
  assert.equal(saves[0].community_entity_id, 'destination'); assert.equal(saves[0].is_anonymous, true);
  assert.deepEqual(uploads[0][3], { community_entity_id: 'destination', is_anonymous: true });
  assert.equal(uploads[0][4], 'fixture-token'); assert.equal(saves[0].otherEntityID, null);
  assert.equal(auth.active_entity_context.id, 'human'); cleanup();
});

test('publishing shows a modal loading status until the request completes', async () => {
  reset();
  const originalCreate = requests.CreatePostRequest;
  let complete;
  requests.CreatePostRequest = () => new Promise(resolve => { complete = resolve; });
  try {
    const screen = render(React.createElement(NewPostModal, composerProps));
    fireEvent.change(screen.getByPlaceholderText('Type your caption'), {
      target: { value: 'A community post' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create', exact: true }));
    assert.ok(screen.getByRole('status', { name: 'Publishing post' }));
    assert.equal(screen.getByRole('button', { name: 'Create', exact: true }).disabled, true);
    await waitFor(() => assert.equal(typeof complete, 'function'));
    await act(async () => complete({ data: { status: true } }));
    assert.equal(screen.queryByRole('status', { name: 'Publishing post' }), null);
  } finally {
    requests.CreatePostRequest = originalCreate;
    cleanup();
  }
});

test('anonymous comments and replies submit independent identity and anonymous typing', async () => {
  for (const parent_id of [null, 'parent']) {
    reset(); const screen = render(React.createElement(Comments, { community, post_id: 'post', parent_id }));
    const identity = screen.getByRole('switch', { name: 'React or comment anonymously' });
    if (!identity.checked) fireEvent.click(identity);
    assert.ok(screen.queryByText('Attach photo or video') === null);
    const field = screen.getByPlaceholderText(parent_id ? 'Write a reply...' : 'Write a comment...');
    fireEvent.change(field, { target: { value: 'Anonymous response' } });
    fireEvent.keyDown(field, { key: 'Enter', code: 'Enter' });
    await waitFor(() => assert.equal(saves.length, 1));
    assert.deepEqual(saves[0], ['post', parent_id, 'Anonymous response', null, true]);
    assert.deepEqual(typing[0], ['post', parent_id, true]); cleanup();
  }
});

test('one comment switch controls reactions without options in the emoji picker', async () => {
  reset(); let completed = 0;
  const props = { community, post_id: 'shared-identity-post', reaction: 'old', viewerReactionIsAnonymous: false, onProcessEmojiSelection() {}, onSuccessEmojiSelection() { completed++; } };
  const screen = render(React.createElement(React.Fragment, null,
    React.createElement(Comments, { community, post_id: props.post_id, parent_id: null }),
    React.createElement(Emojis, props)));
  assert.ok(screen.queryByLabelText('React as') === null);
  fireEvent.click(screen.getByRole('switch', { name: 'React or comment anonymously' }));
  await act(async () => fireEvent.click(screen.getByText(':)')));
  assert.equal(reactions[0].is_anonymous, true);
  fireEvent.click(screen.getByRole('switch', { name: 'React or comment anonymously' }));
  await act(async () => fireEvent.click(screen.getByText(':)')));
  assert.equal(reactions[1].is_anonymous, false); assert.equal(completed, 2); cleanup();
});

test('join-request approval uses its invite token and refreshes members', async () => {
  reset(); requestRows = [{ invite_token: 'request-token', target_entity: { id: 'new', details: { first_name: 'New', last_name: 'Member' } } }];
  const screen = render(React.createElement(CommunityRequests, { realmId: 'realm' }));
  await waitFor(() => assert.ok(screen.queryByText('Approve')));
  fireEvent.click(screen.getByText('Approve'));
  await waitFor(() => assert.deepEqual(invitations, [{ invite_token: 'request-token', status: 'accepted' }]));
  await waitFor(() => assert.ok(screen.queryByText('No pending requests.'))); cleanup();
});

test('community manage header passes a plain avatar name and renders shared markers', () => {
  reset(); const html = renderToStaticMarkup(React.createElement(ManageRealm, { realm: { ...community, id: 'realm', entity: 'destination', type: 'community', is_admin: true, is_verified: true } }));
  assert.match(html, /Garden Club/); assert.match(html, /Verified community/); assert.match(html, /aria-label="Community"/);
});

test('membership signals never retarget an anonymous draft to the timeline', async () => {
  reset();
  const screen = render(React.createElement(NewPostModal, composerProps));
  fireEvent.click(screen.getByRole('button', { name: 'Post in' }));
  await waitFor(() => assert.equal(screen.getByLabelText('Post in').value, 'destination'));
  fireEvent.change(screen.getByLabelText('Post as'), { target: { value: 'anonymous' } });
  fireEvent.click(screen.getByRole('button', { name: 'Done' }));
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Private draft' } });
  fireEvent.click(screen.getByRole('button', { name: 'Post in' }));
  await act(async () => document.dispatchEvent(new CustomEvent('community-changed', { detail: { realm_id: 'other-realm' } })));
  assert.equal(screen.getByLabelText('Post in').value, 'destination');
  await act(async () => document.dispatchEvent(new CustomEvent('community-changed', { detail: { realm_id: 'realm' } })));
  assert.equal(screen.getByLabelText('Post in').value, 'destination');
  assert.equal(screen.getByLabelText('Post as').value, 'anonymous');
  fireEvent.click(screen.getByRole('button', { name: 'Done' }));
  assert.equal(screen.getByRole('button', { name: 'Create', exact: true }).disabled, true);
  cleanup();
});

test('comment reactions follow the shared post anonymity switch', async () => {
  reset();
  const postId = 'comment-reaction-identity-post';
  commentRows = [{
    comment_id: 'identity-comment',
    post: postId,
    text: 'A community response',
    entity: null,
    is_anonymous: true,
    is_owner: true,
    community,
    parent_comment: null,
    attachment: null,
    preview: [],
    created_at: '2026-10-25T00:00:00Z',
    entity_reaction: null,
  }];
  try {
    const screen = render(React.createElement(Comments, {
      community,
      post_id: postId,
      parent_id: null,
    }));
    await waitFor(() => assert.ok(screen.queryByText('A community response')));
    const identity = screen.getByRole('switch', {
      name: 'React or comment anonymously',
    });
    const chooseReaction = async () => {
      const picker = screen.getByRole('group', { name: 'Choose a reaction' });
      await act(async () => {
        fireEvent.click(within(picker).getByRole('button', {
          name: ':)', exact: true,
        }));
      });
    };

    fireEvent.click(identity);
    await chooseReaction();
    assert.equal(reactions[0].comment_id, 'identity-comment');
    assert.equal(reactions[0].is_anonymous, true);

    fireEvent.click(identity);
    await chooseReaction();
    assert.equal(reactions[1].is_anonymous, false);
  } finally {
    cleanup();
  }
});

test('comment refresh replaces stored reaction identity with the server result', async () => {
  reset();
  commentRows = [{ comment_id: 'comment', post: 'post', text: 'Response', entity: null,
    is_anonymous: true, is_owner: true, community, parent_comment: null, attachment: null,
    created_at: '2026-10-25T00:00:00Z', preview: [], entity_reaction: 'old', entity_reaction_is_anonymous: true }];
  const originalSave = requests.CommentReactionSaveRequest;
  const methods = [];
  requests.CommentReactionSaveRequest = async (payload) => {
    methods.push(payload.method);
    commentRows = commentRows.map(row => ({ ...row, text: 'Server refreshed response', entity_reaction: 'smile', entity_reaction_is_anonymous: false }));
  };
  try {
    const screen = render(React.createElement(Comments, { community, post_id: 'post', parent_id: null }));
    await waitFor(() => assert.ok(screen.queryByText('Response')));
    const identity = screen.getByRole('switch', { name: 'React or comment anonymously' });
    if (identity.checked) fireEvent.click(identity);
    await act(async () => fireEvent.click(within(screen.getByRole('group', { name: 'Choose a reaction' })).getByRole('button', { name: ':)', exact: true })));
    await waitFor(() => assert.ok(screen.queryByText('Server refreshed response')));
    await act(async () => fireEvent.click(within(screen.getByRole('group', { name: 'Choose a reaction' })).getByRole('button', { name: ':)', exact: true })));
    assert.deepEqual(methods, ['PUT', 'DELETE']);
  } finally {
    requests.CommentReactionSaveRequest = originalSave;
    cleanup();
  }
});
