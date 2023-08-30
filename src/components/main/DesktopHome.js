import React from 'react'
import '../../styles/main/index.css'
import Contacts from '../tabs/feed/Contacts'
import Notifications from '../tabs/feed/Notifications'
import Messages from '../tabs/feed/Messages'
import Feed from '../tabs/feed/Feed'

function DesktopHome({togglerightwidget}) {
  return (
    <div id='div_main_home'>
        <Contacts />
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