import React, { useState } from 'react'
import '../../styles/auth/index.css'
import { motion } from 'framer-motion'
import ChatterLoopImg from '../../assets/imgs/chatterloop.png'
import { useNavigate } from 'react-router-dom'
import { getDaysInMonth, monthList, years } from '../../reusables/vars/lists'

function Register() {

  const navigate = useNavigate();

  const [month, setmonth] = useState("")
  const [year, setyear] = useState("")

  return (
    <div id='div_register'>
      <div id='div_register_form'>
        <div id='div_icon_register_container'>
          <img src={ChatterLoopImg} id='img_icon_register' />
          <span id='span_login_label'>ChatterLoop</span>
        </div>
        <div id='div_register_form_inputs'>
          <div id='div_inputs_name'>
            <input type='text' placeholder='First Name' className='input_names' />
            <input type='text' placeholder='Middle Name (Optional)' className='input_names' />
            <input type='text' placeholder='Last Name' className='input_names' />
          </div>
          <div id='div_inputs_email'>
            <input type='text' placeholder='Email' className='input_email' />
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
              <select className='input_dates' placeholder='Day'>
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
              <select className='input_dates' placeholder='Month'>
                <option value="" defaultValue={true}>Month</option>
              </select>
              <select className='input_dates' placeholder='Day'>
                <option value="" defaultValue={true}>Day</option>
              </select>
              <select className='input_dates' placeholder='Year'>
                <option value="" defaultValue={true}>Year</option>
              </select>
            </div>
          </div>
          <div id='div_inputs_password'>
            <input type='password' placeholder='Password' className='input_password' />
          </div>
          <div id='div_checkbox_terms_conditions'>
            <input type='checkbox' id='input_checkbox_terms_conditions' />
            <span id='span_checkbox_terms_conditions'>I agree to the Terms and Conditions</span>
          </div>
          <div id='div_button_sign_up'>
            <button id='btn_register'>Sign Up</button>
          </div>
          <div id='div_question_label_login'>
            <span id='span_question_label'>Already have an account?</span>
            <span id='span_sign_up_redirect' onClick={() => {
              navigate("/login")
            }}>Log In</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register