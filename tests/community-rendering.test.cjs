const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<html></html>', { url: 'https://fixture.test', pretendToBeVisual: true });
global.window = dom.window;
global.document = dom.window.document;
global.localStorage = dom.window.localStorage;
global.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
global.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
localStorage.setItem('authtoken', 'fixture-token');
const root = path.join(__dirname, '../src');
const resetHooks = [];
let showMenus = false, commentRows = [], mediaModal = false;
let editFooter, editUploads = [];
let previewPath = '/fixture', inView = false, viewEvents = [];
let commentSaves = [];
let mentionPeople = [];
const auth = { auth: true, user: { entity_id: 'viewer', userID: 'viewer-user', username: 'viewer', fullName: { firstName: 'Viewer', lastName: 'Person' }, profile: 'none' } };
const plain = ({ children }) => React.createElement('div', null, children);
const avatar = props => React.createElement('span', { 'data-avatar-id': props.entityId || props.id }, props.name);
const originalLoad = Module._load;
Module._extensions['.ts'] = Module._extensions['.tsx'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, filename);
Module._extensions['.css'] = () => { };
Module._load = function (request, parent, isMain) {
  if (request === 'react-dom' && parent?.filename.endsWith('PostOptions.tsx'))
    return { createPortal: child => child };
  if (request === '@/reusables/hooks/useScopedPortalRoot')
    return { useScopedPortalRoot: () => document.body };
  if (request === 'react' && parent?.filename.endsWith('EditPost.tsx')) {
    return { ...React, useState: value => React.useState(typeof value === 'function'
      ? [{ key: 'new', src: 'blob:fixture', mime: 'image/jpeg', name: 'photo.jpg', file: new dom.window.File(['photo'], 'photo.jpg', { type: 'image/jpeg' }) }]
      : value) };
  }
  if (request === 'react' && parent?.filename.endsWith('PostOptions.tsx')) {
    let count = 0;
    resetHooks.push(() => count = 0);
    return { ...React, useState: value => React.useState(count++ === 0 && showMenus ? true : value) };
  }
  if (request === 'react' && parent?.filename.endsWith('PostItem.tsx')) {
    let count = 0;
    resetHooks.push(() => count = 0);
    return { ...React, useState: value => React.useState(value === null ? false : count++ === 0 && mediaModal ? true : value) };
  }
  if (request === 'react' && parent?.filename.endsWith('PostComment.tsx')) {
    let count = 0;
    resetHooks.push(() => count = 0);
    return { ...React, useState: value => { const n = count++; return React.useState(n === 0 ? { count: commentRows.length, results: commentRows, next: null, previous: null } : n === 1 ? true : value); } };
  }
  if (request === 'react-redux')
    return { useSelector: fn => fn({ authentication: auth, emojilist: [], screensizelistener: { W: 1200, H: 900 } }) };
  if (request === 'react-router-dom')
    return { useNavigate: () => () => { }, useLocation: () => ({ pathname: previewPath, search: '' }) };
  if (request === 'framer-motion')
    return { useInView: () => inView, motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }) => React.createElement(tag, { className: props.className }, children) }) };
  if (request === '@/reusables/design')
    return { Card: plain, Icon: () => null, Avatar: avatar, PageFlag: () => null, BotFlag: () => null };
  if (request === '@/reusables/hooks/requests')
    return {
      UpdatePostRequest: async (id) => ({ status: true, post: { post_id: id } }),
      CommentTypingBroadcastRequest() {},
      GetCommentsRequest: async () => ({ count: 0, results: [], next: null, previous: null }),
      NetworkOverviewRequest: async () => ({ connections: { results: mentionPeople }, following: { results: [] } }),
      SaveCommentRequest: (...args) => new Promise((resolve, reject) => commentSaves.push({ args, resolve, reject })),
    };
  if (request === '@/reusables/hooks/mediaUpload')
    return { uploadFiles: async (options) => { editUploads.push(options); return [{ fileUrl: '/anonymous/photo.jpg' }]; } };
  if (request === './PostEditLayout')
    return { __esModule: true, default: ({ footer, children }) => { editFooter = footer; return children; } };
  if (request === '@/reusables/hooks/hashtags')
    return { highlightHashtags: x => x, useHashtagNavigation: () => ({}) };
  if (request === '@/reusables/hooks/reusable')
    return { timeSince: () => 'just now', getActiveAvatar: () => ({}) };
  if (request === '@/reusables/hooks/postUpdates')
    return { usePostUpdate: () => { }, publishPostUpdate() { } };
  if (request === '@/reusables/hooks/localforagehelper')
    return { persistViewPosts: (id, data) => viewEvents.push({ id, data }) };
  if (request === '@/reusables/hooks/postRealtime')
    return { usePostActivityStream: () => { } };
  if (request === '@/reusables/hooks/useLinkPreview')
    return { useLinkPreview: () => ({ dismiss() { } }) };
  if (request === '@/reusables/hooks/errormessages')
    return {};
  if (request === '@/reusables/hooks/env_configs')
    return { __esModule: true, default: { USER_SERVICE_API: 'https://fixture.invalid' } };
  if (request === '@/redux/actions/states')
    return { commentsliststate: { results: [] } };
  if (request === '@/app/reusables/HashtagField')
    return { __esModule: true, default: plain };
  if (request === 'dompurify')
    return { __esModule: true, default: { sanitize: x => x } };
  if (request === 'react-responsive-carousel')
    return { Carousel: plain };
  if (request === '@/app/reusables/Modal')
    return { __esModule: true, default: props => props.component || props.content || props.children || null };
  if (/(?:NewPostModal|SendPostModal|CreateMomentModal|EditPost|ChangePostAudience|EditTagsModal|ReportModal|MessageContent|HashtagField|PostEmojis|LinkPreviewCard|FeedReasonBanner|CachedImage|VideoPlayer|FittedPostMedia|OverlayLoader|OverlayMessage|PostCommentLoader|SharePostButton|LoadedPostItem)$/.test(request))
    return { __esModule: true, default: () => null, NewPostModal: () => null };
  if (request.startsWith('@/'))
    request = path.join(root, request.slice(2));
  return originalLoad.call(this, request, parent, isMain);
};
const PostItem = require('../src/app/tabs/profile/user/PostItem.tsx').default;
const { CommunityPostScope } = require('../src/app/reusables/CommunityPostScope.ts');
const SavedPostItem = require('../src/app/tabs/profile/user/SavedPostItem.tsx').default;
const PostPreviewModal = require('../src/app/tabs/profile/user/PostPreviewModal.tsx').default;
const PostOptions = require('../src/app/tabs/profile/user/PostOptions.tsx').default;
const PostComment = require('../src/app/widgets/items/PostComment.tsx').default;
const ContentCard = require('../src/app/tabs/search/partials/ContentCard.tsx').default;
const RemovedPostPreview = require('../src/app/tabs/moderation/RemovedPostPreview.tsx').default;
const { SharedPostCard } = require('../src/app/tabs/moments/CreateMomentModal.tsx');
const EditPost = require('../src/app/widgets/modals/EditPost/EditPost.tsx').default;
const PostDestination = require('../src/app/reusables/PostDestination.tsx').default;
const community = { realm_id: 'realm-community', entity_id: 'community', name: 'Garden Club', slug: 'garden-club', profile: 'none', is_private: false, is_member: true };
const person = { id: 'author', type: 'user', details: { id: 'author-user', username: 'author', first_name: 'Alice', middle_name: 'N/A', last_name: 'Member', profile: 'none' } };
const post = overrides => ({ post_id: 'post', caption: 'A contribution', entity: person, tagging: [], references: [], preview: [], score: { comments_count: 0, shares_count: 0 }, is_archived: false, is_shared: false, privacy_status: 'public', date_posted: '2026-10-25T00:00:00Z', content_type: 'text', on_feed: 'feed', ...overrides });
const anonymous = post({ entity: null, is_anonymous: true, is_owner: true, community, entity_reaction: 'emoji', entity_reaction_is_anonymous: true });
const render = (component, props) => { resetHooks.forEach(reset => reset()); return renderToStaticMarkup(React.createElement(component, props)); };
function assertAnonymous(html) { assert.match(html, /Anonymous member/); assert.doesNotMatch(html, /Alice|\/author|data-avatar-id="(?:author|undefined|null)"/); }

