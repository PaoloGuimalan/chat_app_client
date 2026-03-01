/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactNode } from "react";
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
  } | null;
  connection: {
    connection_id: string | null;
    is_connection_present: boolean | null;
    is_connection_handshaked: boolean | null;
    is_user_connection_initiator: boolean | null;
  };
  profile: string;
  coverphoto: string;
  gender: string | null;
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

export interface ITagging {
  post_tag_id: string;
  post: string;
  user: IUserContactPreview;
}

export interface IReference {
  reference_id: string;
  reference: string;
  caption: string;
  reference_media_type: string;
  reference_name: string | null;
  post: string;
}

export interface IMapInfo {
  map_view_id: string;
  status: boolean;
  is_stationary: boolean;
  post: string;
}

export interface IPreviewCount {
  count: number;
  emoji: string;
}

export interface IActivityCounts {
  count_type: string;
  count: number;
}

export interface IPostScore {
  id: number;
  affinity_score: number;
  content_type_weight: number;
  recent_update_boost: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  ranking_score: number;
  post: string;
}

export interface IPost {
  post_id: string;
  tagging: ITagging[];
  privacy_users: any[]; // you can replace 'any' with specific type if known
  references: IReference[];
  map_info: IMapInfo;
  user: IUserContactPreview;
  is_shared: boolean;
  file_type: string;
  caption: string;
  content_type: string;
  is_tagged: boolean;
  privacy_status: string;
  is_sponsored: boolean;
  is_live: boolean;
  on_feed: string;
  date_posted: string; // ISO string, or Date if preferred
  from_system: boolean;
  preview: IPreviewCount[];
  user_reaction: string | null;
  // activity_counts: IActivityCounts[];
  score: IPostScore;
}

//POST DATA INTERFACE END

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

export interface IUserContactPreview {
  id: string;
  username: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  profile: string;
  gender: string;
}

export interface IContact {
  id: string;
  action_by: IUserContactPreview;
  involved_user: IUserContactPreview;
  connection_id: string;
  nickname: string | null;
  status: boolean;
  action_date: string; // or Date if you prefer
  type: string;
}

export interface UserSearchResult {
  id: string;
  username: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  birthdate: string; // ISO date string
  profile: string;
  gender: string;
  email: string;
  date_created: string; // ISO date string
  is_active: boolean;
  is_verified: boolean;
  has_connection: boolean;
  connection_accomplished: boolean;
  connection_id: string | null;
  is_action_by_user: boolean;
}

export interface Emoji {
  emoji_id: string;
  emoji_title: string;
  emoji_content: string;
  emoji_tags: string[];
  emoji_theme: string;
  priority: number;
  animated_preview: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  updated_by: string;
}

export interface IPostComment {
  comment_id: string;
  text: string;
  attachment: string | null;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
  parent_comment: string | null;
  post: string;
  user: IUserContactPreview;
  deleted_by: string | null;
}

export interface ICoordinatesAnchor {
  referenceID: string;
  longitude: number;
  latitude: number;
  heading: number | null;
  speed: number | null;
  mode: any | null;
  type: string;
}

export interface IDiaryPreview {
  isLoaded: boolean;
  latest_entry: string | null;
  top_tags: { id: number; name: string }[];
  total_entries: number;
}

export interface IPageModal {
  name: string;
  component: ReactNode;
}

export interface IPendingEntryAttachment {
  id: number;
  name: string | null;
  reference: any;
  caption: string;
  referenceMediaType: string;
}

export interface IEntryAttachment {
  file_id: string;
  file_type: string;
  file_name: string | null;
  url: string;
}

export interface INewEntry {
  title: string;
  content: string;
  mood: {
    id: number;
    value: number;
    name: string;
    emoji: string;
    label: string;
  } | null;
  tags: {
    id: number;
    name: string;
    label: string;
    value: number;
    is_new: boolean;
  }[];
  attachments: IEntryAttachment[];
  entry_date: string | null;
  is_private: boolean;
}

export interface IEntryTag {
  id: number;
  name: string;
}

export interface IEntryViewAttachment {
  id: string;
  created_at: string;
  file_type: string;
  file_name: string | null;
  url: string;
}

export interface IEntry {
  id: string;
  account: string;
  title: string;
  content: string;
  entry_date: string;
  mood: {
    emoji: string;
    id: number;
    name: string;
  } | null;
  is_private: boolean;
  tag_objects: IEntryTag[];
  attachments: IEntryViewAttachment[];
  entry_map_info: null;
  created_at: string;
  updated_at: string;
}

export interface IUserSettings {
  personal_info: null;
  map_feed_access: {
    enable_location: boolean;
    share_location: boolean;
    current_mode: number;
    toggleSpeed: boolean;
  };
}
