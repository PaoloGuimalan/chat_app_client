import React, { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'

function CallVideoBlocks() {

  const mediamyvideoholder = useSelector(state => state.mediamyvideoholder);
  const videoRef = useRef(null)

  useEffect(() => {
    if(videoRef){
        if(mediamyvideoholder){
            videoRef.current.srcObject = mediamyvideoholder;
            videoRef.current.addEventListener('loadedmetadata', () => {
                videoRef.current.play()
            })
        }
    }
  },[videoRef, mediamyvideoholder])

  return (
    <div className='div_video_blocks'>
        {mediamyvideoholder && (
            <video className='video_call_display' ref={videoRef} />
        )}
    </div>
  )
}

export default CallVideoBlocks