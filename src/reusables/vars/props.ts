import { ConversationInfoInterface, ServerChannelsListInterface } from "./interfaces";

export interface MessageOptionsProp{
    messageID: string;
    conversationID: string;
    type: string;
    setisReplying: () => void;
}

export interface ContentHandlerProp{ 
    i: number; 
    cnvs: any; 
    conversationsetup: any;
    setisReplying: (data: any) => void; 
    setfullImageScreen: (data: any) => void; 
    scrollBottom : () => void;
    theme: any;
}

export interface ConversationInfoModalProp{
    conversationinfo: ConversationInfoInterface,
    onclose: any
}

export interface ServerInfoModalProp{
    serverdetails: ServerChannelsListInterface,
    onclose: any
}

export interface AppItemProp{
    mp: any
}