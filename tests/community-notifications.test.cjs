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
      Avatar: () => null,
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
  assert.doesNotMatch(community, /data-marker="page"/);
  assert.match(render('page'), /data-marker="page"/);
  assert.match(render(undefined), /data-marker="page"/);
});