test('destination hides inside its community and on community-authored media', () => {
  const scoped = renderToStaticMarkup(React.createElement(CommunityPostScope.Provider,
    { value: community.entity_id }, React.createElement(PostDestination, { post: anonymous })));
  assert.doesNotMatch(scoped, /posted in/);
  assert.match(render(PostDestination, { post: anonymous }), /posted in/);
  const media = post({ community, content_type: 'cover_photo', entity: {
    id: community.entity_id, type: 'realm', details: { type: 'community', name: community.name },
  } });
  assert.doesNotMatch(render(PostDestination, { post: media }), /posted in/);
});

test('reaction buttons disappear for private nonmembers and remain for public visitors', () => {
  for (const component of [PostItem, PostPreviewModal]) {
    for (const is_private of [true, false]) {
      const value = post({ community: { ...community, is_private, is_member: false } });
      const props = component === PostItem
        ? { mp: value, isSharePreview: false }
        : { post: value, asPage: true, setPost() {}, onClose() {}, onShare() {} };
      const html = render(component, props);
      assert.equal(html.includes('aria-label="React"'), !is_private);
    }
  }
});

test('community destination identifies its kind and only shows earned verification', () => {
  for (const is_verified of [true, false, undefined]) {
    const html = render(PostDestination, { post: post({ community: { ...community, is_verified } }) });
    assert.match(html, /aria-label="Community"/);
    assert.equal(html.includes('aria-label="Verified community"'), is_verified === true);
    assert.match(html, /Garden Club/);
  }
});

