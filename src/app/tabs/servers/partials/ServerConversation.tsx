import { conversationsetupstate } from "@/redux/actions/states";
import { SET_CONVERSATION_SETUP } from "@/redux/types";
import { InitServerConversationRequest } from "@/reusables/hooks/requests";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import Conversation from "../../messenger/Conversation";

function ServerConversation() {

  const conversationsetup = useSelector((state: any) => state.conversationsetup);
  const params = useParams();
  const dispatch = useDispatch();

  const [isconversationsetuploaded, setisconversationsetuploaded] = useState<boolean>(false);
  const conversationID = useMemo(() => params.conversationID, [params]);

  useEffect(() => {
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
    <div className="tw-flex tw-flex-col tw-flex-1 tw-items-center tw-justify-center tw-h-full tw-bg-[#f1f1f2] tw-rounded-tr-[10px] tw-rounded-br-[10px]">
        {conversationsetup.conversationid && isconversationsetuploaded ? (
            <Conversation conversationsetup={conversationsetup} />
        ) : (
            <span>Loading...</span>
        )}
    </div>
  )
}

export default ServerConversation