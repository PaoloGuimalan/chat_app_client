/* eslint-disable @typescript-eslint/no-explicit-any */
import PeerService from "../hooks/peer";

export interface AuthenticationInterface {
  auth: boolean | null;
  user: {
    userID: string;
    fullName: {
      firstName: string;
      middleName: string;
      lastName: string;
    };
    email: string;
    isActivated: boolean | null;
    isVerified: boolean | null;
    profile: string;
    coverphoto: string;
  };
}

export interface ProfileUserInfoInterface {
  userID: string;
  fullname: {
    firstName: string;
    middleName: string;
    lastName: string;
  };
  birthdate: {
    month: string;
    day: string;
    year: string;
  };
  profile: string;
  gender: string;
  email: string;
  dateCreated: {
    date: string;
    time: string;
  };
  isActivated: boolean;
  isVerified: boolean;
}

export interface ProfilePostState {
  posts: any[];
  totalposts: number;
}

export interface UsersInConversation {
  userID: string;
  _id: any;
}

export interface ConversationDetails {
  _id: any;
  serverID?: string;
  groupID: string;
  groupName: string;
  profile?: string;
  dateCreated: { date: string; time: string };
  createdBy: string;
  type: string;
  privacy?: boolean;
  __v: number;
}

export interface UserWithInfoConversationInterface {
  _id: any;
  userID: string;
  fullname: {
    firstName: string;
    middleName: string;
    lastName: string;
  };
  profile?: string;
  isActivated: boolean;
  isVerified: boolean;
  __v: 0;
}

export interface ConversationFilesInterface {
  _id: any;
  fileID: string;
  foreignID: any[];
  fileDetails: {
    data: string;
  };
  fileOrigin: string;
  fileType: string;
  action: string;
  dateUploaded: {
    time: string;
    date: string;
  };
  __v: 0;
}

export interface ConversationInfoInterface {
  _id: any;
  contactID: string;
  actionBy: string;
  actionDate: { date: string; time: string };
  status: boolean;
  type: string;
  users: UsersInConversation[];
  __v: any;
  conversationInfo?: ConversationDetails;
  usersWithInfo: UserWithInfoConversationInterface[];
  conversationfiles: ConversationFilesInterface[];
}

export interface RemoteStreams {
  userID: string;
  peer?: typeof PeerService;
  mediastreamid: string;
  stream: MediaStreamTrack | any;
}

export interface ChannelMembersInterface {
  userID: string;
}

interface MessagesUnreadInterface {
  unread: number;
}

export interface ChannelsListInterface {
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

export interface ServerUsersWithInfo {
  userID: string;
  fullname: {
    firstName: string;
    middleName: string;
    lastName: string;
  };
  profile: string;
}

export interface ServerChannelsListInterface {
  _id: string;
  serverID: string;
  serverName: string;
  profile: string;
  dateCreated: {
    date: string;
    time: string;
  };
  members: ChannelMembersInterface[];
  createdBy: string;
  privacy: boolean;
  channels: ChannelsListInterface[];
  usersWithInfo: ServerUsersWithInfo[];
}

// POST DATA INTERFACE

export interface PostDataInterface {
  _id: string;
  postID: string;
  userID: string;
  content: Content;
  type: Type;
  tagging: Tagging;
  privacy: Privacy;
  onfeed: string;
  isSponsored: boolean;
  isLive: boolean;
  isOnMap: IsOnMap;
  fromSystem: boolean;
  dateposted: number;
  __v: number;
  tagged_users: any[];
  post_owner: PostOwner;
}

export interface Content {
  isShared: boolean;
  references: any[];
  data: string;
}

export interface IsOnMap {
  status: boolean;
  isStationary: boolean;
}

export interface PostOwner {
  _id: string;
  userID: string;
  fullname: Fullname;
  birthdate: Birthdate;
  profile: string;
  gender: string;
  isActivated: boolean;
  isVerified: boolean;
  __v: number;
}

export interface Birthdate {
  month: string;
  day: string;
  year: string;
}

export interface Fullname {
  firstName: string;
  middleName: string;
  lastName: string;
}

export interface Privacy {
  status: string;
  users: any[];
}

export interface Tagging {
  isTagged: boolean;
  users: any[];
}

export interface Type {
  fileType: string;
  contentType: string;
}

//POST DATA INTERFACE END
