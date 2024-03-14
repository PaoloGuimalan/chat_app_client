import PeerService from "../hooks/peer"

export interface AuthenticationInterface{
    auth: boolean | null,
    user: {
        userID: string,
        fullName: {
            firstName: string,
            middleName: string,
            lastName: string
        },
        email: string,
        isActivated: boolean | null,
        isVerified: boolean | null,
        profile: string,
        coverphoto: string,
    }
}

export interface ProfileUserInfoInterface{
    userID: string,
    fullname: {
        firstName: string,
        middleName: string,
        lastName: string
    },
    birthdate: {
        month: string,
        day: string,
        year: string
    },
    profile: string,
    gender: string,
    email: string,
    dateCreated: {
        date: string,
        time: string
    },
    isActivated: boolean,
    isVerified: boolean
}

export interface ProfilePostState{
    posts: any[],
    totalposts: number
}

export interface UsersInConversation{
    userID: string,
    _id: any
}

export interface ConversationDetails{
    _id: any,
    groupID: string,
    groupName: string,
    profile?: string,
    dateCreated: { date: string, time: string },
    createdBy: string,
    type: string,
    privacy?: boolean,
    __v: number
}

export interface UserWithInfoConversationInterface{
    _id: any,
    userID: string,
    fullname: {
        firstName: string,
        middleName: string,
        lastName: string
    },
    profile?: string,
    isActivated: boolean,
    isVerified: boolean,
    __v: 0
}

export interface ConversationFilesInterface{
    _id: any,
    fileID: string,     
    foreignID: any[],
    fileDetails: {
        data: string
    },
    fileOrigin: string,
    fileType: string,
    action: string,
    dateUploaded: {
        time: string,
        date: string
    },
    __v: 0
}

export interface ConversationInfoInterface{
    _id: any,
    contactID: string,
    actionBy: string,
    actionDate: { date: string, time: string },
    status: boolean,
    type: string,
    users: UsersInConversation[],
    __v: any,
    conversationInfo?: ConversationDetails,
    usersWithInfo: UserWithInfoConversationInterface[],
    conversationfiles: ConversationFilesInterface[]
}

export interface RemoteStreams{
    userID: string,
    peer?: typeof PeerService,
    mediastreamid: string;
    stream: MediaStreamTrack | any
}

interface ChannelMembersInterface{
    userID: string
}

interface MessagesUnreadInterface{
    unread: number;
}

export interface ChannelsListInterface{
    _id: string;
    serverID: string;
    groupID: string;
    groupName: string;
    profile: string;
    dateCreated: {
        date: string;
        time: string;
    };
    createdBy: string;
    type: string;
    privacy: boolean;
    messages: MessagesUnreadInterface[];
}

export interface ServerChannelsListInterface{
    _id: string;
    serverID: string;
    serverName: string;
    profile: string;
    dateCreated: {
        date: string;
        time: string;
    };
    members: ChannelMembersInterface[],
    createdBy: string;
    privacy: boolean;
    channels: ChannelsListInterface[]
}