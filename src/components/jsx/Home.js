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
import Cookies from 'js-cookie';
import notifaudio from '../../sounds/bbm_tone.mp3';
import { useDispatch, useSelector } from 'react-redux';
import { SET_CONVO_ALL, COUNTER_CONVO } from '../../redux/actionTypes';

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

    useEffect(() => {
      setWidth(window.innerWidth);
    }, [window.innerWidth]);
    

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
                                        <h3 id='h3_label'>{username}</h3>
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
                                        <button className='links' onClick={() => {logoutCookie()}}>Logout</button>
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
                    {width < 720 ? <Routes>
                        <Route path='/messages/:conid' element={<Conversation user={username}/>}/>
                        <Route path='/contacts/:conid' element={<Conversation user={username}/>}/>
                        <Route path='/notifications' element={<Notifications user={username}/>}/>
                        <Route path='/messages/*' element={<Messages username={username} authorized={Auth} />}/>
                        <Route path='/contacts/*' element={<Contacts username={username} authorized={Auth} />}/>
                    </Routes> : <Routes>
                        <Route path='/messages/:conid' element={<Conversation user={username}/>}/>
                        <Route path='/contacts/:conid' element={<Conversation user={username}/>}/>
                        <Route path='/notifications' element={<Notifications user={username}/>}/>
                    </Routes>}
                </li>
            </ul>
        </div>
    )
}

export default Home
