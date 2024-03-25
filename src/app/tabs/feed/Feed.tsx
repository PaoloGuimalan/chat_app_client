import '../../../styles/styles.css'
import DefaultProfile from '../../../assets/imgs/default.png'
import { FcAddImage } from 'react-icons/fc'
import ChatterLoopImg from '../../../assets/imgs/chatterloop.png'
import { useEffect, useRef, useState } from 'react'
import { GetFeedRequest } from '@/reusables/hooks/requests'
import PostItem from '../profile/PostItem'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import { motion } from 'framer-motion'

function Feed() {

  const [range, setrange] = useState<number>(10); //setrange
  const [posts, setposts] = useState<any[]>([]);

  const divcontentRef = useRef<HTMLDivElement | null>(null);
  const divlazyloaderRef = useRef<HTMLDivElement | null>(null);

  const GetFeedProcess = () => {
    GetFeedRequest({
        range: range
    }).then((response) => {
        // console.log(response);
        setposts(response.posts);
    }).catch((err) => {
        console.log(err);
    })
  }

  useEffect(() => {
    var currentView = false;
    if(divcontentRef){
        if(divcontentRef.current){
            divcontentRef.current.onscroll = () => {
                // console.log("Hello")
                if(divlazyloaderRef && divlazyloaderRef.current){
                    const top = divlazyloaderRef.current.getBoundingClientRect().top;
                    const isVisible = (top + 0) >= 0 && (top - 0) <= window.innerHeight;
                    // const isVisible = top > 0 ? true : false;
                    // console.log((top + 0) >= 0 && (top - 0) <= window.innerHeight);
                    if(currentView != isVisible){
                        currentView = isVisible;
                        if(currentView){
                            setrange((prev) => prev + 10);
                        }
                    }
                }
            }
        }
    }
  },[divcontentRef, divlazyloaderRef]);

  useEffect(() => {
    GetFeedProcess();
  },[range]);

  return (
    <div id='div_feed' className='thinscroller' ref={divcontentRef}>
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
            {posts.length === 0 && (
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
            )}
            {/* map posts here */}
            {posts.map((mp: any, i: number) => {
                return(
                    <PostItem key={i} mp={mp} />
                )
            })}
            {posts.length > 0 && (
                <div ref={divlazyloaderRef} id='divlazyloader' className='tw-bg-transparent tw-w-full tw-flex tw-items-center tw-justify-center tw-mt-[5px] tw-mb-[5px]'>
                    <motion.div
                    animate={{
                        rotate: -360
                    }}
                    transition={{
                        duration: 1,
                        repeat: Infinity
                    }}
                    id='div_loader_request_conv'>
                        <AiOutlineLoading3Quarters style={{fontSize: "20px"}} />
                    </motion.div>
                </div>
            )}
        </div>
    </div>
  )
}

export default Feed