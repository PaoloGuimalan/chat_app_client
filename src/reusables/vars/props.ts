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
}