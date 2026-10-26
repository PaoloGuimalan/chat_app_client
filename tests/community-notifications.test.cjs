const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const filename = path.join(__dirname, '../src/app/tabs/feed/partials/NotificationRow.tsx');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const moduleFixture = { exports: {} };
vm.runInNewContext(compiled, {
  module: moduleFixture,
  exports: moduleFixture.exports,
  require(name) {
    if (name === 'react/jsx-runtime') return require(name);
    if (name === '@/reusables/design') return {
      Avatar: ({ name, src }) => React.createElement('span', { 'data-avatar-name': name, 'data-avatar-src': src }),
      BotFlag: () => null,
      Btn: () => null,
      PageFlag: () => React.createElement('span', { 'data-marker': 'page' }),
      Icon: ({ n }) => React.createElement('span', { 'data-icon': n }),
    };
    if (name.endsWith('/reusable')) return { timeSince: () => 'Now' };
    if (name.endsWith('/notificationActions')) return {
      isRunnable: () => false,
      webActions: () => [],
      webRedirect: () => null,
    };
    return {};
  },
});

test('notification community markers preserve verification and page fallback', () => {
  const render = (realmType) => renderToStaticMarkup(React.createElement(
    moduleFixture.exports.default,
    {
      notification: {
        type: 'post_comment',
        fromUser: {
          type: 'realm', realm_type: realmType, display_name: 'Garden Club',
          handle: 'garden', is_verified: true,
        },
        content: { headline: 'Activity', details: 'posted a comment' },
        date: { date: '2026-10-25' },
      },
      actionBusy: false,
      onAccept() {},
      onDecline() {},
    },
  ));
  const community = render('community');
  assert.match(community, /aria-label="Community"/);
  assert.match(community, /data-icon="verified"/);
  assert.match(community, /class="cl-notification-sender"/);
  assert.doesNotMatch(community, /data-marker="page"/);
  assert.match(render('page'), /data-marker="page"/);
  assert.match(render(undefined), /data-marker="page"/);
});

test('community activity uses the normalized actor avatar or anonymous community avatar', () => {
  for (const anonymous of [false, true]) {
    const html = renderToStaticMarkup(React.createElement(moduleFixture.exports.default, {
      notification: {
        type: 'post_comment', community_entity_id: 'community', is_anonymous: anonymous,
        fromUser: anonymous
          ? { type: 'realm', realm_type: 'community', display_name: 'Garden Club', profile: '/community.jpg' }
          : { type: 'user', display_name: 'Mika Santos', profile: '/mika.jpg' },
        content: { headline: 'Activity', details: 'commented in your community.' },
        date: { date: '2026-10-26' },
      },
      actionBusy: false, onAccept() {}, onDecline() {},
    }));
    assert.match(html, anonymous ? /data-avatar-src="\/community.jpg"/ : /data-avatar-src="\/mika.jpg"/);
    assert.doesNotMatch(html, anonymous ? /mika.jpg/ : /community.jpg/);
  }
});
