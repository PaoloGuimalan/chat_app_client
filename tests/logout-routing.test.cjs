const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { createStore } = require('redux');
const { Provider } = require('react-redux');
const router = require('react-router-dom');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<html><body></body></html>', { url: 'https://fixture.test' });
Object.assign(global, { window: dom.window, document: dom.window.document,
  localStorage: dom.window.localStorage });
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
const { render, cleanup, fireEvent, waitFor } = require('@testing-library/react');
afterEach(cleanup);

const sourceRoot = path.join(__dirname, '../src');
function evaluate(source, imports, extras = {}) {
  const module = { exports: {} };
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(compiled, {
    module, exports: module.exports, window, document, localStorage,
    console: { log() {} }, ...extras,
    require(name) {
      if (name in imports) return imports[name];
      if (name.endsWith('.css')) return {};
      if (['react', 'react/jsx-runtime', 'react-redux', 'react-router-dom'].includes(name)) return require(name);
      throw new Error(`Unmocked import ${name}`);
    },
  });
  return module.exports;
}

function mount(initialPath, signedIn = true) {
  const authentication = { auth: signedIn, user: {
    entity_id: 'manager', isVerified: true, isComplete: true,
  } };
  const store = createStore((state = { authentication, alerts: [], screensizelistener: { W: 1200, H: 800 } }, action) =>
    action.type === 'SET_AUTHENTICATION'
      ? { ...state, authentication: action.payload.authentication }
      : state);
  const requests = fs.readFileSync(path.join(sourceRoot, 'reusables/hooks/requests.ts'), 'utf8');
  const start = requests.indexOf('const LogoutRequest =');
  const end = requests.indexOf('\n/**', start);
  const { logout } = evaluate(requests.slice(start, end) + '\nexports.logout = LogoutRequest;', {}, {
    SET_AUTHENTICATION: 'SET_AUTHENTICATION', authenticationstate: authentication,
  });
  const logoutButton = () => React.createElement('button', { onClick: () => logout(store.dispatch) }, 'Log out');
  const stub = text => ({ __esModule: true, default: () => React.createElement('p', null, text) });
  const profilePaths = evaluate(fs.readFileSync(path.join(sourceRoot, 'reusables/routing/profilePaths.ts'), 'utf8'), {});
  const App = evaluate(fs.readFileSync(path.join(sourceRoot, 'App.tsx'), 'utf8'), {
    './app/main/Home': { __esModule: true, default: logoutButton },
    './app/tabs/profile/ProfileContainer': { __esModule: true, default: () => React.createElement('div', null, 'Public profile', signedIn && logoutButton()) },
    './app/conference/ConferenceContainer': { __esModule: true, default: logoutButton },
    './app/auth/Login': stub('Login screen'), './app/auth/Register': stub('Register'),
    './app/auth/Verification': { __esModule: true, default: logoutButton },
    './app/auth/Setup': { __esModule: true, default: logoutButton },
    './app/main/Splash': stub('Loading'), './app/widgets/Alert': stub('Alert'),
    './app/legal/PolicyPage': stub('Policy'), './app/legal/DeleteAccount': stub('Delete'),
    './app/legal/Support': stub('Support'),
    './reusables/hooks/requests': { AuthCheck() {} },
    './reusables/vars/uploads': { loadMediaConfig() {} },
    './redux/types': {
      SET_PATHNAME_LISTENER: 'PATH', SET_SCREEN_SIZE_LISTENER: 'SIZE', SET_MUTATE_ALERTS: 'ALERT',
    },
    './reusables/hooks/studio': { consumeStudioMomentNotice() {} },
    './reusables/hooks/env_configs': { __esModule: true, default: {} },
    './reusables/routing/profilePaths': profilePaths,
    './reusables/routing/useProfilePaths': { useProfilePathsVersion() {} },
  }).default;
  function Location() {
    const location = router.useLocation();
    return React.createElement('output', { 'data-testid': 'path' }, location.pathname + location.search);
  }
  localStorage.setItem('authtoken', 'fixture-token');
  window.history.replaceState({}, '', initialPath);
  return render(React.createElement(Provider, { store },
    React.createElement(router.MemoryRouter, { initialEntries: [initialPath] },
      React.createElement(App), React.createElement(Location))));
}

test('logout always replaces the current route with login, without a profile or next redirect', async () => {
  for (const route of ['/communities', '/garden-club', '/notifications', '/conference', '/share/garden-club']) {
    const view = mount(route);
    fireEvent.click(view.getByRole('button', { name: 'Log out' }));
    await waitFor(() => assert.equal(view.getByTestId('path').textContent, '/login', route));
    assert.ok(view.getByText('Login screen'));
    assert.equal(localStorage.getItem('authtoken'), null);
    view.unmount();
  }
});

test('a direct guest profile visit still opens the public profile', async () => {
  const view = mount('/garden-club', false);
  await waitFor(() => assert.equal(view.getByTestId('path').textContent, '/share/garden-club'));
  assert.ok(view.getByText('Public profile'));
  assert.equal(view.queryByText('Login screen'), null);
});
