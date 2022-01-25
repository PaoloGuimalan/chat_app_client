import React from 'react'
import '../css/Login.css';
import {Link, Routes, Route, useNavigate, useLocation} from 'react-router-dom';
import {useState, useEffect} from 'react';
import Axios from 'axios';
import Home from './Home';
import Cookies from 'js-cookie';

function Login() {

    let navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [logged, setLogged] = useState(false);
    const [username, setUsername] = useState("");

    const loc = useLocation();

    const CookieRead = () => {
        const ID = Cookies.get("userID");
        //const loc = useLocation();
        if(ID){
            setUsername(ID);
            setLogged(true);
            //console.log(loc.pathname.split("/").length);
            if(loc.pathname.split("/").length === 2)
            {
                navigate("/home/");
            }
            //navigate("/home/");
        }
        else{
            setUsername("");
            setLogged(false);
            //console.log(loc.pathname.split("/")[1].length);
        }
    }

    useEffect(() => {
        CookieRead();
    });

    //const [user, setUser] = useState([]);

    const login_trigger = () => {
        //console.log("HEllo");
        Axios.post(`https://chatappnode187.herokuapp.com/userlogin`, {email: email, password: password}).then((response) => {
            //console.log(response.data);
            //setUser(response.data);
            response.data.map(subs => {
                //console.log(logged);
                if(email !== "" && password !== ""){
                    if(subs.email === email && subs.password === password){
                        //setLogged(!logged);
                        if(subs.logged == true){
                            alert(subs.message);
                            setUsername(subs.username);
                            navigate("/home/");
                            Cookies.set("userID", subs.username, { expires: 7 });
                        }
                        else{
                            alert(subs.error)
                        }
                        //console.log(Cookies.get('userID'));
                        //console.log(user);
                    }
                    else{
                        alert("Unable to Log In!");
                    }
                }
            })
        }).catch((err) => {
            alert(err);
            console.log(err)
        });
    };

    return (
        <div id='login_div'>
            {logged ? (
            <Routes>
                <Route path='/home/*' element={<Home username={username} authorized={logged}/>}/>
            </Routes>
            ) : (
                <table id='table_login'>
                <tbody>
                    <tr className='label_for'>
                        <td colSpan='2'>
                            <center><h2 id='header_log'>LOG IN</h2></center>
                        </td>
                    </tr>
                    <tr className='label_for'>
                        <td>
                            <label htmlFor='email' className='label_forl'>Email: </label>
                            </td>
                            <td>
                            <input type='text' name='email' id='email' className='inputs' onChange={(event) => {setEmail(event.target.value)}}></input>
                        </td>
                    </tr>
                    <tr className='label_for'>
                        <td>
                            <label htmlFor='password' className='label_forl'>Password: </label>
                            </td>
                            <td>
                            <input type='password' name='password' id='password' className='inputs' onChange={(event) => {setPassword(event.target.value)}}></input>
                        </td>
                    </tr>
                    <tr className='label_for'>
                        <td>
                            <button id='login_btn'  onClick={login_trigger}>Log In</button>
                        </td>
                        <td>
                            <Link to='/register'>Register</Link>
                        </td>
                    </tr>
                </tbody>
            </table>
            )}
        </div>
    )
}

export default Login
