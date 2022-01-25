import React from 'react'
import '../css/Register.css';
import {Link} from 'react-router-dom';
import Axios from 'axios';
import {useState} from 'react';

function Register() {

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const register_cred = () => {
       Axios.post('https://chatappnode187.herokuapp.com/userregister', {
            username: username,
            email: email,
            password: password
        }).then((response) => {
            console.log("Success");
        }).catch(function (error){
            console.log(error);
        })
        //console.log(username, email, password);
    }


    return (
        <div id='register_div'>
            <table id='table_register'>
                <tbody>
                    <tr className='label_for'>
                        <td colSpan='2'>
                            <center><h2 id='header_log'>REGISTER</h2></center>
                        </td>
                    </tr>
                    <tr className='label_for'>
                        <td>
                            <label htmlFor='username' className='label_forl' >Username: </label>
                            </td>
                            <td>
                            <input type='text' name='username' id='username' className='inputs' onChange={(event) => {setUsername(event.target.value)}} required></input>
                        </td>
                    </tr>
                    <tr className='label_for'>
                        <td>
                            <label htmlFor='email' className='label_forl'>Email: </label>
                            </td>
                            <td>
                            <input type='text' name='email' id='email' className='inputs' onChange={(event) => {setEmail(event.target.value)}} required></input>
                        </td>
                    </tr>
                    <tr className='label_for'>
                        <td>
                            <label htmlFor='password' className='label_forl'>Password: </label>
                            </td>
                            <td>
                            <input type='password' name='password' id='password' className='inputs' onChange={(event) => {setPassword(event.target.value)}} required></input>
                        </td>
                    </tr>
                    <tr className='label_for'>
                        <td>
                            <button id='register_btn' onClick={() => register_cred()}>Register</button>
                        </td>
                        <td>
                            <Link to='/'>login</Link>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}

export default Register
