import React from 'react'
import '../css/Contacts.css';
import { useParams } from 'react-router-dom'
import {useState, useEffect} from 'react';
import {Link, Routes, Route, useNavigate} from 'react-router-dom';
import '../css/Conversation.css'
import Axios from 'axios';
import {motion} from 'framer-motion';

function Contacts({username}) {

    const [field, setField] = useState("");
    const [list, setList] = useState([]);
    const [loader, setloader] = useState(false);

    let navigate = useNavigate();

    const Add_Contact = async () => {
        Axios.post('https://chatappnode187.herokuapp.com/addcontact', {usern: field, user: username}).then( async (response) => {
            alert(response.data.message);
                if(response.data.resp == true){
                        var today = new Date();
                        var dd = String(today.getDate()).padStart(2, '0');
                        var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
                        var yyyy = today.getFullYear();

                        today = mm + '/' + dd + '/' + yyyy;

                        const desc_me = `You have sent a contact request to ${field}.`;
                        const desc_to = `${username} have sent a contact request.`;

                    await Axios.post('https://chatappnode187.herokuapp.com/tonotif', {
                        desco: desc_me, 
                        desct: desc_to,
                        usero: username,
                        usert: field,
                        notif_type: "contact_request"
                    }).then((response2) => {
                        console.log("Okay");
                    }).catch((error2) => {
                        console.log(error2);
                    })
                }
        }).catch((error) => {
            console.log(error);
        })
    }

    useEffect(() => {
        Axios.get(`https://chatappnode187.herokuapp.com/contact/${username}`).then((response) => {
            //console.log(response.data);
            setList(response.data);
            setloader(true);
        }).catch((err) => {
            console.log(err);
        })
    }, [list]);

    // useEffect(() => {
    //     setloader(false);
    //   setTimeout(() => {
    //       setloader(true);
    //   }, 2000)
    // }, []);
    

    const message_openner = (idcon) => {
        navigate(`/home/contacts/${idcon}`);
    }

    return (
        <div id='div_contacts'>
            <div className='tbl_upper'>
                <h3>Contacts</h3>
                <table id='tbl_contacts'>
                    <tbody>
                        <tr>
                            <td>
                                <input id='addcon' name='addcon' onChange={(event) => {setField(event.target.value)}}/>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <button id='addcon_btn' onClick={Add_Contact}>Add Contact</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <table id='tbl_contacts'>
                <tbody>
                    <tr>
                        <td>
                            {loader ? list.map((res, i = 1) => 
                                (res.status == "connected" ? (
                                    <motion.p whileHover={{scale: 1.1}} transition={{duration: 0.1}} 
                                    onClick={() => {message_openner(username+"&"+res.list_from)}} className='contact_items' key={i++}>{res.list_from}</motion.p>
                                    ) : (
                                        ""
                                ))
                            ) : <p id='label_load'>Loading...</p>}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}

export default Contacts
