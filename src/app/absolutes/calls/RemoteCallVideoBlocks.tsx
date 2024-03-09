import { useEffect, useRef } from 'react'
import '../../../styles/styles.css'

function RemoteCallVideoBlocks({ remoteStream }: any) {

  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if(videoRef){
        if(videoRef.current){
          if(remoteStream){
            videoRef.current.srcObject = remoteStream;
            videoRef.current.addEventListener('loadedmetadata', () => {
                if(videoRef.current){
                  videoRef.current.muted = true;
                  videoRef.current.play()
                }
            })
        }
        }
    }
  },[videoRef, remoteStream])

  return (
    <div className='div_video_blocks'>
        {remoteStream && (
            <video className='video_call_display' ref={videoRef} />
        )}
    </div>
  )
}

export default RemoteCallVideoBlocks