const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<html><body></body></html>', { url: 'https://fixture.test' });
Object.assign(global, { window: dom.window, document: dom.window.document });
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
const ui = require('@testing-library/react');
const state = { actor: 'owner', token: 'token', calls: [], errors: [], notices: [] };
const client = new Proxy({}, { get: (_, method) => (...args) => new Promise((resolve, reject) => state.calls.push({ method, args, resolve, reject })) });
function load(relative, overrides = {}) {
  const module = { exports: {} };
  const file = path.join(__dirname, '../src', relative);
  if (!fs.existsSync(file)) return {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText, {
    module, exports: module.exports, document, window, CustomEvent: dom.window.CustomEvent,
    localStorage: { getItem: () => state.token }, URL, console,
    require(name) {
      if (name in overrides) return overrides[name];
      if (name === 'react' || name === 'react/jsx-runtime') return require(name);
      if (name.startsWith('react-icons/')) return require(name);
      if (name === 'react-redux') return { useSelector: fn => fn({ authentication: { user: { entity_id: state.actor } } }) };
      if (name === 'react-router-dom') return { useSearchParams: () => [new URLSearchParams(), () => {}], useNavigate: () => () => {}, useLocation: () => ({ pathname: '/', search: '' }) };
      if (name === '@/reusables/hooks/communityRequests') return client;
      if (name === '@/reusables/hooks/requests') return client;
      if (name.endsWith('/useScopedPortalRoot')) return { useScopedPortalRoot: () => document.body };
      if (name.endsWith('/contributionIdentity')) return load('reusables/hooks/contributionIdentity.ts');
      if (['/ReportModal', '/EditTagsModal', '/EditPost', '/ChangePostAudience'].some(suffix => name.endsWith(suffix))) return { __esModule: true, default: () => null };
      if (name === '@/reusables/hooks/errormessages') return { notifyRequestError: (...args) => state.errors.push(args), notify: (...args) => state.notices.push(args) };
      if (name.endsWith('/CommunityPostScope')) return { CommunityPostScope: React.createContext(null) };
      if (name.endsWith('/ContributionAuthor')) return { ContributionAvatar: () => null,
        ContributionName: ({ entity }) => React.createElement('span', null, entity?.details?.first_name || entity?.details?.name || 'Someone') };
      if (name.endsWith('/ReviewReasonModal')) return { __esModule: true, default: load('app/widgets/modals/ReviewReasonModal.tsx').default };
      if (name.endsWith('/PostItem')) return { __esModule: true, default: ({ mp }) => React.createElement('article', { 'data-read-only': mp.read_only }, mp.caption) };
      if (name.endsWith('/Modal')) return { __esModule: true, default: ({ component }) => component };
      if (name.endsWith('/ConfirmModal')) return { __esModule: true, default: ({ title, onConfirm, onClose, confirmLabel }) => React.createElement('div', { role: 'dialog' }, title,
        React.createElement('button', { onClick: onConfirm }, confirmLabel), React.createElement('button', { onClick: onClose }, 'Cancel')) };
      if (name === '@/reusables/design') return {
        Card: ({ children, ...props }) => React.createElement('div', { className: props.className }, children),
        Btn: ({ children, onClick, disabled, type, ...props }) => React.createElement('button', { onClick, disabled, type, 'aria-label': props['aria-label'] }, children),
        SegTabs: ({ tabs, value, onChange }) => React.createElement('div', null, tabs.map(tab => React.createElement('button', { key: tab.key, onClick: () => onChange(tab.key) }, tab.label))),
        Icon: () => null,
      };
      if (name === 'react-loading-skeleton') return { __esModule: true, default: () => React.createElement('span', null, 'Loading'), SkeletonTheme: ({ children }) => children };
      if (name.endsWith('.css')) return {};
      throw new Error(`Unmocked ${name}`);
    },
  });
  return module.exports;
}
function reset() { state.actor = 'owner'; state.token = 'token'; state.calls = []; state.errors = []; state.notices = []; }
module.exports = { load, state, reset, React, ...ui };
