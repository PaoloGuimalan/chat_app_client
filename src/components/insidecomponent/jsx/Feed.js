import React , {useState, useEffect} from 'react';
import '../css/Feed.css';
import imgPerson from '../../imgs/person-icon.png';
import Submit from '@material-ui/icons/Check';
import Cancel from '@material-ui/icons/CancelOutlined';
import Like from '@material-ui/icons/ThumbUp';
import Comment from '@material-ui/icons/Comment';
import Share from '@material-ui/icons/Reply';
import Forum from '@material-ui/icons/ForumRounded';
import LoaderIcon from '@material-ui/icons/Sync';
import Axios from 'axios';
import imgpersonfeed from '../../imgs/person-icon.png';
import { motion } from 'framer-motion';

function Feed({username}) {

  const [post, setpost] = useState("");
  const [feeds, setfeeds] = useState([]);
  const [loaderfeed, setloaderfeed] = useState(false);

  const postfeed = () => {
    if(navigator.geolocation){
      navigator.geolocation.getCurrentPosition(async function(position) {
        // alert(`Lat: ${position.coords.latitude} | Long: ${position.coords.longitude}`);
        if(post != ""){
            setpost("");
            await Axios.post('https://chatappnode187.herokuapp.com/postfeed', {
              username: username,
              feed: post,
              privacy: "public",
              allowmapfeed: true,
              coordinates: [position.coords.latitude, position.coords.longitude]
            }).catch((err) => console.log(err));
        }
        else{
          alert("Write Something in the Post Box.");
        }
      })
    }
  }

  useEffect(() => {
    Axios.get('https://chatappnode187.herokuapp.com/allposts').then((response) => {
      setfeeds(response.data);
      setloaderfeed(true);
    }).catch((err) => console.log(err));
  }, [feeds]);
  

  useEffect(() => {
    // setloaderfeed(false);
    //   setTimeout(() => {
    //       setloaderfeed(true);
    //   }, 2000)
  }, []);
  

  return (
    <div id='div_feed'>
        <div id='post_nav'>
            <table id='tbl_post'>
              <tbody>
                <tr>
                  <td>
                    <img src={imgPerson} id='img_handler'/>
                  </td>
                  <td id='txt_area_td'>
                    <textarea id='post_area' placeholder='Write Something...' value={post} onChange={(e) => {setpost(e.target.value)}}></textarea>
                  </td>
                  <td>
                    <table>
                      <tbody>
                        <tr>
                          <td>
                              <button disabled={post == "" ? true:false} className='btns_post' onClick={() => postfeed()}><Submit /></button>
                          </td>
                        </tr>
                        <tr>
                          <td>
                              {post == "" ? "" : <button className='btns_post'><Cancel /></button>}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
        </div>
        {loaderfeed ? 
          feeds.map(datas => (
            <div className='feeds_divs'>
              <table className='tbl_posts_feed' key={datas.post_id}>
                <tbody>
                  <tr>
                    <td className='img_handlertd'>
                      <table>
                        <tbody>
                          <tr>
                            <td>
                              <img  id='img_handlerfeed' src={imgpersonfeed} />
                            </td>
                            <td className='td_det_user'>
                              <span id='feed_username'>{datas.username}</span>
                              <br />
                              <span id='feed_date'>{datas.date}</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <p id='feed_post'>{datas.feed}</p>
                    </td>
                  </tr>
                  <tr>
                    <td><hr className='hr_styles' /></td>
                  </tr>
                  <tr>
                    <td>
                      <ul>
                        <li className='li_feed'><Like /></li>
                        <li className='li_feed'><Comment /></li>
                        <li className='li_feed'><Share /></li>
                      </ul>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))
         : (
          <div id='feed_place'>
            <table className='tbl_posts_feed'>
              <tbody>
                <tr>
                  <td>
                    <motion.div
                     animate={{
                       rotate: '-360deg'
                     }}
                     transition={{
                       duration: 1,
                       loop: Infinity
                     }}
                     id='logo_spinner'><LoaderIcon id='logo_post' /></motion.div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <p id='label_no_post'></p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        
    </div>
  );
}

export default Feed;
