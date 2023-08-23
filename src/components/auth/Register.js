import React, { useState } from 'react'
import '../../styles/auth/index.css'
import { motion } from 'framer-motion'
import ChatterLoopImg from '../../assets/imgs/chatterloop.png'
import { useNavigate } from 'react-router-dom'
import { getDaysInMonth, monthList, years } from '../../reusables/vars/lists'
import { RegisterRequest } from '../../reusables/hooks/requests'
import { useDispatch, useSelector } from 'react-redux'
import { checkIfValid } from '../../reusables/hooks/validatevariables'
import { SET_ALERTS } from '../../redux/types'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'

function Register() {

  const alerts = useSelector(state => state.alerts)
  const dispatch = useDispatch()
  const navigate = useNavigate();

  const [firstName, setfirstName] = useState("")
  const [middleName, setmiddleName] = useState("")
  const [lastName, setlastName] = useState("")

  const [email, setemail] = useState("")

  const [month, setmonth] = useState("")
  const [day, setday] = useState("")
  const [year, setyear] = useState("")

  const [gender, setgender] = useState("")

  const [password, setpassword] = useState("")

  const [agreed, setagreed] = useState(false)
  const [isWaitingRequest, setisWaitingRequest] = useState(false);

  const processregister = () => {
    setisWaitingRequest(true)
    if(agreed){
      if(checkIfValid([firstName, lastName, email, month, day, year, gender, password])){
        RegisterRequest({
          fullname: {
            firstName: firstName,
            middleName: middleName,
            lastName: lastName
          },
          birthdate: {
            month: month,
            day: day,
            year: year
          },
          gender: gender,
          email: email,
          password: password
        }, dispatch, alerts, setisWaitingRequest)
      }
      else{
        dispatch({ type: SET_ALERTS, payload:{
          alerts: [
            ...alerts,
            {
              id: alerts.length,
              type: "warning",
              content: "Please complete the fields."
            }
          ]
        }})
        setisWaitingRequest(false)
      }
    }
    else{
      dispatch({ type: SET_ALERTS, payload:{
        alerts: [
          ...alerts,
          {
            id: alerts.length,
            type: "warning",
            content: "Please agree with the Terms and Conditions."
          }
        ]
      }})
      setisWaitingRequest(false)
    }
  }

  return (
    <div id='div_register'>
      <motion.div
      initial={{
        width: "0px"
      }} 
      animate={{
        width: "95%"
      }}
      transition={{
        duration: 2,
        delay: 0.5
      }}
      id='div_register_form'>
        <div id='div_icon_register_container'>
          <img src={ChatterLoopImg} id='img_icon_register' />
          <span id='span_login_label'>ChatterLoop</span>
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
          delay: 2
        }}
        id='div_register_form_inputs'>
          <div id='div_inputs_name'>
            <input type='text' placeholder='First Name' className='input_names' value={firstName} onChange={(e) => {
              setfirstName(e.target.value)
            }} />
            <input type='text' placeholder='Middle Name (Optional)' className='input_names' value={middleName} onChange={(e) => {
              setmiddleName(e.target.value)
            }} />
            <input type='text' placeholder='Last Name' className='input_names' value={lastName} onChange={(e) => {
              setlastName(e.target.value)
            }} />
          </div>
          <div id='div_inputs_email'>
            <input type='text' placeholder='Email' className='input_email' value={email} onChange={(e) => {
              setemail(e.target.value)
            }} />
          </div>
          <div id='div_birthdate'>
            <span id='span_birthdate_label'>Birth Date</span>
            <div id='div_inputs_dates'>
              <select className='input_dates' placeholder='Month' value={month} onChange={(e) => { setmonth(e.target.value) }}>
                <option value="" defaultValue={true}>Month</option>
                {monthList.map((val, i) => {
                  return(
                    <option key={i} value={val}>{val}</option>
                  )
                })}
              </select>
              <select className='input_dates' placeholder='Day' value={day} onChange={(e) => {
                setday(e.target.value)
              }}>
                <option value="" defaultValue={true}>Day</option>
                {month != "" && year != ""? (
                  getDaysInMonth(month, year).map((val, i) => {
                    return(
                      <option key={i} value={val}>{val}</option>
                    )
                  })
                ) : null}
              </select>
              <select className='input_dates' placeholder='Year' value={year} onChange={(e) => { setyear(e.target.value) }}>
                <option value="" defaultValue={true}>Year</option>
                {years.map((val, i) => {
                  return(
                    <option key={i} value={val}>{val}</option>
                  )
                })}
              </select>
            </div>
          </div>
          <div id='div_birthdate'>
            <span id='span_birthdate_label'>Gender</span>
            <div id='div_inputs_dates'>
              <motion.button
              initial={{
                backgroundColor: "#f0f0f0"
              }}
              animate={{
                backgroundColor: gender == "Male"? "#49a1f8" : "#f0f0f0",
                color: gender == "Male"? "white" : "#4A4A4A"
              }}
              onClick={() => {
                setgender("Male")
              }}
              className='input_gender'>Male</motion.button>
              <motion.button
              initial={{
                backgroundColor: "#f0f0f0"
              }}
              animate={{
                backgroundColor: gender == "Female"? "#db56a4" : "#f0f0f0",
                color: gender == "Female"? "white" : "#4A4A4A"
              }}
              onClick={() => {
                setgender("Female")
              }}
              className='input_gender'>Female</motion.button>
              <motion.button
              style={{
                background: gender == "Others"? "linear-gradient(180deg, #FE0000 16.66%, #FD8C00 16.66%, 33.32%, #FFE500 33.32%, 49.98%, #119F0B 49.98%, 66.64%, #0644B3 66.64%, 83.3%, #C22EDC 83.3%)" : "#f0f0f0",
                color: gender == "Others"? "white" : "#4A4A4A"
              }}
              onClick={() => {
                setgender("Others")
              }}
              className='input_gender'>Others</motion.button>
            </div>
          </div>
          <div id='div_inputs_password'>
            <input type='password' placeholder='Password' className='input_password' value={password} onChange={(e) => {
              setpassword(e.target.value)
            }} />
          </div>
          <div id='div_checkbox_terms_conditions'>
            <input type='checkbox' id='input_checkbox_terms_conditions' checked={agreed} onChange={(e) => {
              setagreed(e.target.checked)
            }} />
            <span id='span_checkbox_terms_conditions'>I agree to the Terms and Conditions</span>
          </div>
          <div id='div_button_sign_up'>
            {isWaitingRequest? (
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
            ) : (
              <button id='btn_register' onClick={() => {
                processregister()
              }}>Sign Up</button>
            )}
          </div>
          <div id='div_question_label_login'>
            <span id='span_question_label'>Already have an account?</span>
            <span id='span_sign_up_redirect' onClick={() => {
              navigate("/login")
            }}>Log In</span>
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
      id='div_bubble_register1' />
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
      id='div_bubble_register2' />
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
      id='div_bubble_register3' />
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
      id='div_bubble_register4' />
    </div>
  )
}

export default Register