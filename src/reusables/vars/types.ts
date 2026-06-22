export type OriginalResponse = {
  id: string;
  username: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  birthdate: string;
  profile: string;
  coverphoto: string | null;
  gender: string;
  email: string;
  date_created: string;
  is_active: boolean;
  is_verified: boolean;
  is_badged: boolean;
  is_complete: boolean;
  pending_consents: { document_type: string; version: string }[];
  exp: number;
  iat: number;
};

export type ConvertedResponse = {
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
  dateCreated: {
    date: string;
    time: string;
  };
  id: string;
  userID: string;
  username: string;
  profile: string;
  gender: string | null;
  email: string;
  password: null;
  isActivated: boolean;
  isVerified: boolean;
  isComplete: boolean;
  pendingConsents: { document_type: string; version: string }[];
  coverphoto?: string;
  __v: number;
  iat: number;
  exp: number;
};
