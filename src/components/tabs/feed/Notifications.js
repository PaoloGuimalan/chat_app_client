import React, { useEffect, useState } from 'react'
import '../../../styles/tabs/feed/index.css'
import { AiOutlineBell, AiOutlineLoading3Quarters } from 'react-icons/ai'
import { useDispatch, useSelector } from 'react-redux'
import { AcceptContactRequest, DeclineContactRequest, NotificationInitRequest } from '../../../reusables/hooks/requests'
import { motion } from 'framer-motion'
import DefaultProfile from '../../../assets/imgs/default.png'

function Notifications() {

  const [isLoading, setisLoading] = useState(true)

  const notificationslist = useSelector(state => state.notificationslist)
  const alerts = useSelector(state => state.alerts)
  const dispatch = useDispatch()

  useEffect(() => {
    NotificationInitRequest({}, dispatch, setisLoading)
  },[])

  const declineRequestProcess = (ntfsType, ntfsID, refID, reverttoUserID, revertfromUserID) => {
    DeclineContactRequest({
      type: ntfsType,
      notificationID: ntfsID,
      referenceID: refID,
      toUserID: revertfromUserID,
      fromUserID: reverttoUserID
    }, dispatch, alerts)
  }

  const acceptRequestProcess = (ntfsType, ntfsID, refID, reverttoUserID, revertfromUserID) => {
    AcceptContactRequest({
      type: ntfsType,
      notificationID: ntfsID,
      referenceID: refID,
      toUserID: revertfromUserID,
      fromUserID: reverttoUserID
    }, dispatch, alerts)
  }

  return (
    <div id='div_notifications_main'>
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
        notificationslist.length == 0? (
          <div id='div_notifications_list_empty_container'>
            <span className='span_empty_list_label'>No Notifications</span>
          </div>
        ) : (
          <div id='div_notifications_list_container'>
            {notificationslist.map((ntfs, i) => {
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
                            onClick={() => {
                              acceptRequestProcess("contact_request", ntfs.notificationID, ntfs.referenceID, ntfs.toUserID, ntfs.fromUserID)
                            }}
                          >Confirm</button>
                          <button className='btn_navigations_contact_request decline_contact_request'
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
    </div>
  )
}

export default Notifications