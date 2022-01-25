import React from 'react'
import { useParams, useNavigate} from 'react-router-dom'
import {useState, useEffect} from 'react';
import '../css/Conversation.css'
import Axios from 'axios';
import {motion} from 'framer-motion';
import imgperson from '../../imgs/person-icon.png';
import ScrollToBottom from 'react-scroll-to-bottom';
import audiomes from '../../../sounds/bbm_tone.mp3'

function Conversation ({user}) {
    const { conid } = useParams();
    let navigate = useNavigate();

    const [convo, setConvo] = useState([]);
    const [txt, setTxt] = useState("");
    const [Recc, setRec] = useState(user == conid.split("&")[1]? conid.split("&")[0] : conid.split("&")[1]);
    const [conid_ver, setconid_ver] = useState("");
    const [rdr, setRdr] = useState(false);
    const [mymes, setmymes] = useState(0);
    const [sendermes, setsendermes] = useState(0);

    useEffect(async () => {
        await Axios.get(`https://chatappnode187.herokuapp.com/conversation/${conid}`).then( async (response) => {
            //console.log(response.data.map(cc => cc.conversation_id.split("&").reverse().join("")));
            //console.log(response.data.length);
            //const reversed = conid.split(/(&)/).reverse().join("");
            const made_id = await response.data.splice(0, 1).map(cc => cc.conversation_id).join("");
                await setConvo(response.data);
                await setRec(user == conid.split("&")[1]? conid.split("&")[0] : conid.split("&")[1]);
                //setconid_ver(convo.conversation_id[0]);
                await setconid_ver(made_id === "" ? conid : made_id);
                const length_one = await response.data.filter((count) => count.who_sent == user ? (count.who_sent) : "");
                const length_two = await response.data.filter((count) => count.who_sent != user ? (count.who_sent) : "");
                setmymes(length_one.length);
                setsendermes(length_two.length)
                //console.log(conid_ver);
                //console.log(made_id === "" ? conid : made_id)
            //console.log(reversed);
        })
    },[convo]);

    useEffect(() => {
      setRdr(false);
      setTimeout(() => {
          setRdr(true);
        //   window.scrollTo(0,document.body.scrollHeight);
        // scroller();
      }, 2000)
    }, [conid]);
    
    useEffect(() => {
      scroller();
    }, [mymes]);
    
    useEffect(() => {
        let audioMessage = new Audio(audiomes);
        audioMessage.play();
    }, [sendermes]);
    

    const send_provider = async () => {
        //alert(Recc);
        setTxt("");
        // scroller();
        await Axios.post('https://chatappnode187.herokuapp.com/sendto', {
            id: conid_ver,
            txt: txt,
            from: user,
            to: Recc
        }).then((response) => {
            console.log("Okay");
        }).catch((err) => {
            console.log(err);
        });
        // document.getElementById('message').value = "";
        // console.log(document.getElementById("mss").scrollHeight);
    }

    const scroller = () => {
        setTimeout(() => {
            document.getElementById("mss").scrollTo(0,document.getElementById("mss").scrollHeight)
        }, 100);
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
                                {rdr ? convo.map((data , i = 1) => {
                                    return <motion.p 
                                    title={data.who_sent}
                                    initial={
                                        data.who_sent == user ? {scale: 0.1 ,marginLeft: "auto", background: "#0000FF", border: "solid 1px #0000FF", color: "#FFFFFF"} : {scale: 0.1 ,marginLeft: 0, background: "#FFFFFF", border: "solid 1px #0000FF", color: "#0000FF"}
                                    }
                                    animate={{
                                        scale: 1,
                                        transition:{
                                            duration: 0.2
                                        }
                                    }}
                                    className='data' key={i++}>{data.message}</motion.p>
                                }) : <p>Loading...</p>}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <table id='bottom_lay'>
                <tbody>
                    <tr>
                        <td>
                            <textarea id='message' value={txt} name='message' onChange={(event) => {setTxt(event.target.value)}}></textarea>
                        </td>
                        <td>
                            <button id='send_message' onClick={() => {send_provider()}}>Send</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}

export default Conversation
