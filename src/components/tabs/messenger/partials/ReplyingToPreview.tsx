import { IoDocumentOutline } from "react-icons/io5"
import { motion } from "framer-motion"

function ReplyingToPreview({ cnvs, fromOther, yourReply }: any) {
    if(cnvs){
        const ifFromUser = cnvs.sender === fromOther;
        if(cnvs.messageType == "text"){
            return(
                <motion.div
                className='div_messages_result_reply tw-items-center'>
                    <motion.div
                    initial={{
                        marginLeft: yourReply ? "auto" : "0px",
                        alignItems: "flex-end"
                    }}
                    animate={{
                        marginLeft: yourReply ? "auto" : "0px",
                        alignItems: "flex-end"
                    }}
                    className='tw-flex tw-flex-col tw-w-fit tw-max-w-[100%]'>
                        <motion.span
                        initial={{
                            backgroundColor: ifFromUser? "#82b7f6" : "#ececec",
                            border: ifFromUser? "solid 1px #82b7f6" : "solid 1px #ececec",
                            color: "white",
                            // marginLeft: "auto" : "0px"
                        }}
                        animate={{
                            backgroundColor: ifFromUser? "#82b7f6" : "#ececec",
                            border: ifFromUser? "solid 1px #82b7f6" : "solid 1px #ececec",
                            color: "white",
                            // marginLeft: cnvs.sender == authentication.user.userID? "auto" : "0px"
                        }}
                        className='span_messages_result c1'>{cnvs.content}</motion.span>
                    </motion.div>
                </motion.div>
            )
        }
        else if(cnvs.messageType == "image"){
            return(
                <motion.div
                className='div_messages_result_reply tw-items-center'>
                    <motion.div
                    initial={{
                        marginLeft: "auto",
                        alignItems: "flex-end"
                    }}
                    animate={{
                        marginLeft: "auto",
                        alignItems: "flex-end"
                    }}
                    className='tw-flex tw-flex-col tw-w-fit tw-max-w-[100%]'>
                        <div className='div_pending_content_container_sending'>
                            <img src={cnvs.content} className='img_pending_images' />
                        </div>
                    </motion.div>
                </motion.div>
            )
        }
        else if(cnvs.messageType.includes("video")){
            return(
                <motion.div
                className='div_messages_result_reply tw-items-center'>
                    <motion.div
                    initial={{
                        marginLeft: "auto",
                        alignItems: "flex-end"
                    }}
                    animate={{
                        marginLeft: "auto",
                        alignItems: "flex-end"
                    }}
                    className='tw-flex tw-flex-col tw-w-fit tw-max-w-[100%]'>
                        <div className='div_pending_content_container_sending'>
                            <video src={cnvs.content.split("%%%")[0].replace("###", "%23%23%23")} controls className='tw-w-full tw-h-[300px] tw-border-[7px]' />
                        </div>
                    </motion.div>
                </motion.div>
            )
        }
        else if(cnvs.messageType.includes("audio")){
            return(
                <motion.div
                className='div_messages_result_reply tw-items-center'>
                    <motion.div
                    initial={{
                        marginLeft: "auto",
                        alignItems: "flex-end"
                    }}
                    animate={{
                        marginLeft: "auto",
                        alignItems: "flex-end"
                    }}
                    className='tw-flex tw-flex-col tw-w-[250px] tw-max-w-[100%]'>
                        <div className='div_pending_audio_content_container_sending'>
                            <audio src={cnvs.content.split("%%%")[0].replace("###", "%23%23%23")} controls className='tw-w-full tw-border-[7px]' />
                        </div>
                    </motion.div>
                </motion.div>
            )
        }
        else{
            return(
                <motion.div
                className='div_messages_result_reply tw-items-center'>
                    <motion.div
                    initial={{
                        marginLeft: "auto",
                        alignItems: "flex-end"
                    }}
                    animate={{
                        marginLeft: "auto",
                        alignItems: "flex-end"
                    }}
                    className='tw-opacity-[0.7] tw-flex tw-flex-col tw-w-[250px] tw-max-w-[100%]'>
                        <div className='tw-w-[calc(100%-20px)] tw-h-[70px] tw-bg-[#e4e4e4] tw-rounded-[7px] tw-flex tw-flex-row tw-items-center tw-pl-[10px] tw-pr-[10px] tw-gap-[5px]'>
                            <div className='tw-w-full tw-max-w-[40px]'>
                                <IoDocumentOutline style={{ fontSize: "40px" }} />
                            </div>
                            <span className='tw-text-[12px] tw-break-all ellipsis-3-lines tw-font-semibold'>{cnvs.content.split("%%%")[1]}</span>
                        </div>
                    </motion.div>
                </motion.div>
            )
        }
    }
}

export default ReplyingToPreview