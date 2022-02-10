import React from 'react'
import '../css/Messages.css';
import {useState, useEffect} from 'react';
import Axios from 'axios';
import {motion} from 'framer-motion';
import { Navigate } from 'react-router';
import {Link, Routes, Route, useNavigate} from 'react-router-dom';
import LoaderIcon from '@material-ui/icons/Sync';

function Messages({username}) {

    const [previews, setPreviews] = useState([]);
    const [loader, setloader] = useState(false);

    let navigate = useNavigate();

    useEffect(async () => {
        await Axios.get(`https://chatappnode187.herokuapp.com/messages/${username}`).then((response) => {
            //console.log(response.data);
            setPreviews(response.data);
            setloader(true);
        })
    },[previews]);

    const prompting = async (conversation) => {
        //alert(conversation);
        await navigate(`/home/messages/${conversation}`);
    }

    return (
        <div id='div_messages'>
            <h3 id='h3_label_m'>Messages</h3>

            <table id='table_container'>
                <tbody>
                    <tr>
                        <td>
                            <div>
                                {loader ? (
                                    previews.map(under => {
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
                                    })
                                ) : (
                                    <motion.div
                                    animate={{
                                    rotate: '-360deg'
                                    }}
                                    transition={{
                                    duration: 1,
                                    loop: Infinity
                                    }}
                                    id='logo_spinner_contact'><LoaderIcon id='logo_post_contact' /></motion.div>
                                )}
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}

export default Messages
