import React from 'react'
import { useParams, useNavigate} from 'react-router-dom'
import {useState, useEffect} from 'react';
import '../css/Conversation.css'
import Axios from 'axios';
import {motion} from 'framer-motion';
import imgperson from '../../imgs/person-icon.png';

function Conversation({user}) {
    const { conid } = useParams();
    let navigate = useNavigate();

    const [convo, setConvo] = useState([]);
    const [txt, setTxt] = useState("");
    const [Recc, setRec] = useState(user == conid.split("&")[1]? conid.split("&")[0] : conid.split("&")[1]);

    useEffect(() => {
        Axios.get(`http://192.168.137.1:5000/conversation/${conid}`).then((response) => {
            //console.log(response.data.map(cc => cc.conversation_id.split("&").reverse().join("")));
            //console.log(response.data.length);
            //const reversed = conid.split(/(&)/).reverse().join("");
                setConvo(response.data);
                setRec(user == conid.split("&")[1]? conid.split("&")[0] : conid.split("&")[1]);
            //console.log(reversed);
        })
    },[convo]);

    const send_provider = () => {
        //alert(Recc);
        Axios.post('http://192.168.137.1:5000/sendto', {
            id: conid,
            txt: txt,
            from: user,
            to: Recc
        }).then((response) => {
            console.log("Okay");
            document.getElementById('message').value = "";
            setTxt("");
        }).catch((err) => {
            console.log(err);
        });
    }

    return (
        <div id='div_convo'>
            <table id='tbl_convo'>
                <tbody>
                    <tr id='header_convo'>
                        <td style={{width: '70px'}}>
                            <img src={imgperson} alt='profile' width='70px' height='70px' id='person'></img>
                        </td>
                        <td>
                            <h3 id='name_ind'>{Recc}</h3>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div id='mss'>
                <table id='tbl_mss'>
                    <tbody>
                        <tr className='carrier'>
                            <td>
                                {convo.map((data , i = 1) => {
                                    return <motion.p 
                                    initial={
                                        data.who_sent == user ? {marginLeft: "auto", background: "#0000FF", border: "solid 1px #0000FF", color: "#FFFFFF"} : {marginLeft: 0, background: "#FFFFFF", border: "solid 1px #0000FF", color: "#0000FF"}
                                    }
                                    className='data' key={i++}>{data.message}</motion.p>
                                })}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <table id='bottom_lay'>
                <tbody>
                    <tr>
                        <td>
                            <textarea id='message' name='message' onChange={(event) => {setTxt(event.target.value)}}></textarea>
                        </td>
                        <td>
                            <button id='send_message' onClick={send_provider}>Send</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}

export default Conversation
