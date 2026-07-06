/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactNode } from "react";
import PeerService from "../hooks/peer";

export interface AuthenticationInterface {
  auth: boolean | null;
  user: {
    id: string;
    userID: string;
    username: string;
    fullName: {
      firstName: string;
      middleName: string;
      lastName: string;
    };
    birthdate: {
      month: string;
      day: string;
      year: string;
    } | null;
    email: string;
    gender: string | null;
    isActivated: boolean | null;
    isVerified: boolean | null;
    isComplete: boolean;
    pendingConsents: { document_type: string; version: string }[];
    entity_id: string;
    profile: string;
    coverphoto: string;
  };
}

export interface IUserInterface {
  _id: string;
  userID: string;
  fullName: {
    firstName: string;
    middleName: string;
    lastName: string;
  };
  email?: string;
  isActivated?: boolean | null;
  isVerified?: boolean | null;
  profile: string;
  coverphoto?: string;
}

export interface ProfileUserInfoInterface {
  id: string;
  entityID: string;
  userID: string;
  username: string;
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
  isBadged: boolean;
}

export interface IRealmBasicInfo {
  id: string;
  realm_id: string;
  name: string;
  profile: string;
  cover_photo: string | null;
  description: string | null;
  email: string | null;
  slug: string | null;
  type: string;
  is_active: boolean;
  is_private: boolean;
  is_verified: boolean;
  created_by: string;
  parent: IRealmBasicInfo | null;
}

export interface IRealmProfileInfo {
  cover_photo: string | null;
  created_by: string;
  description: string | null;
  email: string | null;
  id: string;
  entity: string;
  is_active: boolean;
  is_private: boolean;
  is_verified: boolean;
  name: string;
  parent: IRealmBasicInfo | null;
  profile: string | null;
  realm_id: string;
  slug: string | null;
  type: string;
  is_admin: boolean;
  is_member: boolean;
  followers_count: number;
  members: number;
  is_follower: boolean;
}

export type CommunityInviteKind = "invite" | "request";
export type CommunityInviteStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "revoked";

export interface CommunityInvite {
  id: string;
  realm_id: string;
  realm_type: string;
  kind: CommunityInviteKind;
  status: CommunityInviteStatus;
  target_email: string;
  target_user_id: string | null;
  accepted_by_user_id: string | null;
  invite_token: string;
  created_by: string;
  created_at: string;
  resolved_at: string | null;
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
  entityID: any;
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
  is_admin: boolean;
  status: boolean;
  type: string;
  users: UsersInConversation[];
  __v: any;
  conversationInfo?: ConversationDetails;
  usersWithInfo: UserWithInfoConversationInterface[];
  conversationfiles: ConversationFilesInterface[];
  chatHistory: {
    _id: string;
    conversationID: string;
    userID: string;
    cleared_at: string | null;
    isArchived: boolean;
    isRestricted: boolean;
  } | null;
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
  _id: string;
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
  is_admin: boolean;
  channels: ChannelsListInterface[];
  usersWithInfo: ServerUsersWithInfo[];
}

// POST DATA INTERFACE

export interface ITagging {
  post_tag_id: string;
  entity: IFlexibleEntity; // Reuses the flexible, type-agnostic entity structure
  post: string; // The post ID string reference
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

export interface IAuthorRealm {
  id: string;
  realm_id: string;
  name: string;
  profile: string;
  type: string;
  is_verified: true;
  slug: string;
}

export interface IPost {
  post_id: string;
  tagging: ITagging[];
  references: IReference[];
  map_info: IMapInfo | null;
  preview: IPreviewCount[];
  entity_reaction: string | null;
  entity: IFlexibleEntity; // Use the single unified type
  score: IPostScore;
  is_saved: boolean;
  is_shared: boolean;
  file_type: string;
  caption: string;
  content_type: string;
  is_tagged: boolean;
  privacy_status: string;
  is_sponsored: boolean;
  is_live: boolean;
  is_archived: boolean;
  on_feed: string;
  date_posted: string;
  from_system: boolean;
  deleted_at: string | null | boolean;
  deleted_by: string | null | boolean;
}

export interface IFlexibleEntity {
  id: string;
  type: string; // "user", "realm", "group", etc.
  details: IFlexibleEntityDetails;
}

// Unified, completely flat and flexible signature
export interface IFlexibleEntityDetails {
  id: string;
  profile: string;
  is_active: boolean;

