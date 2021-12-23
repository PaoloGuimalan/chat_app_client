import React from 'react'
import '../css/Notifications.css';
import { useParams, useNavigate} from 'react-router-dom'
import {useState, useEffect} from 'react';
import Axios from 'axios';
import {motion} from 'framer-motion';

function Notifications({user}) {

    const [notif, setNotifs] = useState([]);

    useEffect(() => {
        Axios.get(`http://192.168.137.1:5000/notifications/${user}`).then((response) => {
            //console.log(response.data);
            setNotifs(response.data);
        }).catch((err) => {
            console.log(err);
        })
    }, [notif]);

    return (
        <div id='div_notifs'>
            <table id='tbl_main'>
                <tbody>
                    <tr>
                        <td>
                            <h3>Notifications</h3>
                        </td>
                    </tr>
                    <tr>
                        <div id='div_under'>
                            {notif.map(nf => {
                                return <table id='tbl_notifs'>
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
                            })}
                        </div>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}

export default Notifications
