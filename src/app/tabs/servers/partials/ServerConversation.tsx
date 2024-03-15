import { conversationsetupstate } from "@/redux/actions/states";
import { SET_CONVERSATION_SETUP } from "@/redux/types";
import { InitServerConversationRequest } from "@/reusables/hooks/requests";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import Conversation from "../../messenger/Conversation";
import { motion } from "framer-motion";

function ServerConversation() {
    
  const screensizelistener = useSelector((state: any) => state.screensizelistener);
  const conversationsetup = useSelector((state: any) => state.conversationsetup);
  const params = useParams();
  const dispatch = useDispatch();

  const [isconversationsetuploaded, setisconversationsetuploaded] = useState<boolean>(false);
  const conversationID = useMemo(() => params.conversationID, [params]);

  useEffect(() => {
    setisconversationsetuploaded(false);
    InitServerConversationRequest({
        conversationID: conversationID
    }).then((response) => {
        const conversationsetupresponse = {
            conversationid: response[0].conversationID,
            userdetails: conversationsetupstate.userdetails,
            groupdetails: {
                ...response[0].groupdetails,
                receivers: response[0].receivers
            },
            type: "server"
        }
        dispatch({
            type: SET_CONVERSATION_SETUP,
            payload:{
                conversationsetup: conversationsetupresponse
            }
        })
        setisconversationsetuploaded(true);
    }).catch((err) => {
        console.log(err);
    })
  },[conversationID]);

  useEffect(() => {

    return () => {
        dispatch({
            type: SET_CONVERSATION_SETUP,
            payload:{
                conversationsetup: conversationsetupstate
            }
        })
    }
  },[])

  return (
    <motion.div
    initial={{
       borderBottomLeftRadius: screensizelistener.W <= 900 ? "10px" : "0px",
       borderTopLeftRadius: screensizelistener.W <= 900 ? "10px" : "0px"
    }}
    animate={{
        borderBottomLeftRadius: screensizelistener.W <= 900 ? "10px" : "0px",
        borderTopLeftRadius: screensizelistener.W <= 900 ? "10px" : "0px"
    }}
    className="tw-bg-[#f1f1f2] tw-flex tw-flex-col tw-flex-1 tw-items-center tw-justify-center tw-h-full tw-rounded-tr-[10px] tw-rounded-br-[10px]">
        {conversationsetup.conversationid && isconversationsetuploaded ? (
            <Conversation conversationsetup={conversationsetup} />
        ) : (
            <div className="tw-rounded-[10px] tw-bg-white tw-flex tw-items-center tw-justify-center tw-w-full tw-h-full">
                <span className="tw-text-[13px]">Loading...</span>
            </div>
        )}
    </motion.div>
  )
}

export default ServerConversation