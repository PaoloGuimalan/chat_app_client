import React from 'react'
import '../../../styles/tabs/feed/index.css'
import DefaultProfile from '../../../assets/imgs/default.png'
import { FcAddImage } from 'react-icons/fc'

function Feed() {
  return (
    <div id='div_feed'>
        <div id='div_feed_header_post_input'>
            <div id='div_img_feed_header_container'>
                <img src={DefaultProfile} id='img_feed_header' />
            </div>
            <div id='div_input_feed_flex'>
                <input type='text' placeholder="Share your thoughts..." id='input_feed_box' />
            </div>
            <div id='div_btn_image_container'>
                <button id='btn_image_feed' disabled={true}>
                    <FcAddImage style={{fontSize: "35px"}} />
                </button>
            </div>
        </div>
        <span className='span_underdevelopment_label'>News Feed (Under Development)</span>
    </div>
  )
}

export default Feed