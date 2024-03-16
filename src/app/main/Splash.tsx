import '../../styles/styles.css'
import ChatterLoopImg from '../../assets/imgs/chatterloop.png'
import { motion } from 'framer-motion'
import { useSelector } from 'react-redux';

function Splash() {

  const screensizelistener = useSelector((state: any) => state.screensizelistener);

  return (
    <div id='div_splash'>
      <div id={screensizelistener.W <= 900 ? 'div_icon_container_m' : 'div_icon_container'}>
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
        <span className={screensizelistener.W <= 900 ? 'span_icon_label_m' : 'span_icon_label'}>Chatterloop</span>
        <span className={screensizelistener.W <= 900 ? 'span_icon_label_m' : 'span_icon_label'}>Link . Share . Explore</span>
      </div>
    </div>
  )
}

export default Splash