test('community media updates retain their realm avatar and atomic community author name', () => {
  mediaModal = false;
  const mediaPost = post({
    community,
    content_type: 'cover_photo',
    entity: { id: 'community', type: 'realm', details: {
      id: 'realm-community', realm_id: 'realm-community', type: 'community',
      name: 'Garden Club', slug: 'garden-club', profile: '/community.jpg', is_verified: true,
    } },
  });
  const html = render(PostItem, { mp: mediaPost, isSharePreview: false });
  assert.match(html, /data-avatar-id="community"/);
  assert.match(html, /changed cover photo/);
  assert.match(html, /cl-community-name--compact/);
  assert.match(html, /aria-label="Community"/);
});
test('actual post card renders a null anonymous author without a profile identity', () => { assertAnonymous(render(PostItem, { mp: anonymous, isSharePreview: false })); });
test('media modal header renders the same anonymous identity', () => { mediaModal = true; try {
  assertAnonymous(render(PostItem, { mp: { ...anonymous, references: [{ reference_id: 'image', reference: '/photo.jpg', reference_media_type: 'image/jpeg' }] }, isSharePreview: false }));
}
finally {
  mediaModal = false;
} });
test('saved and full post previews accept null authors', () => { assertAnonymous(render(SavedPostItem, { savedPost: { id: 'save', post: anonymous } })); assertAnonymous(render(PostPreviewModal, { post: anonymous, asPage: true, setPost() { }, onClose() { }, onShare() { } })); });
test('server ownership retains edit and delete and community audience is not editable', () => { showMenus = true; try {
  const html = render(PostOptions, { post: anonymous, onProcess() { }, onFinish() { }, onError() { } });
  assert.match(html, /Edit post/);
  assert.match(html, /Delete/);
  assert.doesNotMatch(html, /Change audience|Report/);
  const other = render(PostOptions, { post: { ...anonymous, is_owner: false }, onProcess() { }, onFinish() { }, onError() { } });
  assert.doesNotMatch(other, /Edit post|Delete/);
  assert.match(other, /Report/);
}
finally {
  showMenus = false;
} });
test('real comment rows render anonymous without substituting the viewer', () => { commentRows = [{ comment_id: 'comment', text: 'Anonymous response', entity: null, is_anonymous: true, is_owner: true, created_at: '2026-10-25T00:00:00Z', post: 'post' }]; try {
  assertAnonymous(render(PostComment, { post_id: 'post', parent_id: null }));
}
finally {
  commentRows = [];
} });
test('ordinary user and page cards retain named author rendering', () => { assert.match(render(PostItem, { mp: post(), isSharePreview: true }), /Alice/); assert.match(render(PostItem, { mp: post({ entity: { id: 'page', type: 'realm', details: { slug: 'flower-shop', name: 'Flower Shop', profile: 'none' } } }), isSharePreview: true }), /Flower Shop/); });
test('search, shared-moment, and moderation previews preserve anonymous presentation', () => {
  assertAnonymous(render(ContentCard, {
    post: { ...anonymous, author: null, likes_count: 0, comments_count: 0 },
    onOpen() { },
  }));
  assertAnonymous(render(SharedPostCard, { post: anonymous }));
  assertAnonymous(render(RemovedPostPreview, {
    content: { type: 'post', ...anonymous, is_removed: true },
  }));
});
test('community destination is distinct from ordinary tags and private audience is accurate', () => {
  const { posts } = require('./fixtures/community-stage1.json');
  const named = render(PostItem, { mp: posts.find(post => post.post_id === 'named-community'), isSharePreview: true });
  assert.match(named, /posted in/);
  assert.doesNotMatch(named, /is with/);
  const mixed = render(PostItem, { mp: posts.find(post => post.post_id === 'anonymous-owner'), isSharePreview: true });
  assert.match(mixed, /is with/);
  assert.match(mixed, /The Garden Studio/);
  assert.match(mixed, /posted in/);
  const privatePost = render(PostItem, { mp: posts.find(post => post.post_id === 'anonymous-visitor'), isSharePreview: true });
  assert.match(privatePost, /aria-label="Private community"/);
  assert.doesNotMatch(privatePost, /aria-label="Public"/);
});
test('existing anonymous owner editor gives fresh attachments anonymous upload context', async () => {
  editUploads = [];
  render(EditPost, { post: anonymous, onClose() { } });
  await React.Children.toArray(editFooter.props.children).at(-1).props.onClick();
  assert.equal(editUploads.length, 1);
  assert.deepEqual(editUploads[0].context, { community_entity_id: community.entity_id, is_anonymous: true });
  editUploads = [];
  render(EditPost, { post: post(), onClose() { } });
  await React.Children.toArray(editFooter.props.children).at(-1).props.onClick();
  assert.equal(editUploads.length, 1);
  assert.equal(editUploads[0].context, undefined);
});
test('community destination without a slug is readable and opens its canonical route', () => {
  const html = render(PostDestination, { post: { ...anonymous, community: { ...community, slug: null } } });
  assert.match(html, /posted in/);
  assert.match(html, /Garden Club/);
  assert.match(html, /href="\/realm-community"/);
});
test('anonymous feed views are recorded without inventing an author', () => {
  const { render: mount, cleanup } = require('@testing-library/react');
  inView = true;
  const check = (mp, pathname, ownerId) => {
    viewEvents = [];
    previewPath = pathname;
    resetHooks.forEach(reset => reset());
    const mounted = mount(React.createElement(PostItem, { mp, isSharePreview: false }));
    try {
      if (ownerId === null)
        assert.equal(viewEvents.length, 0);
      else {
        assert.ok(viewEvents.length > 0);
        assert.equal(viewEvents[0].id, mp.post_id);
        assert.equal(viewEvents[0].data.post_owner_id, ownerId);
      }
    }
    finally {
      mounted.unmount();
      cleanup();
    }
  };
  try {
    check({ ...anonymous, is_owner: false }, '/', '');
    check(anonymous, '/', '');
    check(anonymous, '/garden-club', null);
    check(post(), '/', 'author');
    check(post({ entity: { ...person, id: 'viewer' } }), '/viewer', null);
  }
  finally {
    inView = false;
    previewPath = '/fixture';
  }
});

