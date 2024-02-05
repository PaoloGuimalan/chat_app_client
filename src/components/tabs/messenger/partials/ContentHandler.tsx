import { motion } from "framer-motion"
import { useSelector } from "react-redux"
import ReplyingToPreview from "./ReplyingToPreview"
import MessageOptions from "../MessageOptions"
import { IoDocumentOutline } from "react-icons/io5"
import { ContentHandlerProp } from "@/reusables/vars/props"
import { MdOutlineAddReaction } from "react-icons/md"
import { useEffect, useState } from "react"
import EmojiPickerHandler from "./EmojiPickerHandler"

function ContentHandler({ i, cnvs, conversationsetup, setisReplying, setfullImageScreen, scrollBottom }: ContentHandlerProp) {

    const authentication = useSelector((state: any) => state.authentication)

    const [toggleEmojiPicker, settoggleEmojiPicker] = useState<boolean>(false);
    const [reactions, setreactions] = useState<any[]>(cnvs.reactions ? cnvs.reactions : []);

    useEffect(() => {
        setreactions(cnvs.reactions ? cnvs.reactions : []);
    },[cnvs.reactions])

    if(cnvs.isDeleted){
        return(
            <motion.div
                className='div_messages_result tw-items-center'>
                    <motion.div
                    initial={{
                        marginLeft: cnvs.sender == authentication.user.userID? "auto" : "0px",
                        alignItems: cnvs.sender == authentication.user.userID? "flex-end" : "flex-start"
                    }}
                    animate={{
                        marginLeft: cnvs.sender == authentication.user.userID? "auto" : "0px",
                        alignItems: cnvs.sender == authentication.user.userID? "flex-end" : "flex-start"
                    }}
                    className='tw-flex tw-flex-col tw-w-fit tw-max-w-[70%]'>
                        {cnvs.isReply && (
                            <span className='span_sender_reply_label'>replied to {
                                cnvs.replyedmessage[0].sender === authentication.user.userID ? "your message" : `@${cnvs.replyedmessage[0].sender}`
                            }</span>
                        )}
                        {conversationsetup.type == "group" && authentication.user.userID != cnvs.sender && (<span className='span_sender_label'>{cnvs.sender}</span>)}
                        {cnvs.isReply && (
                            <ReplyingToPreview cnvs={cnvs.replyedmessage[0]} fromOther={authentication.user.userID} yourReply={cnvs.sender == authentication.user.userID ? true : false} />
                        )}
                        <motion.span
                        title={`${cnvs.messageDate.date} ${cnvs.messageDate.time}`}
                        initial={{
                            backgroundColor: cnvs.sender == authentication.user.userID? "white" : "white",
                            border: cnvs.sender == authentication.user.userID? "solid 1px #1c7DEF" : "solid 1px rgb(222, 222, 222)",
                            color: cnvs.sender == authentication.user.userID? "white" : "#3b3b3b",
                            // marginLeft: cnvs.sender == authentication.user.userID? "auto" : "0px"
                        }}
                        animate={{
                            backgroundColor: cnvs.sender == authentication.user.userID? "white" : "white",
                            border: cnvs.sender == authentication.user.userID? "solid 1px rgb(222, 222, 222)" : "solid 1px rgb(222, 222, 222)",
                            color: cnvs.sender == authentication.user.userID? "rgb(222, 222, 222)" : "rgb(222, 222, 222)",
                            // marginLeft: cnvs.sender == authentication.user.userID? "auto" : "0px"
                        }}
                        className='span_messages_result c1'>Message deleted</motion.span>
                        {conversationsetup.type == "group"? (
                            i === 0 && cnvs.seeners.filter((mp: any) => mp != cnvs.sender && mp != authentication.user.userID).length > 0 && ( //conversationList.length - 1 == i
                                <motion.div
                                initial={{
                                    justifyContent: cnvs.sender == authentication.user.userID? "flex-end" : "flex-start",
                                }}
                                animate={{
                                    justifyContent: cnvs.sender == authentication.user.userID? "flex-end" : "flex-start",
                                }}
                                className='div_seen_container'>
                                    <span className='span_seenby'>Seen by </span>
                                    {cnvs.seeners.filter((mp: any) => mp != cnvs.sender && mp != authentication.user.userID).map((mp: any, i: number) => {
                                        if(mp != authentication.user.userID && mp != cnvs.sender){
                                            return(
                                                <span className='span_seenby' key={i}>{mp}</span>
                                            )
                                        }
                                    })}
                                </motion.div>
                            )
                        ) : (
                            i === 0 && cnvs.seeners.filter((mp: any) => mp != cnvs.sender && mp != authentication.user.userID).length > 0 && (
                                <motion.div
                                initial={{
                                    justifyContent: cnvs.sender == authentication.user.userID? "flex-end" : "flex-start",
                                }}
                                animate={{
                                    justifyContent: cnvs.sender == authentication.user.userID? "flex-end" : "flex-start",
                                }}
                                className='div_seen_container'>
                                    <span className='span_seenby'>Seen</span>
                                </motion.div>
                            )
                        )}
                    </motion.div>
                </motion.div>
            )
    }
    else{
        if(cnvs.messageType == "text"){
            return(
                <motion.div
                key={i}
                className='div_messages_result tw-items-center'>
                    {cnvs.sender === authentication.user.userID && (
                        <MessageOptions conversationID={cnvs.conversationID} messageID={cnvs.messageID} type='sender' setisReplying={() => { setisReplying({ isReply: true, replyingTo: cnvs.messageID }) }} />
                    )}
                    <motion.div
                    initial={{
                        marginLeft: cnvs.sender == authentication.user.userID? "auto" : "0px",
                        alignItems: cnvs.sender == authentication.user.userID? "flex-end" : "flex-start"
                    }}
                    animate={{
                        marginLeft: cnvs.sender == authentication.user.userID? "auto" : "0px",
                        alignItems: cnvs.sender == authentication.user.userID? "flex-end" : "flex-start"
                    }}
                    className='tw-flex tw-flex-col tw-w-fit tw-max-w-[70%]'>
                        {cnvs.isReply && (
                            <span className='span_sender_reply_label'>replied to {
                                cnvs.replyedmessage[0].sender === authentication.user.userID ? "your message" : `@${cnvs.replyedmessage[0].sender}`
                            }</span>
                        )}
                        {conversationsetup.type == "group" && authentication.user.userID != cnvs.sender && (<span className='span_sender_label'>{cnvs.sender}</span>)}
                        {cnvs.isReply && (
                            <ReplyingToPreview cnvs={cnvs.replyedmessage[0]} fromOther={authentication.user.userID} yourReply={cnvs.sender == authentication.user.userID ? true : false} />
                        )}
                        <motion.div
                        title={`${cnvs.messageDate.date} ${cnvs.messageDate.time}`}
                        initial={{
                            backgroundColor: cnvs.sender == authentication.user.userID? "#1c7DEF" : "rgb(222, 222, 222)",
                            border: cnvs.sender == authentication.user.userID? "solid 1px #1c7DEF" : "solid 1px rgb(222, 222, 222)",
                            color: cnvs.sender == authentication.user.userID? "white" : "#3b3b3b",
                            // marginLeft: cnvs.sender == authentication.user.userID? "auto" : "0px"
                        }}
                        animate={{
                            backgroundColor: cnvs.sender == authentication.user.userID? "#1c7DEF" : "rgb(222, 222, 222)",
                            border: cnvs.sender == authentication.user.userID? "solid 1px #1c7DEF" : "solid 1px rgb(222, 222, 222)",
                            color: cnvs.sender == authentication.user.userID? "white" : "#3b3b3b",
                            // marginLeft: cnvs.sender == authentication.user.userID? "auto" : "0px"
                        }}
                        className='span_messages_result c1 tw-mb-[7px]'>
                            <span>{cnvs.content}</span>
                            <div 
                            className={`tw-w-full tw--mb-[15px] tw-mt-[5px] tw-bg-transparent tw-flex tw-flex-row tw-items-center ${cnvs.sender == authentication.user.userID? "tw-justify-end" : "tw-justify-start"}`}>
                                <div 
                                className="tw-w-fit tw-bg-white tw-rounded-[20px] tw-h-[20px] tw-text-[#3b3b3b] tw-pl-[2px] tw-pr-[2px]"
                                style={{
                                    border: "solid 1px rgb(222, 222, 222)"
                                }}>
                                    {toggleEmojiPicker && (
                                        <EmojiPickerHandler conversationID={cnvs.conversationID} messageID={cnvs.messageID} fromSender={cnvs.sender == authentication.user.userID? true : false} settoggleEmojiPicker={settoggleEmojiPicker} setreactions={setreactions} />
                                    )}
                                    <div className="tw-select-none tw-cursor-pointer tw-w-fit tw-h-[20px] tw-max-w-[100px] tw-items-center tw-justify-center tw-flex tw-flex-row tw-overflow-x-hidden tw-overflow-y-hidden">
                                        {cnvs.sender === authentication.user.userID && (
                                            <div className="tw-w-fit tw-bg-transparent tw-h-[20px] tw-flex tw-flex-col tw-items-center tw-overflow-hidden">
                                                {reactions.map((mp: any) => {
                                                    return(mp.emoji);
                                                })}
                                            </div>
                                        )}
                                        {cnvs.sender === authentication.user.userID && reactions.length > 4 && (
                                            <span className="tw-text-[10px] tw-w-fit" style={{ whiteSpace: "nowrap" }}>+{reactions.length - 4}</span>
                                        )}
                                        {reactions.filter((flt: any) => flt.userID === authentication.user.userID).length === 0 && (
                                            <button onClick={() => { settoggleEmojiPicker(!toggleEmojiPicker) }} className="tw-h-[20px] tw-w-[25px] tw-border-none tw-bg-transparent tw-flex tw-items-center tw-justify-center tw-cursor-pointer">
                                                <MdOutlineAddReaction />
                                            </button>
                                        )}
                                        {cnvs.sender !== authentication.user.userID && reactions.length > 4 && (
                                            <span className="tw-text-[10px] tw-w-fit" style={{ whiteSpace: "nowrap" }}>+{reactions.length - 4}</span>
                                        )}
                                        {cnvs.sender !== authentication.user.userID && (
                                            <div className="tw-w-fit tw-bg-transparent tw-h-[20px] tw-flex tw-flex-col tw-items-center tw-overflow-hidden">
                                                {reactions.map((mp: any) => {
                                                    return(mp.emoji);
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                        {conversationsetup.type == "group"? (
                            i === 0 && cnvs.seeners.filter((mp: any) => mp != cnvs.sender && mp != authentication.user.userID).length > 0 && (
                                <motion.div
                                initial={{
                                    justifyContent: cnvs.sender == authentication.user.userID? "flex-end" : "flex-start",
                                }}
                                animate={{
                                    justifyContent: cnvs.sender == authentication.user.userID? "flex-end" : "flex-start",
                                }}
                                className='div_seen_container'>
                                    <span className='span_seenby'>Seen by </span>
                                    {cnvs.seeners.filter((mp: any) => mp != cnvs.sender && mp != authentication.user.userID).map((mp: any, i: number) => {
                                        if(mp != authentication.user.userID && mp != cnvs.sender){
                                            return(
                                                <span className='span_seenby' key={i}>{mp}</span>
                                            )
                                        }
                                    })}
                                </motion.div>
                            )
                        ) : (
                            i === 0 && cnvs.seeners.filter((mp: any) => mp != cnvs.sender && mp != authentication.user.userID).length > 0 && (
                                <motion.div
                                initial={{
                                    justifyContent: cnvs.sender == authentication.user.userID? "flex-end" : "flex-start",
                                }}
                                animate={{
                                    justifyContent: cnvs.sender == authentication.user.userID? "flex-end" : "flex-start",
                                }}
                                className='div_seen_container'>
                                    <span className='span_seenby'>Seen</span>
                                </motion.div>
                            )
                        )}
                    </motion.div>
                    {cnvs.sender !== authentication.user.userID && (
                        <MessageOptions conversationID={cnvs.conversationID} messageID={cnvs.messageID} type='receiver' setisReplying={() => { setisReplying({ isReply: true, replyingTo: cnvs.messageID }) }} />
                    )}
                </motion.div>
            )
        }
        else if(cnvs.messageType == "image"){
            return(
                <motion.div
                key={i} className='div_pending_images div_messages_result'>
                    {cnvs.sender === authentication.user.userID && (
                        <MessageOptions conversationID={cnvs.conversationID} messageID={cnvs.messageID} type='sender' setisReplying={() => { setisReplying({ isReply: true, replyingTo: cnvs.messageID }) }} />
                    )}
                    <motion.div
                    initial={{
                        marginLeft: cnvs.sender == authentication.user.userID? "auto" : "0px",
                        alignItems: cnvs.sender == authentication.user.userID? "flex-end" : "flex-start"
                    }}
                    animate={{
                        marginLeft: cnvs.sender == authentication.user.userID? "auto" : "0px",
                        alignItems: cnvs.sender == authentication.user.userID? "flex-end" : "flex-start"
                    }}
                    className='tw-flex tw-flex-col tw-w-fit tw-max-w-[70%]'>
                        {cnvs.isReply && (
                            <span className='span_sender_reply_label'>replied to {
                                cnvs.replyedmessage[0].sender === authentication.user.userID ? "your message" : `@${cnvs.replyedmessage[0].sender}`
                            }</span>
                        )}
                        {conversationsetup.type == "group" && authentication.user.userID != cnvs.sender && (<span className='span_sender_label'>{cnvs.sender}</span>)}
                        {cnvs.isReply && (
                            <ReplyingToPreview cnvs={cnvs.replyedmessage[0]} fromOther={authentication.user.userID} yourReply={cnvs.sender == authentication.user.userID ? true : false} />
                        )}
                        <div className='div_pending_content_container'
                        title={`${cnvs.messageDate.date} ${cnvs.messageDate.time}`}>
                            <img src={cnvs.content} className='img_pending_images' onClick={() => {
                                setfullImageScreen({
                                    preview: cnvs.content,
                                    toggle: true
                                })
                            }} onLoad={() => {
                                scrollBottom()
                            }} />
                        </div>
                        {conversationsetup.type == "group"? (
                            i === 0 && cnvs.seeners.filter((mp: any) => mp != cnvs.sender && mp != authentication.user.userID).length > 0 && (
                                <motion.div
                                initial={{
                                    justifyContent: cnvs.sender == authentication.user.userID? "flex-end" : "flex-start",
                                }}
                                animate={{
                                    justifyContent: cnvs.sender == authentication.user.userID? "flex-end" : "flex-start",
                                }}
                                className='div_seen_container'>
                                    <span className='span_seenby'>Seen by </span>
                                    {cnvs.seeners.filter((mp: any) => mp != cnvs.sender).map((mp: any, i: number) => {
                                        if(mp != authentication.user.userID){
                                            return(
                                                <span className='span_seenby' key={i}>{mp}</span>
                                            )
                                        }
                                    })}
                                </motion.div>
                            )
                        ) : (
                            i === 0 && cnvs.seeners.filter((mp: any) => mp != cnvs.sender && mp != authentication.user.userID).length > 0 && (
                                <motion.div
                                initial={{
                                    justifyContent: cnvs.sender == authentication.user.userID? "flex-end" : "flex-start",
                                }}
                                animate={{
                                    justifyContent: cnvs.sender == authentication.user.userID? "flex-end" : "flex-start",
                                }}
                                className='div_seen_container'>
                                    <span className='span_seenby'>Seen</span>
                                </motion.div>
                            )
                        )}
                    </motion.div>
                    {cnvs.sender !== authentication.user.userID && (
                        <MessageOptions conversationID={cnvs.conversationID} messageID={cnvs.messageID} type='receiver' setisReplying={() => { setisReplying({ isReply: true, replyingTo: cnvs.messageID }) }} />
                    )}
                </motion.div>
            )
        }
        else if(cnvs.messageType.includes("video")){
            return(
                <motion.div
                key={i}
                className='div_pending_images div_messages_result'>
                    {cnvs.sender === authentication.user.userID && (
                        <MessageOptions conversationID={cnvs.conversationID} messageID={cnvs.messageID} type='sender' setisReplying={() => { setisReplying({ isReply: true, replyingTo: cnvs.messageID }) }} />
                    )}
                    <motion.div
                    initial={{
                        marginLeft: cnvs.sender == authentication.user.userID? "auto" : "0px",
                        alignItems: cnvs.sender == authentication.user.userID? "flex-end" : "flex-start"
                    }}
                    animate={{
                        marginLeft: cnvs.sender == authentication.user.userID? "auto" : "0px",
                        alignItems: cnvs.sender == authentication.user.userID? "flex-end" : "flex-start"
                    }}
                    className='tw-flex tw-flex-col tw-w-fit tw-max-w-[70%]'>
                        {cnvs.isReply && (
                            <span className='span_sender_reply_label'>replied to {
                                cnvs.replyedmessage[0].sender === authentication.user.userID ? "your message" : `@${cnvs.replyedmessage[0].sender}`
                            }</span>
                        )}
                        {conversationsetup.type == "group" && authentication.user.userID != cnvs.sender && (<span className='span_sender_label'>{cnvs.sender}</span>)}
                        {cnvs.isReply && (
                            <ReplyingToPreview cnvs={cnvs.replyedmessage[0]} fromOther={authentication.user.userID} yourReply={cnvs.sender == authentication.user.userID ? true : false} />
                        )}
                        <div className='div_pending_content_container'
                        title={`${cnvs.messageDate.date} ${cnvs.messageDate.time}`}>
                            <video src={cnvs.content.split("%%%")[0].replace("###", "%23%23%23")} controls className='tw-w-full tw-h-[300px] tw-border-[7px]' onLoad={() => {
                                scrollBottom()
                            }} />
                        </div>
                        {conversationsetup.type == "group"? (
                            i === 0 && cnvs.seeners.filter((mp: any) => mp != cnvs.sender && mp != authentication.user.userID).length > 0 && (
                                <motion.div
                                initial={{
                                    justifyContent: cnvs.sender == authentication.user.userID? "flex-end" : "flex-start",
                                }}
                                animate={{
                                    justifyContent: cnvs.sender == authentication.user.userID? "flex-end" : "flex-start",
                                }}
                                className='div_seen_container'>
                                    <span className='span_seenby'>Seen by </span>
                                    {cnvs.seeners.filter((mp: any) => mp != cnvs.sender).map((mp: any, i: number) => {
                                        if(mp != authentication.user.userID){
                                            return(
                                                <span className='span_seenby' key={i}>{mp}</span>
                                            )
                                        }
                                    })}
                                </motion.div>
                            )
                        ) : (
                            i === 0 && cnvs.seeners.filter((mp: any) => mp != cnvs.sender && mp != authentication.user.userID).length > 0 && (
                                <motion.div
                                initial={{
                                    justifyContent: cnvs.sender == authentication.user.userID? "flex-end" : "flex-start",
                                }}
                                animate={{
                                    justifyContent: cnvs.sender == authentication.user.userID? "flex-end" : "flex-start",
                                }}
                                className='div_seen_container'>
                                    <span className='span_seenby'>Seen</span>
                                </motion.div>
                            )
                        )}
                    </motion.div>
                    {cnvs.sender !== authentication.user.userID && (
                        <MessageOptions conversationID={cnvs.conversationID} messageID={cnvs.messageID} type='receiver' setisReplying={() => { setisReplying({ isReply: true, replyingTo: cnvs.messageID }) }} />
                    )}
                </motion.div>
            )
        }
        else if(cnvs.messageType.includes("audio")){
            return(
                <motion.div
                key={i}
                className='div_pending_audios div_messages_result'>
                    {cnvs.sender === authentication.user.userID && (
                        <MessageOptions conversationID={cnvs.conversationID} messageID={cnvs.messageID} type='sender' setisReplying={() => { setisReplying({ isReply: true, replyingTo: cnvs.messageID }) }} />
                    )}
                    <motion.div
                    initial={{
                        marginLeft: cnvs.sender == authentication.user.userID? "auto" : "0px",
                        alignItems: cnvs.sender == authentication.user.userID? "flex-end" : "flex-start"
                    }}
                    animate={{
                        marginLeft: cnvs.sender == authentication.user.userID? "auto" : "0px",
                        alignItems: cnvs.sender == authentication.user.userID? "flex-end" : "flex-start"
                    }}
                    className='tw-flex tw-flex-col tw-w-full tw-max-w-[70%]'>
                        {cnvs.isReply && (
                            <span className='span_sender_reply_label'>replied to {
                                cnvs.replyedmessage[0].sender === authentication.user.userID ? "your message" : `@${cnvs.replyedmessage[0].sender}`
                            }</span>
                        )}
                        {conversationsetup.type == "group" && authentication.user.userID != cnvs.sender && (<span className='span_sender_label'>{cnvs.sender}</span>)}
                        {cnvs.isReply && (
                            <ReplyingToPreview cnvs={cnvs.replyedmessage[0]} fromOther={authentication.user.userID} yourReply={cnvs.sender == authentication.user.userID ? true : false} />
                        )}
                        <div className='tw-w-full'
                        title={`${cnvs.messageDate.date} ${cnvs.messageDate.time}`}>
                            <audio src={cnvs.content.split("%%%")[0].replace("###", "%23%23%23")} controls className='tw-w-full tw-border-[7px]' onLoad={() => {
                                scrollBottom()
                            }} />
                        </div>
                        {conversationsetup.type == "group"? (
                            i === 0 && cnvs.seeners.filter((mp: any) => mp != cnvs.sender && mp != authentication.user.userID).length > 0 && (
                                <motion.div
                                initial={{
                                    justifyContent: cnvs.sender == authentication.user.userID? "flex-end" : "flex-start",
                                }}
                                animate={{
                                    justifyContent: cnvs.sender == authentication.user.userID? "flex-end" : "flex-start",
                                }}
                                className='div_seen_container'>
                                    <span className='span_seenby'>Seen by </span>
                                    {cnvs.seeners.filter((mp: any) => mp != cnvs.sender).map((mp: any, i: number) => {
                                        if(mp != authentication.user.userID){
                                            return(
                                                <span className='span_seenby' key={i}>{mp}</span>
                                            )
                                        }
                                    })}
                                </motion.div>
                            )
                        ) : (
                            i === 0 && cnvs.seeners.filter((mp: any) => mp != cnvs.sender && mp != authentication.user.userID).length > 0 && (
                                <motion.div
                                initial={{
                                    justifyContent: cnvs.sender == authentication.user.userID? "flex-end" : "flex-start",
                                }}
                                animate={{
                                    justifyContent: cnvs.sender == authentication.user.userID? "flex-end" : "flex-start",
                                }}
                                className='div_seen_container'>
                                    <span className='span_seenby'>Seen</span>
                                </motion.div>
                            )
                        )}
                    </motion.div>
                    {cnvs.sender !== authentication.user.userID && (
                        <MessageOptions conversationID={cnvs.conversationID} messageID={cnvs.messageID} type='receiver' setisReplying={() => { setisReplying({ isReply: true, replyingTo: cnvs.messageID }) }} />
                    )}
                </motion.div>
            )
        }
        else if(cnvs.messageType.includes("notif")){
            return(
                <div key={i} className='tw-w-full tw-pt-[5px] tw-pb-[10px]'>
                    <span className='tw-text-[12px] tw-font-inter'>{cnvs.content}</span>
                </div>
            )
        }
        else{
            return(
                <motion.div
                key={i}
                className='div_pending_images div_messages_result'>
                    {cnvs.sender === authentication.user.userID && (
                        <MessageOptions conversationID={cnvs.conversationID} messageID={cnvs.messageID} type='sender' setisReplying={() => { setisReplying({ isReply: true, replyingTo: cnvs.messageID }) }} />
                    )}
                    <motion.div
                    initial={{
                        marginLeft: cnvs.sender == authentication.user.userID? "auto" : "0px",
                        alignItems: cnvs.sender == authentication.user.userID? "flex-end" : "flex-start"
                    }}
                    animate={{
                        marginLeft: cnvs.sender == authentication.user.userID? "auto" : "0px",
                        alignItems: cnvs.sender == authentication.user.userID? "flex-end" : "flex-start"
                    }}
                    className='tw-flex tw-flex-col tw-w-full tw-max-w-[70%]'>
                        {cnvs.isReply && (
                            <span className='span_sender_reply_label'>replied to {
                                cnvs.replyedmessage[0].sender === authentication.user.userID ? "your message" : `@${cnvs.replyedmessage[0].sender}`
                            }</span>
                        )}
                        {conversationsetup.type == "group" && authentication.user.userID != cnvs.sender && (<span className='span_sender_label'>{cnvs.sender}</span>)}
                        {cnvs.isReply && (
                            <ReplyingToPreview cnvs={cnvs.replyedmessage[0]} fromOther={authentication.user.userID} yourReply={cnvs.sender == authentication.user.userID ? true : false} />
                        )}
                        <div onClick={() => {
                            window.open(cnvs.content.split("%%%")[0].replace("###", "%23%23%23"), '_blank')
                        }} className='tw-w-[calc(100%-20px)] tw-h-[70px] tw-bg-[#e4e4e4] tw-rounded-[7px] tw-flex tw-flex-row tw-items-center tw-pl-[10px] tw-pr-[10px] tw-gap-[5px]'
                        title={`${cnvs.messageDate.date} ${cnvs.messageDate.time}`}>
                            <div className='tw-w-full tw-max-w-[40px]'>
                                <IoDocumentOutline style={{ fontSize: "40px" }} />
                            </div>
                            <span className='tw-text-[12px] tw-break-all ellipsis-3-lines tw-font-semibold'>{cnvs.content.split("%%%")[1]}</span>
                        </div>
                        {conversationsetup.type == "group"? (
                            i === 0 && cnvs.seeners.filter((mp: any) => mp != cnvs.sender && mp != authentication.user.userID).length > 0 && (
                                <motion.div
                                initial={{
                                    justifyContent: cnvs.sender == authentication.user.userID? "flex-end" : "flex-start",
                                }}
                                animate={{
                                    justifyContent: cnvs.sender == authentication.user.userID? "flex-end" : "flex-start",
                                }}
                                className='div_seen_container'>
                                    <span className='span_seenby'>Seen by </span>
                                    {cnvs.seeners.filter((mp: any) => mp != cnvs.sender).map((mp: any, i: number) => {
                                        if(mp != authentication.user.userID){
                                            return(
                                                <span className='span_seenby' key={i}>{mp}</span>
                                            )
                                        }
                                    })}
                                </motion.div>
                            )
                        ) : (
                            i === 0 && cnvs.seeners.filter((mp: any) => mp != cnvs.sender && mp != authentication.user.userID).length > 0 && (
                                <motion.div
                                initial={{
                                    justifyContent: cnvs.sender == authentication.user.userID? "flex-end" : "flex-start",
                                }}
                                animate={{
                                    justifyContent: cnvs.sender == authentication.user.userID? "flex-end" : "flex-start",
                                }}
                                className='div_seen_container'>
                                    <span className='span_seenby'>Seen</span>
                                </motion.div>
                            )
                        )}
                    </motion.div>
                    {cnvs.sender !== authentication.user.userID && (
                        <MessageOptions conversationID={cnvs.conversationID} messageID={cnvs.messageID} type='receiver' setisReplying={() => { setisReplying({ isReply: true, replyingTo: cnvs.messageID }) }} />
                    )}
                </motion.div>
            )
        }
    }
}

export default ContentHandler