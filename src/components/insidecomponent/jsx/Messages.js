import React from 'react'
import '../css/Messages.css';
import {useState, useEffect} from 'react';
import Axios from 'axios';
import {motion} from 'framer-motion';
import { Navigate } from 'react-router';
import {Link, Routes, Route, useNavigate} from 'react-router-dom';

function Messages({username}) {

    const [previews, setPreviews] = useState([]);

    let navigate = useNavigate();

    useEffect(() => {
        Axios.get(`http://192.168.137.1:5000/messages/${username}`).then((response) => {
            //console.log(response.data);
            setPreviews(response.data);
        })
    },[previews]);

    const prompting = (conversation) => {
        //alert(conversation);
        navigate(`/home/messages/${conversation}`);
    }

    return (
        <div id='div_messages'>
            <h3>Messages</h3>

            <table id='table_container'>
                <tbody>
                    <tr>
                        <td>
                            <div>
                                {previews.map(under => {
                                    return <motion.table className='openner'
                                        whileHover={{
                                            boxShadow: "0px 0px 10px black"
                                        }}
                                        transition={{
                                            duration: 0.1
                                        }}

                                        onClick={() => {prompting(under.conversation_id)}}
                                    >
                                    <tbody>
                                        <tr>
                                            <td>
                                                <h3><p>{username == under.conversation_id.split("&")[1]? under.conversation_id.split("&")[0] : under.conversation_id.split("&")[1]}</p></h3>
                                                <p className='preview_message'>{under.message}</p>
                                            </td>
                                        </tr>
                                    </tbody>
                                </motion.table>
                                })}
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}

export default Messages
