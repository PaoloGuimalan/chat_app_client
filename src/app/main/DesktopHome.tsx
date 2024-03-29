import '../../styles/styles.css'
// import Contacts from '../tabs/feed/Contacts'
import Notifications from '../tabs/feed/Notifications'
import Messages from '../tabs/feed/Messages'
import Feed from '../tabs/feed/Feed'
import LeftContainers from './Desktop/LeftContainers'

function DesktopHome({togglerightwidget}: any) {
  return (
    <div id='div_main_home'>
        <LeftContainers />
        <Feed />
        {togglerightwidget == "notifs"? (
          <Notifications />
        ) : (
          <Messages />
        )}
    </div>
  )
}

export default DesktopHome