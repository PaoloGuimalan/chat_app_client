import React from 'react'
import '../css/Home.css'
import {Link, Routes, Route, useNavigate} from 'react-router-dom';
import {useState, useEffect} from 'react';
import Axios from 'axios';
import imgperson from '../imgs/person-icon.png';
import Messages from '../insidecomponent/jsx/Messages';
import Conversation from '../insidecomponent/jsx/Conversation';
import Contacts from '../insidecomponent/jsx/Contacts';
import Notifications from '../insidecomponent/jsx/Notifications';
import Feed from '../insidecomponent/jsx/Feed';
import Cookies from 'js-cookie';
import notifaudio from '../../sounds/bbm_tone.mp3';
import { useDispatch, useSelector } from 'react-redux';
import { SET_CONVO_ALL, COUNTER_CONVO } from '../../redux/actionTypes';
import Search from '@material-ui/icons/Search';
import { ButtonGroup, Button } from '@material-ui/core';
import ChatBubbleIcon from '@material-ui/icons/ChatBubbleOutline';
import Notifs from '@material-ui/icons/NotificationsOutlined';
import Logout from '@material-ui/icons/ExitToApp';
import HomeIcon from '@material-ui/icons/Home';
import ContactsIcon from '@material-ui/icons/Contacts';
import { TextField } from '@material-ui/core';

function Home({username, authorized}) {

    let navigate = useNavigate();

    const [Auth, setAuth] = useState(authorized);
    const [width, setWidth] = useState(0);

    const [messages, setMessages] = useState(false);

    const getConvoHome = useSelector(state => state.convoWhole);
    const count = useSelector(state => state.counterConvo);
    const dispatch = useDispatch();

    useEffect(async () => {
        await Axios.get(`https://chatappnode187.herokuapp.com/getallconvo/${username}`).then( async (response) => {
            await dispatch({type: SET_CONVO_ALL, convoCount: response.data});
            const arr = getConvoHome.map(status => status.convoCount).join();
            await dispatch({type: COUNTER_CONVO, counterccv: arr});
            // console.log(count);
            if (count != arr){
                await dispatch({type: COUNTER_CONVO, counterccv: arr});
            }
        })
    },[getConvoHome]);

    useEffect(() => {
        setWidth(window.innerWidth);
        // console.log(width);
      }, [window.innerWidth]);

    useEffect( async () => {
        await triggeraudio();
    }, [count]);
    

    const triggeraudio = async () => {
        let audio = await new Audio(notifaudio);
        await audio.play();
    }

    const logoutCookie = () => {
        Cookies.remove("userID");
        navigate("/");
    }

    const messagePage = () => {
        navigate("/home/messages");
    }

    const contactsPage = () => {
        navigate(`/home/contacts`);
    }

    const homePage = () => {
        navigate("/home");
    }

    const notifPage = () => {
        width < 720 ? navigate("/home/notifications") : navigate("/home");
    }

    if(Auth != true){
        navigate("/");
    }

    return (
        <div id='div_home'>
            <div id='navbar'>
                <nav>
                    <li>
                        <img id='img_handler' src={imgperson} title={username} />
                    </li>
                    <li>
                        <input type='search' id='search_bar' />
                    </li>
                    <li>
                        <button className='btns_navs' id='btn_child'><Search /></button>
                    </li>
                    <li>
                        <button className='btns_navs' onClick={homePage}><HomeIcon /></button>
                    </li>
                    <li>
                        <button className='btns_navs' onClick={messagePage}><ChatBubbleIcon /></button>
                    </li>
                    <li id='contacts_li_container'>
                        <button className='btns_navs' onClick={contactsPage}><ContactsIcon /></button>
                    </li>
                    <li>
                        <button className='btns_navs' onClick={notifPage}><Notifs /></button>
                    </li>
                    <li>
                        <button className='btns_navs' onClick={logoutCookie}><Logout /></button>
                    </li>
                </nav>
            </div>
            <div id='body_home'>
                {width < 720 ? (
                    <Routes>
                        <Route path='/' element={<Feed />} />
                        <Route path='/notifications' element={<Notifications user={username} />} />
                        <Route path='/messages' element={<Messages username={username} />} />
                        <Route path='/contacts/:conid' element={<Conversation user={username} />} />
                        <Route path='/messages/:conid' element={<Conversation user={username} />} />
                        <Route path='/contacts' element={<Contacts username={username} />} />
                    </Routes>
                ) : (
                    <table id='table_home'>
                        <tbody>
                            <tr>
                                <td id='tr_contacts'>
                                    <Contacts username={username} />
                                </td>
                                <td id='tr_feed'>
                                    <Feed />
                                </td>
                                <td id='tr_notifs'>
                                    <Routes>
                                        <Route path='/' element={<Notifications user={username} />} />
                                        <Route path='/notifications' element={<Notifications user={username} />} />
                                        <Route path='/messages' element={<Messages username={username} />} />
                                        <Route path='/contacts/:conid' element={<Conversation user={username} />} />
                                        <Route path='/messages/:conid' element={<Conversation user={username} />} />
                                    </Routes>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

export default Home
