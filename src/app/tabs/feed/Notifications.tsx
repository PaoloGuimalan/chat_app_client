import { useEffect, useState } from 'react'
import '../../../styles/styles.css'
import { AiOutlineBell, AiOutlineLoading3Quarters } from 'react-icons/ai'
import { useDispatch, useSelector } from 'react-redux'
import { AcceptContactRequest, DeclineContactRequest, NotificationInitRequest, ReadNotificationsRequest } from '../../../reusables/hooks/requests'
import { motion } from 'framer-motion'
import DefaultProfile from '../../../assets/imgs/default.png'

function Notifications() {

  const [isLoading, setisLoading] = useState(true)
  const [isDisabledByRequest, setisDisabledByRequest] = useState(false)

  const notificationslist = useSelector((state: any) => state.notificationslist);
  const screensizelistener = useSelector((state: any) => state.screensizelistener);
  const pathnamelistener = useSelector((state: any) => state.pathnamelistener)
  const alerts = useSelector((state: any) => state.alerts)
  const dispatch = useDispatch()

  useEffect(() => {
    NotificationInitRequest(dispatch, setisLoading);
  },[])

  useEffect(() => {
    ReadNotificationsRequest();
  },[notificationslist.list.length])

  const declineRequestProcess = (ntfsType: any, ntfsID: any, refID: any, reverttoUserID: any, revertfromUserID: any) => {
    setisDisabledByRequest(true)
    DeclineContactRequest({
      type: ntfsType,
      notificationID: ntfsID,
      referenceID: refID,
      toUserID: revertfromUserID,
      fromUserID: reverttoUserID
    }, dispatch, alerts, setisDisabledByRequest)
  }

  const acceptRequestProcess = (ntfsType: any, ntfsID: any, refID: any, reverttoUserID: any, revertfromUserID: any) => {
    setisDisabledByRequest(true)
    AcceptContactRequest({
      type: ntfsType,
      notificationID: ntfsID,
      referenceID: refID,
      toUserID: revertfromUserID,
      fromUserID: reverttoUserID
    }, dispatch, alerts, setisDisabledByRequest)
  }

  return (
    <motion.div
    animate={{
        display: pathnamelistener.includes("notifications")? "flex" : screensizelistener.W <= 900? "none" : "flex",
        maxWidth: pathnamelistener.includes("notifications")? "600px" : screensizelistener.W <= 900? "350px" : "350px"
    }}
    id='div_notifications_main'>
      <div id='div_notifications_label_container'>
        <AiOutlineBell style={{fontSize: "20px", color: "#b66a00", backgroundColor: "#f2a43a", borderRadius: "7px", padding: "3px"}} />
        <span className='span_notifications_label'>Notifications</span>
      </div>
      {isLoading? (
        <div id='div_isLoading_notifications'>
          <motion.div
            animate={{
              rotate: -360
            }}
            transition={{
              duration: 1,
              repeat: Infinity
            }}
            id='div_loader_request'>
                <AiOutlineLoading3Quarters style={{fontSize: "25px"}} />
            </motion.div>
        </div>
      ) : (
        notificationslist.list.length == 0? (
          <div id='div_notifications_list_empty_container'>
            <span className='span_empty_list_label'>No Notifications</span>
          </div>
        ) : (
          <div id='div_notifications_list_container' className='scroller'>
            {notificationslist.list.map((ntfs: any, i: number) => {
              return(
                <motion.div
                whileHover={{
                  backgroundColor: "#e6e6e6"
                }}
                key={i} className='div_ntfs_cards'>
                  <div id='div_img_ntfs_container'>
                    <div id='div_img_search_profiles_container_ntfs'>
                      <img src={ntfs.fromUser.profile == "none"? DefaultProfile : ntfs.fromUser.profile} className='img_search_profiles_ntfs' />
                    </div>
                  </div>
                  <div id='div_ntfs_content'>
                    <span id='span_ntfs_content_headline'>{ntfs.content.headline}</span>
                    <span id='span_ntfs_content_details'>{ntfs.content.details}</span>
                    <div id='div_ntfs_date_time'>
                      <span className='span_ntfs_date_time'>{ntfs.date.date}</span>
                      <span className='span_ntfs_date_time'>{ntfs.date.time}</span>
                    </div>
                    {ntfs.type == "contact_request"? (
                      ntfs.referenceStatus? null : (
                        <div id='div_navigations_contact_request'>
                          <button className='btn_navigations_contact_request confirm_contact_request'
                            disabled={isDisabledByRequest}
                            onClick={() => {
                              acceptRequestProcess("contact_request", ntfs.notificationID, ntfs.referenceID, ntfs.toUserID, ntfs.fromUserID)
                            }}
                          >Confirm</button>
                          <button className='btn_navigations_contact_request decline_contact_request'
                            disabled={isDisabledByRequest}
                            onClick={() => {
                              declineRequestProcess("contact_request", ntfs.notificationID, ntfs.referenceID, ntfs.toUserID, ntfs.fromUserID)
                            }}
                          >Decline</button>
                        </div>
                      )
                    ) : null}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )
      )}
    </motion.div>
  )
}

export default Notifications