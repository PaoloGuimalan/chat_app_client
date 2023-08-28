import React, { useState, useEffect } from 'react'
import '../../../styles/tabs/feed/index.css'
import { FcContacts } from 'react-icons/fc'
import { AiOutlineBell, AiOutlineLoading3Quarters, AiOutlineMessage } from 'react-icons/ai'
import { BiUserMinus } from 'react-icons/bi'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { ContactsListInitRequest } from '../../../reusables/hooks/requests'
import DefaultProfile from '../../../assets/imgs/default.png'

function Contacts() {

  const authentication = useSelector(state => state.authentication)
  const contactslist = useSelector(state => state.contactslist)
  const dispatch = useDispatch()

  const [isLoading, setisLoading] = useState(true)

  useEffect(() => {
    ContactsListInitRequest({}, dispatch, setisLoading)
  },[])

  return (
    <div id='div_contacts'>
        <div id='div_contacts_label_container'>
          <FcContacts style={{fontSize: "28px"}} />
          <span className='span_contacts_label'>Contacts</span>
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
          contactslist.length == 0? (
            <div id='div_contacts_list_empty_container'>
              <span className='span_empty_list_label'>No Contacts</span>
            </div>
          ) : (
            <div id='div_contacts_list_container'>
              {contactslist.map((cnts, i) => {
                if(cnts.userdetails.userone && cnts.userdetails.usertwo){
                  if(cnts.userdetails.userone.userID == authentication.user.userID){
                    return(
                      <motion.div
                      whileHover={{
                        backgroundColor: "#e6e6e6"
                      }}
                      key={i} className='div_cncts_cards'>
                        <div id='div_img_ntfs_container'>
                          <div id='div_img_search_profiles_container_ntfs'>
                            <img src={cnts.userdetails.usertwo.profile == "none"? DefaultProfile : cnts.userdetails.usertwo.profile} className='img_search_profiles_ntfs' />
                          </div>
                        </div>
                        <div className='div_contact_fullname_container'>
                          <span className='span_cncts_fullname_label'>{cnts.userdetails.usertwo.fullname.firstName}{cnts.userdetails.usertwo.fullname.middleName == "N/A"? "" : ` ${cnts.userdetails.usertwo.fullname.middleName}`} {cnts.userdetails.usertwo.fullname.lastName}</span>
                        </div>
                        <div className='div_cncts_navigations'>
                          <motion.button
                          whileHover={{
                            backgroundColor: "#909090"
                          }}className='btn_cncts_navigations'><AiOutlineMessage style={{fontSize: "20px", color: "white", backgroundColor: "#9cc2ff", borderRadius: "7px", padding: "3px"}} /></motion.button>
                          <motion.button
                          whileHover={{
                            backgroundColor: "#909090"
                          }}className='btn_cncts_navigations'><BiUserMinus style={{fontSize: "20px", color: "white", backgroundColor: "#ff6675", borderRadius: "7px", padding: "3px"}} /></motion.button>
                        </div>
                      </motion.div>
                    )
                  }
                  else{
                    return(
                      <motion.div
                      whileHover={{
                        backgroundColor: "#e6e6e6"
                      }}
                      key={i} className='div_cncts_cards'>
                        <div id='div_img_ntfs_container'>
                          <div id='div_img_search_profiles_container_ntfs'>
                            <img src={cnts.userdetails.userone.profile == "none"? DefaultProfile : cnts.userdetails.userone.profile} className='img_search_profiles_ntfs' />
                          </div>
                        </div>
                        <div className='div_contact_fullname_container'>
                          <span className='span_cncts_fullname_label'>{cnts.userdetails.userone.fullname.firstName}{cnts.userdetails.userone.fullname.middleName == "N/A"? "" : ` ${cnts.userdetails.userone.fullname.middleName}`} {cnts.userdetails.userone.fullname.lastName}</span>
                        </div>
                        <div className='div_cncts_navigations'>
                          <motion.button
                          whileHover={{
                            backgroundColor: "#909090"
                          }}className='btn_cncts_navigations'><AiOutlineMessage style={{fontSize: "20px", color: "white", backgroundColor: "#9cc2ff", borderRadius: "7px", padding: "3px"}} /></motion.button>
                          <motion.button
                          whileHover={{
                            backgroundColor: "#909090"
                          }}className='btn_cncts_navigations'><BiUserMinus style={{fontSize: "20px", color: "white", backgroundColor: "#ff6675", borderRadius: "7px", padding: "3px"}} /></motion.button>
                        </div>
                      </motion.div>
                    )
                  }
                }
                else{
                  return null
                }
              })}
            </div>
          )
        )}
    </div>
  )
}

export default Contacts