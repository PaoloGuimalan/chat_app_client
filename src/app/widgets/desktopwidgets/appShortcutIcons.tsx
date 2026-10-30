import { FcPuzzle, FcSettings } from 'react-icons/fc';
import { TbServer2 } from 'react-icons/tb';
import { RiPagesFill, RiBook2Fill, RiStickyNoteFill, RiClapperboardFill, RiVideoChatFill } from 'react-icons/ri';
import { Icon } from "@/reusables/design/primitives";

// Source for web rendering and the generated native Apps icon assets.
// After changing an icon, run chatterloop_app/tool/sync_web_app_icons.cjs.
export const appShortcutIcons = {
  settings: <FcSettings />,
  servers: <TbServer2 color="#e69500" />,
  pages: <RiPagesFill color="#4997f2" />,
  community: <Icon n="groups" s={30} c="#4997f2" />,
  diary: <RiBook2Fill color="#b56bd6" />,
  notes: <RiStickyNoteFill color="#e69500" />,
  conference: <RiVideoChatFill color="#1c7def" />,
  extension: <FcPuzzle />,
  studio: <RiClapperboardFill color="#1c7def" />,
};
