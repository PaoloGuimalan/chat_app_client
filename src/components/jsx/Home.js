import React from 'react'
import '../css/Home.css'
import {Link, Routes, Route, useNavigate} from 'react-router-dom';
import {useState} from 'react';
import Axios from 'axios';
import imgperson from '../imgs/person-icon.png';
import Messages from '../insidecomponent/jsx/Messages';
import Conversation from '../insidecomponent/jsx/Conversation';
import Contacts from '../insidecomponent/jsx/Contacts';
import Notifications from '../insidecomponent/jsx/Notifications';

function Home({username, authorized}) {

    let navigate = useNavigate();

    const [Auth, setAuth] = useState(authorized);

    const [messages, setMessages] = useState(false);

    if(Auth != true){
        navigate("/");
    }

    return (
        <div id='div_home'>
            <ul>
                <li id='li_one'>
                    <div id='div_one'>
                        <table id='upper'>
                            <tbody>
                                <tr>
                                    <td>
                                        <img src={imgperson} alt='profile' id='image'></img>
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        <h3>{username}</h3>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <table id='navs'>
                            <tbody>
                                <tr className='tr_navs'>
                                    <td>
                                        <button className='links' onClick={()=> {navigate("/home/messages/");}}>Messages</button>
                                    </td>
                                </tr>
                                <tr className='tr_navs'>
                                    <td>
                                        <button className='links' onClick={()=> { navigate("/home/contacts/");}}>Contacts</button>
                                    </td>
                                </tr>
                                <tr className='tr_navs'>
                                    <td>
                                        <button className='links' onClick={()=> { navigate("/home/notifications/");}}>Notifications</button>
                                    </td>
                                </tr>
                                <tr className='tr_navs'>
                                    <td>
                                        <button className='links'>Account</button>
                                    </td>
                                </tr>
                                <tr className='tr_navs'>
                                    <td>
                                        <button className='links' onClick={() => {navigate("/")}}>Logout</button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </li>
                <li id='li_two'>
                    <Routes>
                        <Route path='/messages/*' element={<Messages username={username} authorized={Auth} />}/>
                        <Route path='/contacts/*' element={<Contacts username={username} authorized={Auth} />}/>
                    </Routes>
                </li>
                <li id='li_three'>
                    <Routes>
                        <Route path='/messages/:conid' element={<Conversation user={username}/>}/>
                        <Route path='/contacts/:conid' element={<Conversation user={username}/>}/>
                        <Route path='/notifications' element={<Notifications user={username}/>}/>
                    </Routes>
                </li>
            </ul>
        </div>
    )
}

export default Home
