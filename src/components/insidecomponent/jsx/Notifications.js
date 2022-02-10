import React from 'react'
import '../css/Notifications.css';
import { useParams, useNavigate} from 'react-router-dom'
import {useState, useEffect} from 'react';
import Axios from 'axios';
import {motion} from 'framer-motion';
import LoaderIcon from '@material-ui/icons/Sync';

function Notifications({user}) {

    const [notif, setNotifs] = useState([]);
    const [loader, setloader] = useState(false);

    useEffect(() => {
        Axios.get(`https://chatappnode187.herokuapp.com/notifications/${user}`).then((response) => {
            //console.log(response.data);
            setNotifs(response.data);
            setloader(true);
        }).catch((err) => {
            console.log(err);
        })
    }, [notif]);

    const confirmRequest = (id, releaset, releasef) => {
        // alert(id);
        Axios.post('https://chatappnode187.herokuapp.com/accept_req', {
            notif_id: id,
            release_to: releaset,
            release_from: releasef
        }).catch((err) => console.log(err));
    }

    const DataNotifs = () => {
        return(
            <div id='div_under'>
                            {notif.map((nf, i) => {
                                return nf.notif_type == "contact_receiver" ? (
                                <table id='tbl_notifs' key={i}>
                                <tbody id='bodyt' key={i}>
                                    <ul id='ul_notifs' key={i}>
                                        <li>
                                            <tr>
                                                <td>
                                                    <p>{nf.notif_description}</p>
                                                </td>
                                                <td className='heads'>
                                                    <p>{nf.notif_date}</p>
                                                </td>
                                            </tr>
                                        </li>
                                        <li id='li_cont'>
                                            {nf.notif_status ? (
                                            <div id='container_btns_con'>
                                                <p>Request Confirmed</p>
                                            </div>
                                            ) : (
                                            <div id='container_btns_con'>
                                                <button className='btns_con' onClick={() => {confirmRequest(nf.notif_id, nf.notif_from, user)}}>Confirm</button>
                                                <button className='btns_con'>Decline</button>
                                            </div>
                                            )}
                                        </li>
                                    </ul>
                                </tbody>
                            </table>
                            ) : (<table id='tbl_notifs' key={i}>
                            <tbody>
                                <tr>
                                    <td>
                                        <p>{nf.notif_description}</p>
                                    </td>
                                    <td className='heads'>
                                        <p>{nf.notif_date}</p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        )
                                })}
                        </div>
        )
    }

    return (
        <div id='div_notifs'>
            <table id='tbl_main'>
                <tbody>
                    <tr>
                        <td>
                            <h3 id='label_notif'>Notifications</h3>
                        </td>
                    </tr>
                    <tr>
                        {loader ? <DataNotifs /> : (
                            <motion.div
                            animate={{
                              rotate: '360deg'
                            }}
                            transition={{
                              duration: 1,
                              loop: Infinity
                            }}
                            id='logo_spinner_contact'><LoaderIcon id='logo_post_contact' /></motion.div>
                        )}
                    </tr>
                </tbody>
            </table>
        </div>
    )
}

export default Notifications
