import React, { useState } from 'react'
import '../../styles/auth/index.css'
import { motion } from 'framer-motion'
import VerificationImg from '../../assets/imgs/verification_icon.png'
import { useDispatch, useSelector } from 'react-redux'
import VerificationInput from 'react-verification-input'
import { LogoutRequest, VerifyCodeRequest } from '../../reusables/hooks/requests'
import { checkIfValid } from '../../reusables/hooks/validatevariables'
import { SET_ALERTS } from '../../redux/types'

function Verification() {

  const authentication = useSelector(state => state.authentication)
  const alerts = useSelector(state => state.alerts)

  const [verificationcode, setverificationcode] = useState("")
  const dispatch = useDispatch()

  const verifyCodeProcess = () => {
    if(checkIfValid([verificationcode])){
      if(verificationcode.split("").length == 6){
        VerifyCodeRequest({
          code: verificationcode
        },dispatch, authentication, alerts)
      }
      else{
        dispatch({ type: SET_ALERTS, payload:{
            alerts: [
              ...alerts,
              {
                id: alerts.length,
                type: "warning",
                content: "Please complete your verification code."
              }
            ]
        }})
      }
    }
    else{
      dispatch({ type: SET_ALERTS, payload:{
        alerts: [
          ...alerts,
          {
            id: alerts.length,
            type: "warning",
            content: "Please input your verification code."
          }
        ]
    }})
    }
  }

  const logoutProcess = () => {
    LogoutRequest({}, dispatch)
  }

  return (
    <div id='div_verification'>
      <motion.div 
      initial={{
        width: "0%"
      }}
      animate={{
        width: "95%"
      }}
      transition={{
        duration: 2,
        delay: 0.5
      }}
      id='div_verification_container'>
        <div id='div_verification_header_container'>
          <div id='div_verification_icon_container'>
            <img src={VerificationImg} id='img_ver_icon' />
            <div id='div_ver_bubble' />
            <div id='div_ver_bubble2' />
          </div>
          <motion.span
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          transition={{
            duration: 1,
            delay: 2.5
          }}
          id='span_verify_label'>Verify your Email Address</motion.span>
        </div>
        <motion.div
        initial={{
          opacity: 0
        }}
        animate={{
          opacity: 1
        }}
        transition={{
          duration: 1,
          delay: 2.5
        }}
        id='div_verification_form'>
          <span id='span_verifiaction_label_to_user'>A verification code has been sent to <b>{authentication.user.email}</b></span>
          <span id='span_verifiaction_label_to_user'>Please check your inbox and enter the verification code below to verify your account.</span>
          <div id='div_input_code'>
            <VerificationInput
              classNames={{
                container: "ver_container",
                character: "ver_character"
              }}
              onChange={(e) => {
                setverificationcode(e)
              }}
            />
          </div>
          <button id='btn_verify' onClick={() => {
            verifyCodeProcess()
          }}>Verify</button>
          <div id='div_verification_navigations'>
            <button className='btn_verification_navigations'>Resend Code</button>
            <button className='btn_verification_navigations' onClick={() => {
              logoutProcess()
            }}>Logout</button>
          </div>
        </motion.div>
      </motion.div>
      <motion.div
      initial={{
        scale: 0
      }}
      animate={{
        scale: 1
      }}
      transition={{
        delay: 1.2,
        duration: 1.5
      }}
      id='div_bubble_verification1' />
      <motion.div
      initial={{
        scale: 0
      }}
      animate={{
        scale: 1
      }}
      transition={{
        delay: 1.2,
        duration: 1.5
      }}
      id='div_bubble_verification2' />
      <motion.div
      initial={{
        scale: 0
      }}
      animate={{
        scale: 1
      }}
      transition={{
        delay: 1.2,
        duration: 1.5
      }}
      id='div_bubble_verification3' />
      <motion.div
      initial={{
        scale: 0
      }}
      animate={{
        scale: 1
      }}
      transition={{
        delay: 1.2,
        duration: 1.5
      }}
      id='div_bubble_verification4' />
      <motion.div
      initial={{
        scale: 0
      }}
      animate={{
        scale: 1
      }}
      transition={{
        delay: 1.2,
        duration: 1.5
      }}
      id='div_bubble_verification5' />
      <motion.div
      initial={{
        scale: 0
      }}
      animate={{
        scale: 1
      }}
      transition={{
        delay: 1.2,
        duration: 1.5
      }}
      id='div_bubble_verification6' />
      <motion.div
      initial={{
        scale: 0
      }}
      animate={{
        scale: 1
      }}
      transition={{
        delay: 1.2,
        duration: 1.5
      }}
      id='div_bubble_verification7' />
      <motion.div
      initial={{
        scale: 0
      }}
      animate={{
        scale: 1
      }}
      transition={{
        delay: 1.2,
        duration: 1.5
      }}
      id='div_bubble_verification8' />
    </div>
  )
}

export default Verification