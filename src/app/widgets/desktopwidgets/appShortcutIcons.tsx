import { FcPuzzle, FcSettings } from 'react-icons/fc';
import { TbServer2 } from 'react-icons/tb';
import { RiPagesFill, RiBook2Fill, RiStickyNoteFill } from 'react-icons/ri';

// Source for web rendering and the generated native Apps icon assets.
// After changing an icon, run chatterloop_app/tool/sync_web_app_icons.cjs.
export const appShortcutIcons = {
  settings: <FcSettings />,
  servers: <TbServer2 color="#e69500" />,
  pages: <RiPagesFill color="#4997f2" />,
  diary: <RiBook2Fill color="#b56bd6" />,
  notes: <RiStickyNoteFill color="#e69500" />,
  extension: <FcPuzzle />,
};