test('Enter sends top-level comments and replies once and clears a successful draft', async () => {
  const { render: mount, cleanup, fireEvent, act } = require('@testing-library/react');
  for (const parentId of [null, 'parent-comment']) {
    commentSaves = [];
    resetHooks.forEach(reset => reset());
    let posted = 0;
    const mounted = mount(React.createElement(PostComment, {
      post_id: 'post', parent_id: parentId, onCommentPosted: () => posted++,
    }));
    try {
      const field = mounted.getByPlaceholderText(parentId ? 'Write a reply...' : 'Write a comment...');
      fireEvent.change(field, { target: { value: 'First line\nSecond line' } });
      fireEvent.keyDown(field, { key: 'Enter' });
      fireEvent.keyDown(field, { key: 'Enter', repeat: true });
      assert.equal(commentSaves.length, 1);
      assert.deepEqual(commentSaves[0].args, ['post', parentId, 'First line\nSecond line', null]);
      await act(async () => { commentSaves[0].resolve(); });
      assert.equal(field.value, '');
      assert.equal(posted, 1);
    } finally {
      mounted.unmount();
      cleanup();
    }
  }
});

test('Shift+Enter retains the browser newline behavior; IME and empty drafts never send', () => {
  const { render: mount, cleanup, fireEvent } = require('@testing-library/react');
  commentSaves = [];
  resetHooks.forEach(reset => reset());
  const mounted = mount(React.createElement(PostComment, { post_id: 'post', parent_id: null }));
  try {
    const field = mounted.getByPlaceholderText('Write a comment...');
    fireEvent.change(field, { target: { value: 'Draft' } });
    assert.equal(fireEvent.keyDown(field, { key: 'Enter', shiftKey: true }), true);
    fireEvent.keyDown(field, { key: 'Enter', isComposing: true });
    fireEvent.keyDown(field, { key: 'Enter', keyCode: 229 });
    fireEvent.change(field, { target: { value: '   ' } });
    fireEvent.keyDown(field, { key: 'Enter' });
    assert.equal(commentSaves.length, 0);
  } finally {
    mounted.unmount();
    cleanup();
  }
});

test('Enter chooses an active mention before sending and Shift+Enter still allows a newline', async () => {
  const { render: mount, cleanup, fireEvent, act, waitFor } = require('@testing-library/react');
  commentSaves = [];
  mentionPeople = [{ entity_id: 'mika', handle: 'mika', name: 'Mika Santos' }];
  resetHooks.forEach(reset => reset());
  const mounted = mount(React.createElement(PostComment, { post_id: 'post', parent_id: null }));
  try {
    const field = mounted.getByPlaceholderText('Write a comment...');
    await act(async () => {
      fireEvent.change(field, { target: { value: '@', selectionStart: 1 } });
    });
    await waitFor(() => assert.ok(mounted.getByText('@mika')));
    fireEvent.keyDown(field, { key: 'Enter', isComposing: true });
    assert.equal(field.value, '@');
    assert.equal(fireEvent.keyDown(field, { key: 'Enter', shiftKey: true }), true);
    fireEvent.keyDown(field, { key: 'Enter' });
    assert.equal(field.value, '@mika ');
    assert.equal(commentSaves.length, 0);
  } finally {
    mentionPeople = [];
    mounted.unmount();
    cleanup();
  }
});
