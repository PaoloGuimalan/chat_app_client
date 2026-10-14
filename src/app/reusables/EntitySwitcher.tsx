import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Avatar, useTheme } from '@/reusables/design';
import AccountMenuContent from './AccountMenuContent';
import AppShortcuts from '../widgets/desktopwidgets/AppShortcuts';

// The desktop rail avatar is the single entry point for profile and accounts.
export default function EntitySwitcher({ onProfileClick, profileSrc, profileName, size = 38 }: {
  onProfileClick: () => void; profileSrc?: string; profileName?: string; size?: number;
}) {
  const { theme } = useTheme();
  const reducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, bottom: 12 });
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const switching = useRef(false);
  const close = useCallback(() => {
    if (switching.current) return;
    setOpen(false); trigger.current?.focus();
  }, []);

  useEffect(() => { setOpen(false); }, [location.pathname]);
  useLayoutEffect(() => {
    if (menu.current) {
      menu.current.inert = !open;
      menu.current.setAttribute('aria-hidden', String(!open));
    }
    if (!open) return;
    const place = () => {
      const rect = trigger.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(320, window.innerWidth - 24);
      const next = { left: Math.max(12, Math.min(rect.right + 12, window.innerWidth - width - 12)),
        bottom: Math.max(12, window.innerHeight - rect.bottom) };
      setPosition((current) => current.left === next.left && current.bottom === next.bottom ? current : next);
    };
    const dismiss = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!trigger.current?.contains(target) && !menu.current?.contains(target)) close();
    };
    const keyboard = (event: KeyboardEvent) => {
      if (switching.current) {
        if (['Escape', 'Tab', 'Enter', ' '].includes(event.key)) event.preventDefault();
        return;
      }
      if (event.key === 'Escape') { event.preventDefault(); close(); }
      if (event.key !== 'Tab') return;
      const buttons = menu.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
      if (!buttons?.length) return;
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    place();
    menu.current?.querySelector('button')?.focus();
    document.addEventListener('mousedown', dismiss);
    document.addEventListener('keydown', keyboard);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      document.removeEventListener('mousedown', dismiss);
      document.removeEventListener('keydown', keyboard);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, close]);

  return <>
    <button ref={trigger} type="button" className="cl-main-rail__profile cl-account-trigger" title="Account menu"
      aria-label="Account menu" aria-haspopup="dialog" aria-expanded={open} onClick={() => { if (!switching.current) setOpen((value) => !value); }}>
      <Avatar id={profileName} name={profileName} src={profileSrc} size={size} online />
    </button>
    {createPortal(<AnimatePresence>
      {open && <motion.div key="account-menu" ref={menu} role="dialog" aria-label="Account menu" data-theme={theme} className="cl-redesign cl-account-popover scroller"
      initial={{ opacity: 0, x: reducedMotion ? 0 : -6, y: reducedMotion ? 0 : 6, scale: reducedMotion ? 1 : 0.98 }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1, pointerEvents: "auto", transition: { duration: reducedMotion ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] } }}
      exit={{ opacity: 0, x: reducedMotion ? 0 : -3, y: reducedMotion ? 0 : 3, scale: reducedMotion ? 1 : 0.98,
        pointerEvents: "none", transition: { duration: reducedMotion ? 0 : 0.12, ease: "easeOut" } }}
      style={{ left: position.left, bottom: position.bottom, maxHeight: window.innerHeight - position.bottom - 12, transformOrigin: "left bottom" }}>
      <AccountMenuContent onProfileClick={onProfileClick} onClose={close} onSwitchingChange={(value) => { switching.current = value; }} compact />
      <section className="cl-account-section" aria-label="Apps">
        <h2 className="cl-account-section-title">Apps</h2>
        <AppShortcuts layout="rail" hideSettings onNavigate={close} />
      </section>
      </motion.div>}
    </AnimatePresence>, document.body)}
  </>;
}
