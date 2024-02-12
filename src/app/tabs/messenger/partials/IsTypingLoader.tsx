import { motion } from 'framer-motion'
import { ThreeDots } from 'react-loader-spinner'

function IsTypingLoader() {
  return (
    <motion.div
    className='div_messages_result tw-items-center'>
        <motion.div
        initial={{
            marginLeft: "0px",
            alignItems: "flex-start",
            scale: 0
        }}
        animate={{
            marginLeft: "0px",
            alignItems: "flex-start",
            scale: 1
        }}
        transition={{
            duration: 0.2
        }}
        className='tw-flex tw-flex-col tw-w-fit tw-max-w-[70%]'>
            <motion.div
            initial={{
                backgroundColor: "rgb(222, 222, 222)",
                border: "solid 1px rgb(222, 222, 222)",
                color: "#3b3b3b",
                // marginLeft: "auto" : "0px"
            }}
            animate={{
                backgroundColor: "rgb(222, 222, 222)",
                border: "solid 1px rgb(222, 222, 222)",
                color: "#3b3b3b",
                // marginLeft: cnvs.sender == authentication.user.userID? "auto" : "0px"
            }}
            className='span_messages_result c1 tw-h-[22px] tw-min-w-[40px] tw-flex tw-flex-row tw-gap-[5px] tw-items-center tw-justify-center'>
                <ThreeDots
                    visible={true}
                    height="30"
                    width="30"
                    color="#000000"
                    radius="30"
                    ariaLabel="three-dots-loading"
                    wrapperStyle={{}}
                    wrapperClass=""
                />         
            </motion.div>
        </motion.div>
    </motion.div>
  )
}

export default IsTypingLoader