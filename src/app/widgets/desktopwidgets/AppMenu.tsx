/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { PiListBold } from 'react-icons/pi';
import AppShortcuts from './AppShortcuts';

export default function AppMenu() {
  const pathname = useSelector((state: any) => state.pathnamelistener);
  const screen = useSelector((state: any) => state.screensizelistener);
  const inMenu = pathname.includes('contacts') || pathname.includes('user');
  return <motion.div id="div_app_menu" animate={{ display: inMenu || screen.W > 1100 ? 'flex' : 'none', maxWidth: inMenu ? '600px' : '350px' }}>
    <div id="div_app_menu_label_container">
      <PiListBold style={{ fontSize: '24px', color: 'var(--brand)' }} />
      <span className="span_contacts_label tw-text-[var(--text-2)]">Apps</span>
    </div>
    <AppShortcuts />
  </motion.div>;
}
