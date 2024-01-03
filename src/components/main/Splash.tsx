import '../../styles/styles.css'
import ChatterLoopImg from '../../assets/imgs/chatterloop.png'
import { motion } from 'framer-motion'

function Splash() {
  return (
    <div id='div_splash'>
      <div id='div_icon_container'>
        <motion.img
        animate={{
          scale: 1.1
        }}
        transition={{
          duration: 1,
          repeat: Infinity
        }}
        src={ChatterLoopImg} id='img_icon_splash' />
      </div>
      <div id='div_icon_labels'>
        <span className='span_icon_label'>Chatterloop</span>
        <span className='span_icon_label'>Link . Share . Explore</span>
      </div>
    </div>
  )
}

export default Splash