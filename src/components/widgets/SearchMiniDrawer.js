import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import '../../styles/widgets/index.css'
import { AiOutlineLoading3Quarters, AiOutlineUserAdd, AiOutlineUserDelete, AiOutlineClose } from 'react-icons/ai'
import { BiUserMinus, BiUserPlus, BiUserX } from 'react-icons/bi'
import { RiLoader3Fill } from 'react-icons/ri'
import { TbInputSearch } from 'react-icons/tb'
import { ContactRequest, SearchRequest } from '../../reusables/hooks/requests'
import { useDispatch, useSelector } from 'react-redux'
import DefaultProfile from '../../assets/imgs/default.png'

function SearchMiniDrawer({searchbox}) {

  const [isLoading, setisLoading] = useState(false)
  const [searchresults, setsearchresults] = useState([])

  const authentication = useSelector(state => state.authentication)
  const alerts = useSelector(state => state.alerts)
  const dispatch = useDispatch()

  useEffect(() => {
    var timeoutRequest = setTimeout(() => {
      if(searchbox.trim() != ""){
        if(searchbox.split("@")[1] != ""){
          SearchRequest({
            searchdata: searchbox
          }, dispatch, setisLoading, alerts, setsearchresults, authentication)
        }
        else{
          setisLoading(false)
        }
      }
    },1500)

    if(searchbox.trim() != ""){
      setisLoading(true)
    }
    else{
      setisLoading(false)
    }

    return () => {
      clearTimeout(timeoutRequest)
    }
  },[searchbox])

  const contactRequestProcess = (addUserID) => {
    ContactRequest({
      addUserID: addUserID
    }, dispatch, alerts)
  }

  return (
    <div id='div_searchminidrawer'>
        <div id='div_searchminidrawer_header'>
            <span id='span_searchminidrawer_label'>Searching for "<span id="span_ellipsis_searchlabel_content">{searchbox}</span>"</span>
        </div>
        {isLoading? (
          <div id='div_searchminidrawer_isLoading'>
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
          searchresults.length > 0? (
            <div id='div_searchminidrawer_content'>
              {searchresults.map((srch, i) => {
                return(
                  <motion.div
                  key={srch.userID}
                  initial={{
                    rotate: 0
                  }}
                  animate={{
                    rotate: 0
                  }}
                  transition={{
                    duration: 0
                  }}
                  whileHover={{
                    backgroundColor: "#dfdfdf"
                  }}
                  className='div_search_profiles_results'>
                    <div id='div_img_search_profiles_container'>
                      <img src={srch.profile == "none"? DefaultProfile : srch.profile} className='img_search_profiles' />
                    </div>
                    <div id='div_fullname_container'>
                      <span className='span_fullname'>{srch.fullname.firstName}{srch.fullname.middleName == "N/A"? "" : ` ${srch.fullname.middleName}`} {srch.fullname.lastName}</span>
                      <span className='span_userID'>@{srch.userID}</span>
                    </div>
                    <div id='div_add_button'>
                      {srch.contacts? (
                        srch.contacts.actionBy == authentication.user.userID? (
                          srch.contacts.status? null : (
                            <motion.button 
                            whileHover={{
                              backgroundColor: "#909090",
                              color: "white"
                            }}
                            onClick={() => {
                              // console.log(srch.userID)
                            }}
                            title='Cancel Request'
                            id='btn_add_user'>
                              <BiUserMinus style={{fontSize: "23px"}} />
                            </motion.button>
                          )
                        ) : (
                          srch.contacts.status? null : (
                            <motion.button 
                            whileHover={{
                              backgroundColor: "#909090",
                              color: "white"
                            }}
                            onClick={() => {
                              // console.log(srch.userID)
                            }}
                            title='Decline Request'
                            id='btn_add_user'>
                              <BiUserX style={{fontSize: "23px"}} />
                            </motion.button>
                          )
                        )
                      ) : (
                        <motion.button 
                        whileHover={{
                          backgroundColor: "#909090",
                          color: "white"
                        }}
                        onClick={() => {
                          contactRequestProcess(srch.userID)
                          // console.log(srch.userID)
                        }}
                        title='Add Contact'
                        id='btn_add_user'>
                          <BiUserPlus style={{fontSize: "23px"}} />
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ):(
            <div id='div_searchminidrawer_empty_content'>
              <div id='div_icon_label_empty_content'>
                <TbInputSearch style={{fontSize: "100px"}} />
                <span id='span_no_result_label'>No Results</span>
              </div>
            </div>
          )
        )}
    </div>
  )
}

export default SearchMiniDrawer