  // User specific fields (optional)
  username?: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  gender?: string;
  is_badged?: boolean;
  is_verified?: boolean;

  // Realm specific fields (optional)
  realm_id?: string;
  name?: string;

  // Index signature: Allows ANY future backend field string without crashing!
  [key: string]: any;
}

// ==========================================
// SUPPORTING DATA SUB-INTERFACES
// ==========================================

export interface IReference {
  reference_id: string;
  reference: string;
  caption: string;
  reference_media_type: string;
  reference_name: string | null;
  post: string;
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

// Placeholder placeholders to prevent import issues
export interface IMapInfo {}
export interface IPreviewCount {}

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
  is_badged: boolean;
}

export interface IRealmMember {
  entity: {
    id: string;
    type: string;
    details: IUserContactPreview;
  };
  added_by: {
    id: string;
    type: string;
    details: IUserContactPreview;
  };
  date_joined: string;
  member_id: string;
  nickname: string | null;
  realm: string;
  role: string;
}

export interface IRealmFollower {
  follower: {
    id: string;
    type: string;
    details: IUserContactPreview;
  };
  realm_id: string;
  follow_id: string;
  created_at: string;
}

export interface IContact {
  id: string;
  action_by: {
    id: string;
    type: string;
    details: IUserContactPreview;
  };
  involved_entity: {
    id: string;
    type: string;
    details: IUserContactPreview;
  };
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
  created_at: string; // ISO DateTime string
  updated_at: string | null;
  deleted_at: string | null;
  parent_comment: string | null;
  post: string;
  entity: IFlexibleEntity; // Unifies both user and realm data profiles safely
  deleted_by: string | null;
}

export interface ICoordinatesAnchor {
  referenceID: string;
  label: string;
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
  messages: {
    type: string;
  };
}

export interface IPreviewParicipants {
  userID: string;
  entityID: string;
  username: string;
  profile: string | null;
  clientID: string;
  channelID: string;
  instance: string | null;
}

export interface ISavedPost {
  id: string;
  post: {
    post_id: string;
    is_shared: boolean;
    file_type: string;
    caption: string;
    content_type: string;
    is_tagged: boolean;
    privacy_status: string;
    is_sponsored: boolean;
    is_live: boolean;
    is_archived: boolean;
    on_feed: string;
    date_posted: string;
    from_system: boolean;
    deleted_at: string | null;
    entity: IFlexibleEntity;
    deleted_by: string | null;
  };
  saved_at: string;
  user: string;
}

export interface IConversation {
  _id: string;
  conversationID: string;
  conversationType: string;
  sortID: string;
  messageID: string;
  sender: string;
  receivers: string[];
  seeners: string[];
  content: string;
  messageDate: string;
  isReply: boolean;
  replyingTo: string;
  reactions: any[];
  isDeleted: boolean;
  messageType: string;
  unread: number;
  details: {
    id: string;
    entity_id: string;
    username: string;
    display_name: string;
    profile: string;
  };
  voice_participants: any[];
}

export interface IConversationList {
  items: IConversation[];
  total: number;
  next: boolean;
}

export interface ContactRowData {
  id: string;
  entityID: string;
  username: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  profile: string;
  isBadged?: boolean;
  connectionID: string;
  selfActed: boolean;
  involvedUserdetails: any;
}

export interface IConversationSetup {
  _id: string;
  conversationID: string;
  conversationType: string;
  participant_ids: string[];
  createdAt: string | null;
  updatedAt: string | null;
  details: {
    id: string;
    entity_id: string;
    username: string | null;
    display_name: string;
    profile: string;
    privacy: boolean;
  };
  voice_participants: [];
}
