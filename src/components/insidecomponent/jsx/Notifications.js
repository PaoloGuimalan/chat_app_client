import React from 'react'
import '../css/Notifications.css';
import { useParams, useNavigate} from 'react-router-dom'
import {useState, useEffect} from 'react';
import Axios from 'axios';
import {motion} from 'framer-motion';
import LoaderIcon from '@material-ui/icons/Sync';
import imgperson from '../../imgs/person-icon.png';

function Notifications({user}) {

    const [notif, setNotifs] = useState([]);
    const [loader, setloader] = useState(false);

    useEffect(() => {
        setInterval(() => {
            Axios.get(`https://chatterloop.onrender.com/notifications/${user}`).then((response) => {
                //console.log(response.data);
                setNotifs(response.data);
                setloader(true);
            }).catch((err) => {
                console.log(err);
            })
        },3000)
    }, []);

    const confirmRequest = (id, releaset, releasef) => {
        // alert(id);
        Axios.post('https://chatterloop.onrender.com/accept_req', {
            notif_id: id,
            release_to: releaset,
            release_from: releasef
        }).catch((err) => console.log(err));
    }

    const NotifContactReq = ({nf, i}) => {
       if(nf.notif_type == "contact_receiver"){
            return(
                <table id='tbl_notifs' key={i}>
                    <tbody id='bodyt' key={i}>
                        <ul id='ul_notifs' key={i}>
                            <li id='li_cont'>
                                <table className='tbl_content_notifs'>
                                    <tbody>
                                        <tr>
                                            <td>
                                                <img src={imgperson} className="imgs_notifs"/>
                                            </td>
                                            <td>
                                                <table className="tbls_infos">
                                                    <tbody>
                                                        <tr>
                                                            <td>
                                                                <p className="descriptions">{nf.notif_description}</p>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td>
                                                                <hr className="lines_between_desc_dates"/>
                                                                <p className='dates'>{nf.notif_date}</p>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </li>
                            <li id='li_cont'>
                                {nf.notif_status ? (
                                    <div id='container_btns_con'>
                                        <p className='navigator_when_true'>Request Confirmed</p>
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
            )
       }
       else{
           return(
            <table id='tbl_notifs' key={i}>
                <tbody id='bodyt' key={i}>
                    <ul id='ul_notifs' key={i}>
                        <li id='li_cont'>
                            <table className='tbl_content_notifs'>
                                <tbody>
                                    <tr>
                                        <td>
                                            <img src={imgperson} className="imgs_notifs"/>
                                        </td>
                                        <td>
                                            <table className="tbls_infos">
                                                <tbody>
                                                    <tr>
                                                        <td>
                                                            <p className="descriptions">{nf.notif_description}</p>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td>
                                                            <hr className="lines_between_desc_dates"/>
                                                            <p className='dates'>{nf.notif_date}</p>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </li>
                    </ul>
                </tbody>
            </table>
           )
       }
    }

    const DataNotifs = () => {
        return(
            <div id='div_under'>
                {notif.map((nf, i) => {
                    return <NotifContactReq nf={nf} i={i} />
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
                              rotate: '-360deg'
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
