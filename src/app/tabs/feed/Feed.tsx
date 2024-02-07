import '../../../styles/styles.css'
import DefaultProfile from '../../../assets/imgs/default.png'
import { FcAddImage } from 'react-icons/fc'
import ChatterLoopImg from '../../../assets/imgs/chatterloop.png'

function Feed() {
  return (
    <div id='div_feed' className='thinscroller'>
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
        <div id='div_feed_contents_container'>
            {/* map posts here */}
            <div className='div_feed_post_container'> {/** div container fpr all posts */}
                <div className='div_post_content'>
                    <div id='div_img_welcome_container'>
                        <img src={ChatterLoopImg} id='img_welcome_post_pic' />
                    </div>
                    <div id='div_welcome_post_labels_container'>
                        <span id='span_welcome_post_label_cl'>Welcome to Chatterloop</span>
                        <span id='span_welcome_post_label_h2'>Link . Share . Explore</span>
                        <span id='span_welcome_post_par_cl'>A new way of connection. A visual connection, more visible and interactable way of social media.</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}

export default Feed