import { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'

function CallVideoBlocks() {

  const mediamyvideoholder = useSelector((state: any) => state.mediamyvideoholder);
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if(videoRef){
        if(videoRef.current){
          if(mediamyvideoholder){
            videoRef.current.srcObject = mediamyvideoholder;
            videoRef.current.addEventListener('loadedmetadata', () => {
                if(videoRef.current){
                  videoRef.current.muted = true;
                  videoRef.current.play()
                }
            })
        }
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