/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import {
  SET_ACTIVE_USERS_LIST,
  SET_ALERTS,
  SET_AUTHENTICATION,
  SET_CONTACTS_LIST,
  SET_CONTACTS_LIST_OVERRIDE,
  SET_NOTIFICATIONS_LIST,
  SET_NOTIFICATIONS_LIST_OVERRIDE,
} from "../../redux/types";
import { authenticationstate } from "../../redux/actions/states";
import store from "../../redux/store";
import sign from "jwt-encode";
import jwt_decode from "jwt-decode";
import { Dispatch } from "react";
import { convertLoginResponse, generateUUID, generateXNonce } from "./reusable";
import { ConvertedResponse } from "../vars/types";
import { PaginationProp } from "../vars/props";
import { IContact, INewEntry } from "../vars/interfaces";
import { removeNullsFromObject } from "./validatevariables";
import envs from "./env_configs";
import {
  clearViewPosts,
  getAllViewCache,
  getSettings,
} from "./localforagehelper";
import jwtDecode from "jwt-decode";

const API = envs.CHATTERLOOP_API;
const USER_SERVICE_API = envs.USER_SERVICE_API;
const SECRET = envs.SECRET;

const Axios = axios.create();

const EXTERNAL_URLS = ["https://fonts.gstatic.com/s/e/notoemoji/latest/"];

const isExternalUrl = (url: string) =>
  EXTERNAL_URLS.some((external) => url.startsWith(external));

Axios.interceptors.request.use(async (config) => {
  try {
    const url = config.url ?? "";

    if (isExternalUrl(url)) {
      return config;
    }

    const user = localStorage.getItem("authtoken");
    const decoded: { username: string; userID: string } | null = user
      ? jwt_decode(user)
      : null;

    const userID = decoded ? decoded.userID : "guest";

    const nonce = await generateXNonce(userID);
    config.headers["X-Nonce"] = nonce;

    let deviceToken = localStorage.getItem("device");

    if (!deviceToken) {
      deviceToken = generateUUID();
      localStorage.setItem("device", deviceToken);
    }

    config.headers["Device-Token"] = deviceToken;

    return config;
  } catch (error) {
    return Promise.reject(error);
  }
});

const FORCE_LOGOUT_ERROR_CODES = [
  "PROFILE_INCOMPLETE",
  "CONSENT_REQUIRED",
  "ACCOUNT_UNDERAGE",
  "ACCOUNT_INACTIVE",
];

Axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const detail = error?.response?.data?.detail;
    if (
      error?.response?.status === 403 &&
      typeof detail === "string" &&
      FORCE_LOGOUT_ERROR_CODES.some((code) => detail.startsWith(code))
    ) {
      LogoutRequest(store.dispatch);
    }
    return Promise.reject(error);
  },
);

// Shape shared by GetAllowedModulesRequest and AuthCheck below - the active
// entity's real type/name/slug/profile can only be resolved server-side
// (the JWT's `entity` claim is an opaque id with no type flag), so both
// call sites need to merge the same fields into the authentication object.
const buildActiveEntityFields = (result: any) => {
  const { allowed_modules, active_entity, personal_entity_id } = result;
  return {
    allowed_modules,
    active_entity_context: {
      id: active_entity.id,
      is_switched: active_entity.type !== "user",
      personal_entity_id,
      entity_type: active_entity.type,
      realm_type: active_entity.realm_type,
      realm_id: active_entity.realm_id,
      name: active_entity.name,
      slug: active_entity.slug,
      profile: active_entity.profile,
    },
  };
};

const AuthCheck = (dispatch: any) => {
  const authtoken = localStorage.getItem("authtoken");

  // /auth/jwtchecker (Node) now merges allowed_modules/active_entity/
  // personal_entity_id directly into its own response (see
  // resolveAllowedModulesAndContext in the server repo's permissionChecker.js)
  // - no more separate parallel call to Django's /api/entity/me/modules.
  Axios.get(`${API}/auth/jwtchecker`, {
    headers: {
      "x-access-token": authtoken,
    },
  })
    .then((response) => {
      if (response.data.status) {
        const userData: any = jwt_decode(response.data.result.usertoken);
        // console.log(userData)
        setTimeout(() => {
          const restoredAuthentication = {
            ...authenticationstate,
            auth: true,
            user: {
              userID: userData._id,
              username: userData.userID,
              fullName: {
                firstName: userData.fullname.firstName,
                middleName: userData.fullname.middleName,
                lastName: userData.fullname.lastName,
              },
              email: userData.email,
              birthdate: userData.birthdate,
              gender: userData.gender,
              isActivated: userData.isActivated,
              isVerified: userData.isVerified,
              isComplete: userData.isComplete,
              pendingConsents: userData.pending_consents || [],
              profile: userData.profile,
              coverphoto: userData.coverphoto || "",
              entity_id: userData.entity_id,
            },
            ...buildActiveEntityFields(response.data.result),
          };
          dispatch({
            type: SET_AUTHENTICATION,
            payload: { authentication: restoredAuthentication },
          });
        }, 2000);
      } else {
        setTimeout(() => {
          dispatch({
            type: SET_AUTHENTICATION,
            payload: {
              authentication: {
                ...authenticationstate,
                auth: false,
              },
            },
          });
        }, 2000);
      }
    })
    .catch((err) => {
      dispatch({
        type: SET_AUTHENTICATION,
        payload: {
          authentication: {
            ...authenticationstate,
            auth: false,
          },
        },
      });
      console.log(err);
    });
};

const LoginRequest = (
  params: any,
  dispatch: Dispatch<any>,
  currentAlertState: any,
  setisWaitingRequest: any,
) => {
  const payload = params;
  // const encodedPayload = sign(payload, SECRET);

  // previous: `${API}/auth/login`
  Axios.post(`${USER_SERVICE_API}/api/user/auth`, payload)
    .then((response) => {
      if (response.data.status) {
        localStorage.setItem("authtoken", response.data.result.authtoken);
        const userDataRaw: any = jwt_decode(response.data.result.usertoken);
        const userData: ConvertedResponse = convertLoginResponse(userDataRaw);

        const loggedInAuthentication = {
          ...authenticationstate,
          auth: true,
          user: {
            userID: userData.id,
            username: userData.username,
            fullName: {
              firstName: userData.fullname.firstName,
              middleName: userData.fullname.middleName,
              lastName: userData.fullname.lastName,
            },
            birthdate: userData.birthdate,
            gender: userData.gender,
            email: userData.email,
            isActivated: userData.isActivated,
            isVerified: userData.isVerified,
            isComplete: userData.isComplete,
            pendingConsents: userData.pendingConsents,
            entity_id: userData.entity_id,
            profile: userData.profile,
            coverphoto: userData.coverphoto || "",
          },
          // UserAuthentication.post() now merges allowed_modules/
          // active_entity/personal_entity_id into the same response - no
          // separate GetAllowedModulesRequest follow-up call needed.
          ...buildActiveEntityFields(response.data.result),
        };
        dispatch({
          type: SET_AUTHENTICATION,
          payload: { authentication: loggedInAuthentication },
        });
        dispatch({
          type: SET_ALERTS,
          payload: {
            alerts: {
              id: currentAlertState.length,
              type: "success",
              content: "You have been Logged In.",
            },
          },
        });
      } else {
        dispatch({
          type: SET_ALERTS,
          payload: {
            alerts: {
              id: currentAlertState.length,
              type: "warning",
              content: response.data.message,
            },
          },
        });
        // console.log(response.data)
      }
      setisWaitingRequest(false);
    })
    .catch((err) => {
      dispatch({
        type: SET_ALERTS,
        payload: {
          alerts: {
            id: currentAlertState.length,
            type: "error",
            content: err.message,
          },
        },
      });
      setisWaitingRequest(false);
      // console.log(err)
    });
};

// Single source of truth for both allowed_modules and active_entity_context -
// MyAllowedModules (Django) resolves the active entity's real type/name/slug
// server-side, since the JWT's `entity` claim is an opaque id with no type
// flag: the frontend cannot tell "am I acting as myself or a page" from the
// token alone, especially after a page reload. Call this after login,
// session restore, and every switch.
const GetAllowedModulesRequest = (
  dispatch: Dispatch<any>,
  currentAuthentication: any,
) => {
  Axios.get(`${USER_SERVICE_API}/api/entity/me/modules`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
  })
    .then((response) => {
      if (response.data.status) {
        dispatch({
          type: SET_AUTHENTICATION,
          payload: {
            authentication: {
              ...currentAuthentication,
              ...buildActiveEntityFields(response.data.result),
            },
          },
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

// Switches the account's active entity from itself to a page it
// administers (or, via SwitchBackToSelfRequest below, back again) -
// re-issues the authtoken with a different `entity` claim server-side, so
// everything downstream (post authorship, permission checks) attributes to
// the page instead of the personal user. Direct page-to-page switching is
// allowed; the backend validates membership against the account's own
// entity regardless of which entity is currently active.
const SwitchEntityRequest = (
  realmId: string,
  dispatch: Dispatch<any>,
  currentAlertState: any,
) => {
  return Axios.post(
    `${USER_SERVICE_API}/api/user/entity/switch`,
    { realm_id: realmId },
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((response) => {
      if (response.data.status) {
        localStorage.setItem("authtoken", response.data.result.authtoken);
        // A switch changes almost everything downstream (post authorship,
        // module gating, permission checks, socket rooms), so an in-place
        // redux patch risks leaving stale state (messages, notifications,
        // call state, cached lists) built for the old identity. Reloading
        // re-runs the whole boot sequence (AuthCheck, which now gets
        // allowed_modules/active_entity merged into its own jwtchecker
        // response) against the new token instead, so everything settles
        // clean.
        window.location.reload();
        return true;
      }
      dispatch({
        type: SET_ALERTS,
        payload: {
          alerts: {
            id: currentAlertState.length,
            type: "warning",
            content: response.data.message,
          },
        },
      });
      return false;
    })
    .catch((err) => {
      dispatch({
        type: SET_ALERTS,
        payload: {
          alerts: {
            id: currentAlertState.length,
            type: "error",
            content: err.message,
          },
        },
      });
      return false;
    });
};

const SwitchBackToSelfRequest = (
  dispatch: Dispatch<any>,
  currentAlertState: any,
) => {
  return Axios.post(
    `${USER_SERVICE_API}/api/user/entity/switch-back`,
    {},
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((response) => {
      if (response.data.status) {
        localStorage.setItem("authtoken", response.data.result.authtoken);
        // Same reasoning as SwitchEntityRequest above - reload rather than
        // patch redux in place, so nothing built for the page identity
        // (messages, notifications, call state, cached lists) lingers once
        // switched back to the personal user.
        window.location.reload();
        return true;
      }
      dispatch({
        type: SET_ALERTS,
        payload: {
          alerts: {
            id: currentAlertState.length,
            type: "warning",
            content: response.data.message,
          },
        },
      });
      return false;
    })
    .catch((err) => {
      dispatch({
        type: SET_ALERTS,
        payload: {
          alerts: {
            id: currentAlertState.length,
            type: "error",
            content: err.message,
          },
        },
      });
      return false;
    });
};

const ThirdPartyAuthenticationRequest = (
  params: any,
  dispatch: Dispatch<any>,
  currentAlertState: any,
  setisWaitingRequest: any,
) => {
  const payload = params;
  // const encodedPayload = sign(payload, SECRET);

  // previous: `${API}/auth/login`
  Axios.post(`${USER_SERVICE_API}/api/user/tp_auth`, payload)
    .then((response) => {
      if (response.data.status) {
        localStorage.setItem("authtoken", response.data.result.authtoken);
        const userDataRaw: any = jwt_decode(response.data.result.usertoken);
        const userData: ConvertedResponse = convertLoginResponse(userDataRaw);

        const loggedInAuthentication = {
          ...authenticationstate,
          auth: true,
          user: {
            userID: userData.userID,
            username: userData.username,
            fullName: {
              firstName: userData.fullname.firstName,
              middleName: userData.fullname.middleName,
              lastName: userData.fullname.lastName,
            },
            birthdate: userData.birthdate,
            gender: userData.gender,
            email: userData.email,
            isActivated: userData.isActivated,
            isVerified: userData.isVerified,
            isComplete: userData.isComplete,
            pendingConsents: userData.pendingConsents,
            entity_id: userData.entity_id,
            profile: userData.profile,
            coverphoto: userData.coverphoto || "",
          },
          // ThirdPartyAuthentication.post() now merges allowed_modules/
          // active_entity/personal_entity_id into the same response - no
          // separate GetAllowedModulesRequest follow-up call needed.
          ...buildActiveEntityFields(response.data.result),
        };
        dispatch({
          type: SET_AUTHENTICATION,
          payload: { authentication: loggedInAuthentication },
        });
        dispatch({
          type: SET_ALERTS,
          payload: {
            alerts: {
              id: currentAlertState.length,
              type: "success",
              content: "You have been Logged In.",
            },
          },
        });
      } else {
        dispatch({
          type: SET_ALERTS,
          payload: {
            alerts: {
              id: currentAlertState.length,
              type: "warning",
              content: response.data.message,
            },
          },
        });
        // console.log(response.data)
      }
      setisWaitingRequest(false);
    })
    .catch((err) => {
      dispatch({
        type: SET_ALERTS,
        payload: {
          alerts: {
            id: currentAlertState.length,
            type: "error",
            content: err.message,
          },
        },
      });
      setisWaitingRequest(false);
      // console.log(err)
    });
};

const RegisterRequest = (
  params: any,
  dispatch: Dispatch<any>,
  currentAlertState: any,
  setisWaitingRequest: any,
) => {
  const payload = params;
  // const encodedPayload = sign(payload, SECRET);

  // `${API}/auth/register`
  Axios.post(`${USER_SERVICE_API}/api/user/me`, payload)
    .then((response) => {
      if (response.data.status) {
        localStorage.setItem("authtoken", response.data.authtoken);

        const userDataRaw: any = jwt_decode(response.data.usertoken);
        const userData: ConvertedResponse = convertLoginResponse(userDataRaw);

        const registeredAuthentication = {
          ...authenticationstate,
          auth: true,
          user: {
            userID: response.data.userID,
            username: response.data.username,
            fullName: {
              firstName: payload.firstName,
              middleName: payload.middleName,
              lastName: payload.lastName,
            },
            email: payload.email,
            isActivated: true,
            isVerified: false,
            isComplete: userData.isComplete,
            pendingConsents: userData.pendingConsents,
            entity_id: userData.entity_id,
          },
          // UserAccountManagement.post() (register) now merges
          // allowed_modules/active_entity/personal_entity_id into the same
          // response (top-level, not nested under .result, matching this
          // endpoint's existing flat response shape) - no separate
          // GetAllowedModulesRequest follow-up call needed.
          ...buildActiveEntityFields(response.data),
        };
        dispatch({
          type: SET_AUTHENTICATION,
          payload: { authentication: registeredAuthentication },
        });
        dispatch({
          type: SET_ALERTS,
          payload: {
            alerts: {
              id: currentAlertState.length,
              type: "success",
              content: "You have been registered!",
            },
          },
        });
      } else {
        dispatch({
          type: SET_ALERTS,
          payload: {
            alerts: {
              id: currentAlertState.length,
              type: "warning",
              content: response.data.message,
            },
          },
        });
      }
      setisWaitingRequest(false);
    })
    .catch((err) => {
      dispatch({
        type: SET_ALERTS,
        payload: {
          alerts: {
            id: currentAlertState.length,
            type: "error",
            content: err.message,
          },
        },
      });
      setisWaitingRequest(false);
    });
};

const LogoutRequest = (dispatch: Dispatch<any>) => {
  localStorage.removeItem("authtoken");
  dispatch({
    type: SET_AUTHENTICATION,
    payload: {
      authentication: {
        ...authenticationstate,
        auth: false,
      },
    },
  });
};

const VerifyCodeRequest = (
  params: any,
  dispatch: Dispatch<any>,
  currentState: any,
  currentAlertState: any,
  setisWaitingRequest: any,
) => {
  const payload = params;
  // const encodedPayload = sign(payload, SECRET);

  // `${API}/auth/emailverify`
  Axios.post(`${USER_SERVICE_API}/api/user/verification`, payload, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
  })
    .then((response) => {
      if (response.data.status) {
        dispatch({
          type: SET_AUTHENTICATION,
          payload: {
            authentication: {
              // Spreading currentState (not just currentState.user) matters -
              // this reducer fully replaces the authentication object, so
              // omitting it would silently drop active_entity_context/
              // allowed_modules and white-screen the app.
              ...currentState,
              auth: true,
              user: {
                ...currentState.user,
                isVerified: true,
              },
            },
          },
        });
        dispatch({
          type: SET_ALERTS,
          payload: {
            alerts: {
              id: currentAlertState.length,
              type: "success",
              content: "Your account is now verified.",
            },
          },
        });
        // console.log(response.data)
      } else {
        dispatch({
          type: SET_ALERTS,
          payload: {
            alerts: {
              id: currentAlertState.length,
              type: "warning",
              content: response.data.message,
            },
          },
        });
      }
      setisWaitingRequest(false);
    })
    .catch((err) => {
      dispatch({
        type: SET_ALERTS,
        payload: {
          alerts: {
            id: currentAlertState.length,
            type: "error",
            content: err.response.data.message,
          },
        },
      });
      setisWaitingRequest(false);
      // console.log(err);
    });
};

const SearchRequest = (
  params: any,
  dispatch: Dispatch<any>,
  setisLoading: any,
  currentAlertState: any,
  setsearchresults: any,
) => {
  const searchdata = params.searchdata;

  Axios.get(
    `${USER_SERVICE_API}/api/user/search/${searchdata}/?page=1&page_size=10`,
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((response) => {
      setisLoading(false);
      setsearchresults(response.data.results);
    })
    .catch((err) => {
      setisLoading(false);
      setsearchresults([]);
      dispatch({
        type: SET_ALERTS,
        payload: {
          alerts: {
            id: currentAlertState.length,
            type: "error",
            content: err.message,
          },
        },
      });
    });
};

// Search v2 - unified entity search (users + realms/pages), used by post
// tagging. Same callback signature as SearchRequest so it's a drop-in, plus
// optional `types` / `realmTypes` (comma lists) to scope which kinds come back.
const EntitySearchRequest = (
  params: any,
  dispatch: Dispatch<any>,
  setisLoading: any,
  currentAlertState: any,
  setsearchresults: any,
) => {
  const searchdata = params.searchdata;
  const types = params.types || "user,realm";
  const realmTypes = params.realmTypes || "page";

  Axios.get(
    `${USER_SERVICE_API}/api/entity/search/${encodeURIComponent(
      searchdata,
    )}/?page=1&page_size=15&types=${types}&realm_types=${realmTypes}`,
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((response) => {
      setisLoading(false);
      setsearchresults(response.data.results);
    })
    .catch((err) => {
      setisLoading(false);
      setsearchresults([]);
      dispatch({
        type: SET_ALERTS,
        payload: {
          alerts: {
            id: currentAlertState.length,
            type: "error",
            content: err.message,
          },
        },
      });
    });
};

// --- Search v2 (redesigned Search page) ---------------------------------
// Each section has its OWN paginated endpoint (people / realms / posts) for
// the "See all" infinite scrolls; the overview endpoint settles all three
// section previews in one round-trip on query change. All four are NEW
// routes - nothing the live mobile app calls is touched. Promise-based like
// GetFollowRealmRequest; callers own loading state and error alerts.

const SearchOverviewRequest = async (searchdata: string) => {
  return await Axios.get(
    `${USER_SERVICE_API}/api/entity/search/v2/overview/${encodeURIComponent(
      searchdata,
    )}/`,
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  ).then((response) => {
    // { status, result: { people: {has_more, results}, realms: {...}, posts: {...} } }
    return response.data.status ? response.data.result : null;
  });
};

// --- Network v2 (redesigned Contacts page) -------------------------------
// Sectioned endpoints: one overview call settles all four section previews
// on page init, then each section pages its OWN route for the "See all"
// infinite scrolls. All NEW routes - /api/user/contacts stays untouched for
// the live mobile app. Follow back / Unfollow reuse the existing
// FollowRealmRequest / UnfollowRealmRequest below (already entity-generic).

const NetworkOverviewRequest = async () => {
  return await Axios.get(`${USER_SERVICE_API}/api/entity/network/overview`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
  }).then((response) => {
    // { connections: {has_more,total,results}, followers, following, groups }
    return response.data;
  });
};

const NetworkSectionRequest = async (
  section: "connections" | "followers" | "following",
  page: number,
  pageSize: number,
) => {
  return await Axios.get(`${USER_SERVICE_API}/api/entity/network/${section}`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
    params: { page, page_size: pageSize },
  }).then((response) => {
    // DRF pagination: { count, next, previous, results }
    return response.data;
  });
};

// Group chat shortcuts for the Contacts page's rail. Separate service from
// the sections above: conversations live in Mongo on the NODE side, and
// these are shortcuts into threads you're actually in - not a realm list.
// jwt-signed like the rest of the Node routes.
const GroupShortcutsRequest = async (page: number, range: number) => {
  return await Axios.get(`${API}/m/v2/group-shortcuts`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
      page,
      range,
    },
  }).then((response) => {
    if (!response.data.status) return null;
    // { items, total, next }
    const decoded: any = jwt_decode(response.data.result);
    return decoded;
  });
};

const SearchPeopleRequest = async (
  searchdata: string,
  page: number,
  pageSize: number,
) => {
  return await Axios.get(
    `${USER_SERVICE_API}/api/entity/search/v2/people/${encodeURIComponent(
      searchdata,
    )}/`,
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
      params: { page, page_size: pageSize },
    },
  ).then((response) => {
    // DRF pagination: { count, next, previous, results }
    return response.data;
  });
};

const SearchRealmsRequest = async (
  searchdata: string,
  page: number,
  pageSize: number,
  realmTypes: string = "all",
) => {
  return await Axios.get(
    `${USER_SERVICE_API}/api/entity/search/v2/realms/${encodeURIComponent(
      searchdata,
    )}/`,
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
      params: { page, page_size: pageSize, realm_types: realmTypes },
    },
  ).then((response) => {
    return response.data;
  });
};

const SearchPostsRequest = async (
  searchdata: string,
  page: number,
  pageSize: number,
) => {
  return await Axios.get(
    `${USER_SERVICE_API}/api/newsfeed/search/v2/posts/${encodeURIComponent(
      searchdata,
    )}/`,
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
      params: { page, page_size: pageSize },
    },
  ).then((response) => {
    return response.data;
  });
};

// One-click join for a PUBLIC GROUP realm (search redesign). Returns
// { already_member, conversation_id, realm_id } - conversation_id feeds
// straight into /messages/<id> since a group's conversationID is its
// realm_id.
const JoinRealmGroupRequest = async (payload: { realm_id: string }) => {
  return await Axios.post(`${USER_SERVICE_API}/api/realm/join/v2`, payload, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
  }).then((response) => {
    return response.data.status ? response.data.result : null;
  });
};

const ContactRequest = (
  params: any,
  dispatch: Dispatch<any>,
  currentAlertState: any,
  setisDisabledByRequest: any,
) => {
  const payload = params;
  // const encodedPayload = sign(payload, SECRET);
  // ${API}/u/requestContact`
  Axios.post(`${USER_SERVICE_API}/api/user/contacts`, payload, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
  })
    .then((response) => {
      if (response.data.status) {
        dispatch({
          type: SET_ALERTS,
          payload: {
            alerts: {
              id: currentAlertState.length,
              type: "success",
              content: response.data.message,
            },
          },
        });
      } else {
        dispatch({
          type: SET_ALERTS,
          payload: {
            alerts: {
              id: currentAlertState.length,
              type: "warning",
              content: response.data.message,
            },
          },
        });
      }
      setisDisabledByRequest(false);
    })
    .catch((err) => {
      dispatch({
        type: SET_ALERTS,
        payload: {
          alerts: {
            id: currentAlertState.length,
            type: "error",
            content: err.message,
          },
        },
      });
      setisDisabledByRequest(false);
    });
};

const DeclineContactRequest = (
  params: any,
  dispatch: Dispatch<any>,
  currentAlertState: any,
  setisDisabledByRequest: any,
) => {
  const payload = params;
  // const encodedPayload = sign(payload, SECRET);
  // ${API}/u/requestContact`
  Axios.delete(`${USER_SERVICE_API}/api/user/contacts`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
      action: payload.action,
    },
    data: {
      connection_id: payload.connection_id,
      to_user_id: payload.to_user_id,
    },
  })
    .then((response) => {
      dispatch({
        type: SET_ALERTS,
        payload: {
          alerts: {
            id: currentAlertState.length,
            type: "success",
            content: response.data.message,
          },
        },
      });
      setisDisabledByRequest(false);
    })
    .catch((err) => {
      dispatch({
        type: SET_ALERTS,
        payload: {
          alerts: {
            id: currentAlertState.length,
            type: "error",
            content: err.message,
          },
        },
      });
      setisDisabledByRequest(false);
    });
};

const NotificationInitRequest = (
  page: number,
  range: number,
  dispatch: Dispatch<any>,
  setisLoading: any,
) => {
  Axios.get(`${API}/u/getNotifications`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
      page: page || 1,
      range: range || 20,
    },
  })
    .then((response) => {
      if (response.data.status) {
        const decodedResult: any = jwt_decode(response.data.result);

        dispatch({
          type: SET_NOTIFICATIONS_LIST,
          payload: {
            notficationslist: {
              list: decodedResult.notifications,
              totalunread: decodedResult.totalunread,
              total: decodedResult.total,
              next: decodedResult.next,
            },
          },
        });
      }
      setisLoading(false);
    })
    .catch((err) => {
      setisLoading(false);
      console.log(err);
    });
};

const NotificationOverrideRequest = (
  page: number,
  range: number,
  dispatch: Dispatch<any>,
  setisLoading: any,
) => {
  Axios.get(`${API}/u/getNotifications`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
      page: page || 1,
      range: range || 20,
    },
  })
    .then((response) => {
      if (response.data.status) {
        const decodedResult: any = jwt_decode(response.data.result);

        dispatch({
          type: SET_NOTIFICATIONS_LIST_OVERRIDE,
          payload: {
            notficationslist: {
              list: decodedResult.notifications,
              totalunread: decodedResult.totalunread,
              total: decodedResult.total,
              next: decodedResult.next,
            },
          },
        });
      }
      setisLoading(false);
    })
    .catch((err) => {
      setisLoading(false);
      console.log(err);
    });
};

// --- Notifications v2 (redesigned Notifications page) --------------------
// Sectioned endpoints: one overview call settles all three column previews;
// each section has its OWN paginated route for the per-column / detail
// infinite scrolls. All NEW Node routes - /u/getNotifications and
// /u/readnotifications stay untouched for the live mobile app (and keep
// serving the topbar badge + SSE flow here too). Responses are jwt-signed
// like v1, hence the jwt_decode.

const NotificationsOverviewV2Request = async (previewRange: number = 8) => {
  return await Axios.get(`${API}/u/v2/notifications/overview`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
      range: previewRange,
    },
  }).then((response) => {
    if (!response.data.status) return null;
    const decoded: any = jwt_decode(response.data.result);
    return decoded;
  });
};

const NotificationsSectionV2Request = async (
  section: "activity" | "connections" | "system",
  page: number,
  range: number,
) => {
  return await Axios.get(`${API}/u/v2/notifications/${section}`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
      page,
      range,
    },
  }).then((response) => {
    if (!response.data.status) return null;
    const decoded: any = jwt_decode(response.data.result);
    return decoded;
  });
};

const ReadNotificationsRequest = () => {
  Axios.post(
    `${API}/u/readnotifications`,
    {},
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((response) => {
      if (response.data.status) {
        // OK
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

// const DeclineContactRequest = (
//   params: any,
//   dispatch: Dispatch<any>,
//   currentAlertState: any,
//   setisDisabledByRequest: any
// ) => {
//   const payload = params;
//   const encodedPayload = sign(payload, SECRET);

//   Axios.post(
//     `${API}/u/declineContactRequest`,
//     {
//       token: encodedPayload,
//     },
//     {
//       headers: {
//         "x-access-token": localStorage.getItem("authtoken"),
//       },
//     }
//   )
//     .then((response) => {
//       if (response.data.status) {
//         // dispatch({ type: SET_ALERTS, payload:{
//         //     alerts: [
//         //       ...currentAlertState,
//         //       {
//         //         id: currentAlertState.length,
//         //         type: "success",
//         //         content: response.data.message
//         //       }
//         //     ]
//         // }})
//       } else {
//         dispatch({
//           type: SET_ALERTS,
//           payload: {
//             alerts: {
//               id: currentAlertState.length,
//               type: "warning",
//               content: response.data.message,
//             },
//           },
//         });
//       }
//       // setisDisabledByRequest(false)
//     })
//     .catch((err) => {
//       dispatch({
//         type: SET_ALERTS,
//         payload: {
//           alerts: {
//             id: currentAlertState.length,
//             type: "error",
//             content: err.message,
//           },
//         },
//       });
//       setisDisabledByRequest(false);
//     });
// };

const AcceptContactRequest = (
  params: any,
  dispatch: Dispatch<any>,
  currentAlertState: any,
  setisDisabledByRequest: any,
) => {
  const payload = params;
  // const encodedPayload = sign(payload, SECRET);

  // `${API}/u/acceptContactRequest`
  Axios.put(`${USER_SERVICE_API}/api/user/contacts`, payload, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
  })
    .then((response) => {
      if (response.data.status) {
        dispatch({
          type: SET_ALERTS,
          payload: {
            alerts: {
              id: currentAlertState.length,
              type: "success",
              content: response.data.message,
            },
          },
        });
      } else {
        dispatch({
          type: SET_ALERTS,
          payload: {
            alerts: {
              id: currentAlertState.length,
              type: "warning",
              content: response.data.message,
            },
          },
        });
      }
      setisDisabledByRequest(false);
    })
    .catch((err) => {
      dispatch({
        type: SET_ALERTS,
        payload: {
          alerts: {
            id: currentAlertState.length,
            type: "error",
            content: err.message,
          },
        },
      });
      setisDisabledByRequest(false);
    });
};

const ContactsListInitRequest = (
  page: number,
  range: number,
  override: boolean,
  dispatch: Dispatch<any>,
  setisLoading: any,
  isState: boolean = false,
  search: string | null = null,
) => {
  // `${API}/u/getContacts`
  Axios.get(
    `${USER_SERVICE_API}/api/user/contacts?page=${page}&page_size=${range}`,
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
      params: {
        search,
      },
    },
  )
    .then((response) => {
      const paginatedContacts: PaginationProp<IContact> = response.data;

      if (isState) {
        if (override) {
          dispatch(paginatedContacts);
        } else {
          dispatch(paginatedContacts);
        }
      } else {
        if (override) {
          dispatch({
            type: SET_CONTACTS_LIST_OVERRIDE,
            payload: {
              contactslist: paginatedContacts,
            },
          });
        } else {
          dispatch({
            type: SET_CONTACTS_LIST,
            payload: {
              contactslist: paginatedContacts,
            },
          });
        }
      }

      setisLoading(false);
    })
    .catch((err) => {
      console.log(err);
    });
};

const ContactsListReusableRequest = (dispatch: any, setisLoading: any) => {
  Axios.get(`${USER_SERVICE_API}/api/user/contacts`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
      paginated: "false",
    },
  })
    .then((response) => {
      const bulkResponse: IContact[] = response.data;

      dispatch(bulkResponse);
      setisLoading(false);
    })
    .catch((err) => {
      console.log(err);
    });
};

const SendMessageRequest = (params: any) => {
  const payload = params;
  const encodedPayload = sign(payload, SECRET);

  Axios.post(
    `${API}/u/sendMessage`,
    {
      token: encodedPayload,
    },
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((response) => {
      if (response.data.status) {
        // console.log(response.data)
      } else {
        // console.log(response.data.message)
      }
      // setmessageValue("")
    })
    .catch((err) => {
      console.log(err);
    });
};

const SendFilesRequest = async (params: {
  conversationID: string;
  isReply: boolean;
  replyingTo: string | null;
  conversationType: string | undefined;
  files: { file: File; pendingID: string }[];
}) => {
  const formData = new FormData();
  formData.append("conversationID", params.conversationID);
  formData.append("isReply", String(!!params.isReply));
  formData.append("replyingTo", params.replyingTo || "");
  formData.append("conversationType", params.conversationType || "");
  formData.append(
    "pendingIDs",
    JSON.stringify(params.files.map((f) => f.pendingID)),
  );
  params.files.forEach((f) => formData.append("files", f.file, f.file.name));

  return await Axios.post(`${API}/u/sendFiles`, formData, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
  })
    .then((response) => response)
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};

const ManualInitConversationListRequest = async (
  page: number,
  range: number,
) => {
  return await Axios.get(`${API}/m/archives`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
      page: page,
      range: range,
    },
  })
    .then((response) => {
      if (response.data.status) {
        return response.data;
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

const InitConversationListRequest = async (page: number, range: number) => {
  const authtoken = localStorage.getItem("authtoken");
  const decodedtoken: any = authtoken ? jwtDecode(authtoken) : null;
  const entityID = decodedtoken ? decodedtoken.entity : null;
  let type = "common";

  await getSettings(entityID)
    .then((value) => {
      if (value) {
        if (value.messages && value.messages.type) {
          type = value.messages.type;
          return;
        }

        type = "common";
      } else {
        type = "common";
      }
    })
    .catch((err) => {
      console.log(err);
    });

  return await Axios.get(`${API}/m/conversations`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
      type,
      page: page,
      range: range,
    },
  })
    .then((response) => {
      if (response.data.status) {
        return response.data.result;
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

const InitConversationInfoRequest = async (conversationID: string) => {
  // No internal catch - the caller needs to know when this fails (e.g. a
  // 403 for a conversation it isn't a participant of) instead of silently
  // resolving to undefined, which previously left ConversationV2 stuck on
  // its loading spinner forever with no error surfaced.
  return Axios.get(`${API}/m/conversation/${conversationID}`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
  }).then((response) => {
    if (response.data.status) {
      return response.data.result;
    }
    return Promise.reject(
      new Error(response.data.message || "Failed to load conversation"),
    );
  });
};

const InitConversationListV1Request = async (page: number, range: number) => {
  const authtoken = localStorage.getItem("authtoken");
  const decodedtoken: any = authtoken ? jwtDecode(authtoken) : null;
  const entityID = decodedtoken ? decodedtoken.entity : null;
  let type = "common";

  await getSettings(entityID)
    .then((value) => {
      if (value) {
        if (value.messages && value.messages.type) {
          type = value.messages.type;
          return;
        }

        type = "common";
      } else {
        type = "common";
      }
    })
    .catch((err) => {
      console.log(err);
    });

  return await Axios.get(`${API}/u/initConversationList`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
      type,
      page: page,
      range: range,
    },
  })
    .then((response) => {
      if (response.data.status) {
        const decodedResult: any = jwt_decode(response.data.result);

        // console.log(decodedResult.conversationslist)
        return decodedResult;
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

const SeenMessageRequest = async (params: any) => {
  const payload = params;
  const range = params.range;
  const encodedParams = sign(payload, SECRET);

  return await Axios.post(
    `${API}/u/seenNewMessages`,
    {
      token: encodedParams,
    },
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
        range: range || 20,
      },
    },
  )
    .then((response) => {
      if (response.data.status) {
        return response.data;
      } else {
        return 0;
      }
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};

const InitConversationRequest = (
  params: any,
  dispatch: Dispatch<any>,
  settotalMessages: any,
  setisLoading: any,
  scrollBottom: any,
  onError: (() => void) | null = null,
) => {
  const conversationID = params.conversationID;
  const page = params.page;
  const range = params.range;
  // const receivers = params.receivers

  Axios.get(`${API}/u/initConversation/${conversationID}`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
      page: page || 1,
      range: range || 20,
    },
  })
    .then((response) => {
      if (response.data.status) {
        const decodedResult: any = jwt_decode(response.data.result);
        setisLoading(false);
        dispatch((prev: any) => {
          const combinedList = [...decodedResult.messages.reverse(), ...prev];
          const uniqueById = combinedList.filter(
            (obj, index, self) =>
              index === self.findIndex((t) => t._id === obj._id),
          );
          const sortedPostsDesc = uniqueById.sort((a, b) =>
            b._id.localeCompare(a._id),
          );
          return sortedPostsDesc;
        });
        // dispatch(decodedResult.messages.reverse());
        settotalMessages(decodedResult.total);
        scrollBottom();

        // setTimeout(() => {
        //     dispatch(decodedResult.messages)
        //     scrollBottom()
        // },100)
      }
    })
    .catch((err) => {
      if (onError) {
        onError();
      }
      console.log(err);
    });

  // SeenMessageRequest(conversationID, receivers).then(() => {

  // }).catch((err) => {
  //     console.log(err)
  // })
};

const CreateGroupChatRequest = (params: any, setisCreateGCToggle: any) => {
  const payload = params;
  const encodedPayload = sign(payload, SECRET);

  Axios.post(
    `${API}/u/createContactGroupChat`,
    {
      token: encodedPayload,
    },
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((response) => {
      if (response.data.status) {
        setisCreateGCToggle(false);
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

const CreateServerRequest = (params: any, setisCreateGCToggle: any) => {
  const payload = params;
  const encodedPayload = sign(payload, SECRET);

  Axios.post(
    `${API}/u/createserver`,
    {
      token: encodedPayload,
    },
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((response) => {
      if (response.data.status) {
        setisCreateGCToggle(false);
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

const CreateConferenceRequest = async (params: any) => {
  const payload = params;
  const encodedPayload = sign(payload, SECRET);

  return await Axios.post(
    `${API}/u/createconference`,
    {
      token: encodedPayload,
    },
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((response) => {
      return response.data;
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};

const CreateRealmInviteRequest = async (params: any) => {
  return await Axios.post(`${USER_SERVICE_API}/api/realm/invites`, params, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
  })
    .then((response) => response.data)
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};

const GetRealmInviteRequest = async (params: any) => {
  return await Axios.get(`${USER_SERVICE_API}/api/realm/invites`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
    params,
  })
    .then((response) => response.data)
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};

const UpdateRealmInviteRequest = async (params: any) => {
  return await Axios.patch(`${USER_SERVICE_API}/api/realm/invites`, params, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
  })
    .then((response) => response.data)
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};

const CallRequest = async (params: any) => {
  const payload = params;
  const encodedPayload = sign(payload, SECRET);

  return await Axios.post(
    `${API}/u/call`,
    {
      token: encodedPayload,
    },
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((response) => {
      if (response.data.status) {
        //action if needed
        return true;
      } else {
        return false;
      }
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};

const VoiceRequest = async (params: any) => {
  const payload = params;

  return await Axios.post(`${API}/u/notify-voice-join`, payload, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
  })
    .then((response) => {
      if (response.data.status) {
        //action if needed
        return true;
      } else {
        return false;
      }
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};

const ActiveContactsRequest = (dispatch: Dispatch<any>) => {
  Axios.get(`${API}/u/activecontacts`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
  })
    .then((response) => {
      if (response.data.status) {
        dispatch({
          type: SET_ACTIVE_USERS_LIST,
          payload: {
            activeuserslist: response.data.result,
          },
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

const RejectCallRequest = (params: any) => {
  const payload = params;
  const encodedPayload = sign(payload, SECRET);

  Axios.post(
    `${API}/u/rejectcall`,
    {
      token: encodedPayload,
    },
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((_) => {
      //action when needed if success
    })
    .catch((err) => {
      console.log(err);
    });
};

const EndCallRequest = (params: any) => {
  const payload = params;
  const encodedPayload = sign(payload, SECRET);

  Axios.post(
    `${API}/u/endcall`,
    {
      token: encodedPayload,
    },
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((_) => {
      //action when needed if success
    })
    .catch((err) => {
      console.log(err);
    });
};

const GetProfileInfo = async (params: any, query?: any) => {
  const userID = params.userID;

  // `${API}/p/userinfo/${userID}`
  return await Axios.get(`${USER_SERVICE_API}/api/user/auth/${userID}/`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
    params: query,
  })
    .then((response: any) => {
      return response;
    })
    .catch((err) => {
      throw new Error(err);
    });
};

const CreatePostRequest = async (payload: any) => {
  const rawpayload = payload;
  const encodedPayload = sign(rawpayload, SECRET);

  return await Axios.post(
    `${API}/posts/createpost`,
    {
      token: encodedPayload,
    },
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((response) => {
      return response;
    })
    .catch((err) => {
      throw new Error(err);
    });
};

const UploadMediaRequest = async (
  files: { file: File; caption?: string; referenceMediaType?: string }[],
) => {
  const formData = new FormData();
  files.forEach((f) => formData.append("media", f.file, f.file.name));
  formData.append(
    "captions",
    JSON.stringify(files.map((f) => f.caption || "")),
  );
  formData.append(
    "referenceMediaTypes",
    JSON.stringify(files.map((f) => f.referenceMediaType || f.file.type)),
  );

  return await Axios.post(`${API}/posts/upload`, formData, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
  })
    .then((response) => {
      return response;
    })
    .catch((err) => {
      throw new Error(err);
    });
};

const GetPostRequest = async (params: any, archive?: boolean) => {
  const current_user_id = params.current_user_id;
  const userID = params.userID;
  const page = params.page;
  const range = params.range;

  const viewCache = await getAllViewCache(current_user_id);

  return await Axios.post(
    `${USER_SERVICE_API}/api/newsfeed/profile/${userID}/?page=${page}&page_size=${range}`,
    {
      viewcache: viewCache,
    },
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
      params: {
        archive: archive,
      },
    },
  )
    .then((response) => {
      clearViewPosts();
      return response.data;
    })
    .catch((err) => {
      throw new Error(err);
    });
};

const DeleteMessageRequest = async (params: any) => {
  const encodedParams = sign(params, SECRET);

  return await Axios.post(
    `${API}/m/deletemessage`,
    {
      token: encodedParams,
    },
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((response) => {
      return response;
    })
    .catch((err) => {
      throw new Error(err);
    });
};

const ReactToMessageRequest = async (params: any) => {
  const encodedParams = sign(params, SECRET);

  return await Axios.post(
    `${API}/m/addreaction`,
    {
      token: encodedParams,
    },
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((response) => {
      return response;
    })
    .catch((err) => {
      throw new Error(err);
    });
};

// Sets the acting entity's reaction on a message: pass an emoji to add or
// change it, or `emoji: null` to remove. The server pulls the existing one
// first, so changing never leaves two. Keyed on the JWT's entity id, so no
// id is sent and you can only ever affect your own reaction.
const SetMessageReactionRequest = async (params: any) => {
  const encodedParams = sign(params, SECRET);

  return await Axios.post(
    `${API}/m/v2/setreaction`,
    {
      token: encodedParams,
    },
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  ).then((response) => {
    return response;
  });
};

const ConversationInfoRequest = async (params: any) => {
  const conversationID = params.conversationID;
  const type = params.type;

  return await Axios.get(
    `${API}/m/conversationinfo/${conversationID}/${type}`,
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((response) => {
      if (response.data.status) {
        const decodedResult: any = jwt_decode(response.data.result);
        return decodedResult?.data;
      } else {
        return false;
      }
    })
    .catch((err) => {
      throw new Error(err);
    });
};

const IsTypingBroadcastRequest = (payload: any) => {
  const encodedPayload = sign(payload, SECRET);

  Axios.post(
    `${API}/m/istypingbroadcast`,
    {
      token: encodedPayload,
    },
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((response) => {
      if (response.data.status) {
        // OK
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

const AddNewMemberRequest = async (payload: any) => {
  const encodedPayload = sign(payload, SECRET);

  return await Axios.post(
    `${API}/m/addnewmember`,
    {
      token: encodedPayload,
    },
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((response) => {
      return response;
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};

const InitServerListRequest = async () => {
  return await Axios.get(`${API}/s/initserverlist`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
  })
    .then((response) => {
      if (response.data.status) {
        const decodedResult: any = jwt_decode(response.data.result);
        return decodedResult.data;
      } else {
        return false;
      }
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};

const InitServerConversationRequest = async (params: any) => {
  const conversationID = params.conversationID;
  const serverID = params.serverID;

  return await Axios.get(
    `${API}/s/initserversetup/${serverID}/${conversationID}`,
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((response) => {
      if (response.data.status) {
        const decodedResult: any = jwt_decode(response.data.result);
        return decodedResult.conversationslist;
      } else {
        return false;
      }
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};

const InitServerChannelsRequest = async (params: any) => {
  const serverID = params.serverID;

  return await Axios.get(`${API}/s/initserverchannels/${serverID}`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
  })
    .then((response) => {
      if (response.data.status) {
        const decodedResult: any = jwt_decode(response.data.result);
        return decodedResult.data;
      } else {
        return false;
      }
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};

const AddNewMemberToServer = async (payload: any) => {
  const encodedParams = sign(payload, SECRET);

  return await Axios.post(
    `${API}/s/addnewmembertoserver`,
    {
      token: encodedParams,
    },
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((response) => {
      return response;
    })
    .catch((err) => {
      throw new Error(err);
    });
};

const CreateChannelRequest = async (
  payloadprop: any,
  setisCreateGCToggle: any,
) => {
  const payload = payloadprop;
  const encodedPayload = sign(payload, SECRET);

  await Axios.post(
    `${API}/u/createchannel`,
    {
      token: encodedPayload,
    },
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((response) => {
      if (response.data.status) {
        setisCreateGCToggle(false);
        return true;
      }
    })
    .catch((err) => {
      console.log(err);
      return false;
    });
};

const GetMembersListInServer = (
  serverID: string,
  dispatch: any,
  setisLoading: any,
) => {
  Axios.get(`${API}/s/getservermembers/${serverID}`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
  })
    .then((response) => {
      if (response.data.status) {
        const decodedResult: any = jwt_decode(response.data.result);

        dispatch(
          decodedResult.members.map((mp: any) => ({
            ...mp,
            userID: mp.username,
          })),
        );
        setisLoading(false);
      } else {
        /* empty */
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

const GetFeedRequest = async (params: any) => {
  const current_user_id = params.current_user_id;
  const range = params.range;
  const page = params.page;

  const viewCache = await getAllViewCache(current_user_id);

  return await Axios.post(
    `${USER_SERVICE_API}/api/newsfeed/default/?page=${page}&page_size=${range}`,
    {
      viewcache: viewCache,
    },
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((response) => {
      clearViewPosts();
      return response.data;
    })
    .catch((err) => {
      throw new Error(err);
    });
};

const GetFeedEmojisRequest = async () => {
  return await Axios.get(`${USER_SERVICE_API}/api/newsfeed/emojis`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
  })
    .then((response) => {
      return response.data;
    })
    .catch((err) => {
      throw new Error(err);
    });
};

const GetPostPreviewRequest = async (params: any) => {
  const postID = params.postID;

  return await Axios.get(
    `${USER_SERVICE_API}/api/newsfeed/preview/${postID}/`,
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((response) => {
      return response.data;
    })
    .catch((err) => {
      throw new Error(err);
    });
};

const ReactionSaveRequest = async (params: any) => {
  const post_id = params.post_id;
  const emoji_id = params.emoji_id;
  const method = params.method;

  return await Axios({
    url: `${USER_SERVICE_API}/api/newsfeed/reaction`,
    method: method,
    data: {
      post_id,
      emoji_id,
    },
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
  })
    .then((response) => {
      return response.data;
    })
    .catch((err) => {
      throw new Error(err);
    });
};

// Comment reactions - ReactionSaveRequest one level down. Same `method`
// switch (POST adds, PUT changes the emoji, DELETE removes) against the
// comment_reaction route, so PostEmojis drives either kind unchanged.
const CommentReactionSaveRequest = async (params: any) => {
  const comment_id = params.comment_id;
  const emoji_id = params.emoji_id;
  const method = params.method;

  return await Axios({
    url: `${USER_SERVICE_API}/api/newsfeed/comment_reaction`,
    method: method,
    data: {
      comment_id,
      emoji_id,
    },
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
  })
    .then((response) => {
      return response.data;
    })
    .catch((err) => {
      throw new Error(err);
    });
};

const GetCommentReactionTotalRequest = async (comment_id: string) => {
  return await Axios.get(
    `${USER_SERVICE_API}/api/newsfeed/comment_total_reactions/${comment_id}/`,
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((response) => {
      return response.data;
    })
    .catch((err) => {
      throw new Error(err);
    });
};

const GetReactionTotalRequest = async (post_id: string) => {
  return await Axios.get(
    `${USER_SERVICE_API}/api/newsfeed/total_reactions/${post_id}/`,
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((response) => {
      return response.data;
    })
    .catch((err) => {
      throw new Error(err);
    });
};

const GetCommentsRequest = async (
  post_id: string,
  parent_id: string | null,
  page: number = 1,
  range: number = 20,
) => {
  const url = parent_id
    ? `${USER_SERVICE_API}/api/newsfeed/comments?post_id=${post_id}&parent_id=${parent_id}&page=${page}&page_size=${range}`
    : `${USER_SERVICE_API}/api/newsfeed/comments?post_id=${post_id}&page=${page}&page_size=${range}`;
  return await Axios.get(url, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
  })
    .then((response) => {
      return response.data;
    })
    .catch((err) => {
      throw new Error(err);
    });
};

const SaveCommentRequest = async (
  post_id: string,
  parent_id: string | null,
  new_comment: string,
  new_attachment: string | null,
) => {
  const payload = {
    post_id,
    parent_id,
    new_comment,
    new_attachment,
  };
  return await Axios.post(
    `${USER_SERVICE_API}/api/newsfeed/comments`,
    removeNullsFromObject(payload),
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((response) => {
      return response.data;
    })
    .catch((err) => {
      throw new Error(err);
    });
};

// Soft-deletes a comment (sets deleted_at/deleted_by server-side). Ownership
// is enforced by the backend's assert_owns, so this cannot delete someone
// else's comment even if a comment_id is guessed.
const DeleteCommentRequest = async (comment_id: string) => {
  return await Axios.delete(`${USER_SERVICE_API}/api/newsfeed/comments`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
    data: { comment_id },
  }).then((response) => {
    return response.data;
  });
};

const GetLinkPreviewRequest = async (
  payload: { url?: string; text?: string; force_refresh?: boolean },
  signal?: AbortSignal,
) => {
  return await Axios.post(
    `${USER_SERVICE_API}/api/newsfeed/link-preview`,
    payload,
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
      signal,
    },
  )
    .then((response) => response.data)
    .catch((err) => {
      throw new Error(err);
    });
};

const PublicServersListRequest = async () => {
  return await Axios.get(`${API}/s/publicservers`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
  })
    .then((response) => {
      if (response.data.status) {
        return response.data;
      } else {
        return false;
      }
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};

const LottieJSONRequest = async (url: string) => {
  return await Axios.get(url)
    .then((response) => {
      return response.data;
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};

const GetDiaryTotalRequest = async (params: any) => {
  const userID = params.userID;
  return await Axios.get(`${USER_SERVICE_API}/api/diary/total/${userID}/`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
  })
    .then((response) => {
      return response.data;
    })
    .catch((err) => {
      throw new Error(err);
    });
};

const GetMoodListRequest = async (params: any) => {
  const range = params.range;
  const page = params.page;

  return await Axios.get(
    `${USER_SERVICE_API}/api/diary/moods/?page=${page}&page_size=${range}`,
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((response) => {
      return response.data;
    })
    .catch((err) => {
      throw new Error(err);
    });
};

const GetTagsListRequest = async (params: any) => {
  const search = params.search;
  const range = params.range;
  const page = params.page;

  return await Axios.get(
    `${USER_SERVICE_API}/api/diary/tags/?search=${search}&page=${page}&page_size=${range}`,
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((response) => {
      return response.data;
    })
    .catch((err) => {
      throw new Error(err);
    });
};

const GetUserEntriesRequest = async (params: any) => {
  const range = params.range;
  const page = params.page;

  return await Axios.get(
    `${USER_SERVICE_API}/api/diary/entries/?page=${page}&page_size=${range}`,
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((response) => {
      return response.data;
    })
    .catch((err) => {
      throw new Error(err);
    });
};

const PostNewEntryRequest = async (payload: INewEntry) => {
  return await Axios.post(`${USER_SERVICE_API}/api/diary/entry/`, payload, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
  })
    .then((response) => {
      return response.data;
    })
    .catch((err) => {
      throw new Error(err);
    });
};

const GetEntryRequest = async (entry_id: string) => {
  return await Axios.get(`${USER_SERVICE_API}/api/diary/entry/${entry_id}`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
  })
    .then((response) => {
      return response.data;
    })
    .catch((err) => {
      throw new Error(err);
    });
};

const BroadcastCoordinatesRequest = async (payload: any) => {
  return await Axios.post(`${API}/u/coordinatesbroadcast`, payload, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
  })
    .then((response) => {
      if (response.data.status) {
        //action if needed
        return true;
      } else {
        return false;
      }
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};

const SnapCoordinatesOpenRoute = async (payload: any) => {
  return await Axios.post(
    `${envs.OPEN_ROUTE_API}/v2/snap/driving-car`,
    payload,
    {
      headers: {
        Accept:
          "application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8",
        Authorization: envs.OPEN_ROUTE_API_KEY,
        "Content-Type": "application/json; charset=utf-8",
      },
    },
  )
    .then((response) => {
      return response;
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};

const JoinRoomRequest = async (payload: any) => {
  return await Axios.post(`${envs.CHATTERLOOP_API}/webrtc/join-room`, payload, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
  })
    .then((response) => {
      if (response.data.status) {
        //action if needed
        return response.data;
      } else {
        return false;
      }
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};

const CreateTransportRequest = async (payload: any) => {
  return await Axios.post(
    `${envs.CHATTERLOOP_API}/webrtc/create-transport`,
    payload,
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((response) => {
      if (response.data.status) {
        //action if needed
        return response.data;
      } else {
        return false;
      }
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};

const TransportConnectRequest = async (payload: any) => {
  return await Axios.post(
    `${envs.CHATTERLOOP_API}/webrtc/transport-connect`,
    payload,
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((response) => {
      if (response.data.status) {
        //action if needed
        return response.data;
      } else {
        return false;
      }
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};

const GetEncodingsRequest = async () => {
  return await Axios.get(`${envs.CHATTERLOOP_API}/webrtc/encodings`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
  })
    .then((response) => {
      if (response.data.status) {
        return response.data;
      } else {
        return null;
      }
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};

const TransportProduceRequest = async (payload: any) => {
  return await Axios.post(`${envs.CHATTERLOOP_API}/webrtc/produce`, payload, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
  })
    .then((response) => {
      if (response.data.status) {
        //action if needed
        return response.data;
      } else {
        return false;
      }
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};

const ConsumeRequest = async (payload: any) => {
  return await Axios.post(`${envs.CHATTERLOOP_API}/webrtc/consume`, payload, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
  })
    .then((response) => {
      if (response.data.status) {
        //action if needed
        return response.data;
      } else {
        return false;
      }
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};

const CloseProducerRequest = async (payload: any) => {
  return await Axios.post(
    `${envs.CHATTERLOOP_API}/webrtc/close-producer`,
    payload,
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((response) => {
      if (response.data.status) {
        return response.data;
      } else {
        return false;
      }
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};

const LeaveRoomRequest = async (payload: any) => {
  return await Axios.post(
    `${envs.CHATTERLOOP_API}/webrtc/leave-room`,
    payload,
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((response) => {
      if (response.data.status) {
        return response.data;
      } else {
        return false;
      }
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};

const ParticipantStatusRequest = async (payload: any) => {
  return await Axios.post(
    `${envs.CHATTERLOOP_API}/webrtc/participant-status`,
    payload,
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((response) => {
      if (response.data.status) {
        return response.data;
      } else {
        return false;
      }
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};

const CreatePageRequest = async (payload: {
  pageName: string;
  pageDescription: string;
  email: string;
  slug: string;
  otherUsers: any[];
  profile: File;
  cover_photo: File;
}) => {
  const formData = new FormData();
  formData.append("pageName", payload.pageName);
  formData.append("pageDescription", payload.pageDescription);
  formData.append("email", payload.email);
  formData.append("slug", payload.slug);
  formData.append("otherUsers", JSON.stringify(payload.otherUsers));
  formData.append("profile", payload.profile);
  formData.append("cover_photo", payload.cover_photo);

  return await Axios.post(`${envs.CHATTERLOOP_API}/u/createpage`, formData, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
  })
    .then((response) => {
      if (response.data.status) {
        return response.data;
      } else {
        return false;
      }
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};

const FollowRealmRequest = async (payload: any) => {
  return await Axios.post(
    `${envs.USER_SERVICE_API}/api/realm/follow`,
    payload,
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((response) => {
      if (response.data.status) {
        return response.data;
      } else {
        return false;
      }
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};

const UnfollowRealmRequest = async (payload: any) => {
  return await Axios.delete(`${envs.USER_SERVICE_API}/api/realm/follow`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
    data: payload,
  })
    .then((response) => {
      if (response.data.status) {
        return response.data;
      } else {
        return false;
      }
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};

const GetFollowRealmRequest = async (
  page: number,
  range: number,
  type: string,
  search?: string,
) => {
  return await Axios.get(`${USER_SERVICE_API}/api/realm/follow`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
    params: {
      page,
      page_size: range,
      type,
      search,
    },
  })
    .then((response) => {
      if (response.data) {
        return response.data;
      } else {
        return false;
      }
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};

const GetMyRealmsRequest = async (
  page: number,
  range: number,
  type: string,
  search?: string,
) => {
  return await Axios.get(`${USER_SERVICE_API}/api/realm/my-list`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
    params: {
      page,
      page_size: range,
      type,
      search,
    },
  })
    .then((response) => {
      if (response.data) {
        return response.data;
      } else {
        return false;
      }
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};

const GetTopRealmsRequest = async (
  page: number,
  range: number,
  type: string,
  search?: string | null,
) => {
  return await Axios.get(`${USER_SERVICE_API}/api/realm/top`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
    params: {
      page,
      page_size: range,
      type,
      search,
    },
  })
    .then((response) => {
      if (response.data) {
        return response.data;
      } else {
        return false;
      }
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};

const DeletePostRequest = async (post_ids: string[]) => {
  return await Axios.delete(`${USER_SERVICE_API}/api/newsfeed/default`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
    data: {
      post_ids,
    },
  })
    .then((response) => {
      clearViewPosts();
      return response.data;
    })
    .catch((err) => {
      throw new Error(err);
    });
};

const UpdatePostRequest = async (post_id: string, fields: any) => {
  return await Axios.put(
    `${USER_SERVICE_API}/api/newsfeed/default`,
    {
      post_id,
      fields,
    },
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((response) => {
      clearViewPosts();
      return response.data;
    })
    .catch((err) => {
      throw new Error(err);
    });
};

const SavePostRequest = async (post_id: string) => {
  return await Axios.post(
    `${USER_SERVICE_API}/api/newsfeed/saves`,
    {
      post_id,
    },
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((response) => {
      return response.data;
    })
    .catch((err) => {
      throw new Error(err);
    });
};

const UnsavePostRequest = async (post_id: string) => {
  return await Axios.delete(`${USER_SERVICE_API}/api/newsfeed/saves`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
    data: {
      post_id,
    },
  })
    .then((response) => {
      return response.data;
    })
    .catch((err) => {
      throw new Error(err);
    });
};

const GetSavedPostsRequest = async (params: any) => {
  const page = params.page;
  const range = params.range;

  return await Axios.get(
    `${USER_SERVICE_API}/api/newsfeed/saves?page=${page}&page_size=${range}`,
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((response) => {
      return response.data;
    })
    .catch((err) => {
      throw new Error(err);
    });
};

const UpdateRealmMediaRequest = async (payload: {
  realm_id: string;
  realm_type: string;
  media_type: "profile" | "cover_photo";
  image: File;
}) => {
  const formData = new FormData();
  formData.append("realm_id", payload.realm_id);
  formData.append("realm_type", payload.realm_type);
  formData.append("media_type", payload.media_type);
  formData.append("image", payload.image);

  return await Axios.post(
    `${envs.CHATTERLOOP_API}/realms/upload-media`,
    formData,
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((response) => {
      if (response.data.status) {
        return response.data;
      } else {
        return false;
      }
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};

const UpdateRealmRequest = async (realm_id: string, fields: any) => {
  return await Axios.put(
    `${USER_SERVICE_API}/api/realm/my-list`,
    {
      realm_id,
      fields,
    },
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((response) => {
      if (response.data) {
        return response.data;
      } else {
        return false;
      }
    })
    .catch((err) => {
      console.log(err);

      if (err.response.data.includes("duplicate key")) {
        throw new Error("Slug already exists");
      }

      throw new Error(err);
    });
};

const GetRealmMembersRequest = async (
  realm_id: string,
  page: number,
  range: number,
  search?: string | null,
) => {
  return await Axios.get(`${USER_SERVICE_API}/api/realm/members`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
    params: {
      realm_id,
      page,
      page_size: range,
      search,
    },
  })
    .then((response) => {
      if (response.data) {
        return response.data;
      } else {
        return false;
      }
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};

const GetRealmFollowersRequest = async (
  realm_id: string,
  page: number,
  range: number,
  search?: string | null,
) => {
  return await Axios.get(`${USER_SERVICE_API}/api/realm/realm-followers`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
    params: {
      realm_id,
      page,
      page_size: range,
      search,
    },
  })
    .then((response) => {
      if (response.data) {
        return response.data;
      } else {
        return false;
      }
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};

const RemoveRealmFollowersRequest = async (
  realm_id: string,
  follow_id: string,
) => {
  return await Axios.delete(`${USER_SERVICE_API}/api/realm/realm-followers`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
    data: {
      realm_id,
      follow_id,
    },
  })
    .then((response) => {
      if (response.data) {
        return response.data;
      } else {
        return false;
      }
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};

const UpdateMemberRoleRequest = async (
  realm_id: string,
  member_id: any,
  new_role: any,
) => {
  return await Axios.put(
    `${API}/s/update-member-realm-role`,
    { realm_id, member_id, new_role },
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((response) => {
      return response.data;
    })
    .catch((err) => {
      throw new Error(err);
    });
};

const RemoveRealmMemberRequest = async (
  realm_id: string,
  account_ids: string[],
) => {
  return await Axios.delete(`${API}/realms/remove-user`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
    data: {
      realm_id,
      account_ids,
    },
  })
    .then((response) => {
      return response.data;
    })
    .catch((err) => {
      throw new Error(err);
    });
};

const UpdateChatHistoryRequest = async (payload: any) => {
  return await Axios.post(`${API}/m/history`, payload, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
  })
    .then((response) => {
      return response.data;
    })
    .catch((err) => {
      console.log(err);
      throw new Error(err);
    });
};

const ReconnectStaleCallerSessionRequest = async (
  conversationID: string,
  clientId: string,
  instance: string | null,
) => {
  return await Axios.post(
    `${envs.CHATTERLOOP_API}/webrtc/reconnect`,
    { conversationID, clientId, instance },
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken") || "",
      },
    },
  );
};

const CompleteProfileRequest = async (
  params: any,
  dispatch: Dispatch<any>,
  currentAlertState: any,
  setisWaitingRequest: any,
) => {
  const payload = params;
  return Axios.put(`${USER_SERVICE_API}/api/user/me`, payload, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken") || "",
    },
  })
    .then((response) => {
      if (response.data.status) {
        const userData: ConvertedResponse = convertLoginResponse(
          response.data.data,
        );

        dispatch({
          type: SET_AUTHENTICATION,
          payload: {
            authentication: {
              // Spread the current store state (not just a flat object) -
              // this reducer fully replaces authentication, so omitting
              // this would silently drop active_entity_context/
              // allowed_modules and white-screen the app.
              ...store.getState().authentication,
              auth: true,
              user: {
                userID: userData.id,
                username: userData.username,
                fullName: {
                  firstName: userData.fullname.firstName,
                  middleName: userData.fullname.middleName,
                  lastName: userData.fullname.lastName,
                },
                birthdate: userData.birthdate,
                gender: userData.gender,
                email: userData.email,
                isActivated: userData.isActivated,
                isVerified: userData.isVerified,
                isComplete: userData.isComplete,
                pendingConsents: userData.pendingConsents,
                entity_id: userData.entity_id,
                profile: userData.profile,
                coverphoto: userData.coverphoto || "",
              },
            },
          },
        });
      } else {
        dispatch({
          type: SET_ALERTS,
          payload: {
            alerts: {
              id: currentAlertState.length,
              type: "warning",
              content: response.data.message,
            },
          },
        });
      }
      setisWaitingRequest(false);
      return response.data.status as boolean;
    })
    .catch((err) => {
      dispatch({
        type: SET_ALERTS,
        payload: {
          alerts: {
            id: currentAlertState.length,
            type: "error",
            content: err.message,
          },
        },
      });
      setisWaitingRequest(false);
      return false;
    });
};

const GetCurrentPoliciesRequest = async () => {
  return Axios.get(`${USER_SERVICE_API}/api/user/policies`).then((response) =>
    response.data.status
      ? (response.data.data as {
          document_type: string;
          version: string;
          content: string;
          document_url: string;
          effective_date: string;
        }[])
      : [],
  );
};

const AcceptPoliciesRequest = async (
  dispatch: Dispatch<any>,
  currentAlertState: any,
  setisWaitingRequest: any,
) => {
  return Axios.post(
    `${USER_SERVICE_API}/api/user/policies/accept`,
    {},
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken") || "",
      },
    },
  )
    .then((response) => {
      if (response.data.status) {
        const userData: ConvertedResponse = convertLoginResponse(
          response.data.data,
        );

        dispatch({
          type: SET_AUTHENTICATION,
          payload: {
            authentication: {
              // Spread the current store state (not just a flat object) -
              // this reducer fully replaces authentication, so omitting
              // this would silently drop active_entity_context/
              // allowed_modules and white-screen the app.
              ...store.getState().authentication,
              auth: true,
              user: {
                userID: userData.id,
                username: userData.username,
                fullName: {
                  firstName: userData.fullname.firstName,
                  middleName: userData.fullname.middleName,
                  lastName: userData.fullname.lastName,
                },
                birthdate: userData.birthdate,
                gender: userData.gender,
                email: userData.email,
                isActivated: userData.isActivated,
                isVerified: userData.isVerified,
                isComplete: userData.isComplete,
                pendingConsents: userData.pendingConsents,
                entity_id: userData.entity_id,
                profile: userData.profile,
                coverphoto: userData.coverphoto || "",
              },
            },
          },
        });
      } else {
        dispatch({
          type: SET_ALERTS,
          payload: {
            alerts: {
              id: currentAlertState.length,
              type: "warning",
              content: response.data.message,
            },
          },
        });
      }
      setisWaitingRequest(false);
    })
    .catch((err) => {
      dispatch({
        type: SET_ALERTS,
        payload: {
          alerts: {
            id: currentAlertState.length,
            type: "error",
            content: err.message,
          },
        },
      });
      setisWaitingRequest(false);
    });
};

const ExportAccountDataRequest = async (
  dispatch: Dispatch<any>,
  currentAlertState: any,
  setisWaitingRequest: any,
) => {
  return Axios.get(`${USER_SERVICE_API}/api/user/me/export`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken") || "",
    },
  })
    .then((response) => {
      if (response.data.status) {
        const blob = new Blob([JSON.stringify(response.data.data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `chatterloop-data-export-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        dispatch({
          type: SET_ALERTS,
          payload: {
            alerts: {
              id: currentAlertState.length,
              type: "warning",
              content: response.data.message,
            },
          },
        });
      }
      setisWaitingRequest(false);
    })
    .catch((err) => {
      dispatch({
        type: SET_ALERTS,
        payload: {
          alerts: {
            id: currentAlertState.length,
            type: "error",
            content: err.message,
          },
        },
      });
      setisWaitingRequest(false);
    });
};

const DeleteAccountRequest = async (
  dispatch: Dispatch<any>,
  currentAlertState: any,
  setisWaitingRequest: any,
) => {
  return Axios.delete(`${USER_SERVICE_API}/api/user/me`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken") || "",
    },
  })
    .then((response) => {
      if (response.data.status) {
        LogoutRequest(dispatch);
      } else {
        dispatch({
          type: SET_ALERTS,
          payload: {
            alerts: {
              id: currentAlertState.length,
              type: "warning",
              content: response.data.message,
            },
          },
        });
      }
      setisWaitingRequest(false);
    })
    .catch((err) => {
      dispatch({
        type: SET_ALERTS,
        payload: {
          alerts: {
            id: currentAlertState.length,
            type: "error",
            content: err.message,
          },
        },
      });
      setisWaitingRequest(false);
    });
};

const BlockUserRequest = async (
  entityID: string,
  dispatch: Dispatch<any>,
  currentAlertState: any,
  setisWaitingRequest: any,
) => {
  return Axios.post(
    `${USER_SERVICE_API}/api/user/blocks`,
    { entityID },
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken") || "",
      },
    },
  )
    .then((response) => {
      dispatch({
        type: SET_ALERTS,
        payload: {
          alerts: {
            id: currentAlertState.length,
            type: response.data.status ? "success" : "warning",
            content: response.data.message,
          },
        },
      });
      setisWaitingRequest(false);
      return response.data.status as boolean;
    })
    .catch((err) => {
      dispatch({
        type: SET_ALERTS,
        payload: {
          alerts: {
            id: currentAlertState.length,
            type: "error",
            content: err.message,
          },
        },
      });
      setisWaitingRequest(false);
      return false;
    });
};

const PokeUserRequest = async (
  target_id: string,
  dispatch: Dispatch<any>,
  currentAlertState: any,
  setisWaitingRequest: any,
) => {
  return Axios.post(
    `${USER_SERVICE_API}/api/user/poke`,
    { target_id },
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken") || "",
      },
    },
  )
    .then((response) => {
      dispatch({
        type: SET_ALERTS,
        payload: {
          alerts: {
            id: currentAlertState.length,
            type: response.data.status ? "success" : "warning",
            content: response.data.message,
          },
        },
      });
      setisWaitingRequest(false);
      return response.data.status as boolean;
    })
    .catch((err) => {
      dispatch({
        type: SET_ALERTS,
        payload: {
          alerts: {
            id: currentAlertState.length,
            type: "error",
            content: err.message,
          },
        },
      });
      setisWaitingRequest(false);
      return false;
    });
};

const UnblockUserRequest = async (
  entityID: string,
  dispatch: Dispatch<any>,
  currentAlertState: any,
  setisWaitingRequest: any,
) => {
  return Axios.delete(`${USER_SERVICE_API}/api/user/blocks`, {
    data: { entityID },
    headers: {
      "x-access-token": localStorage.getItem("authtoken") || "",
    },
  })
    .then((response) => {
      dispatch({
        type: SET_ALERTS,
        payload: {
          alerts: {
            id: currentAlertState.length,
            type: response.data.status ? "success" : "warning",
            content: response.data.message,
          },
        },
      });
      setisWaitingRequest(false);
      return response.data.status as boolean;
    })
    .catch((err) => {
      dispatch({
        type: SET_ALERTS,
        payload: {
          alerts: {
            id: currentAlertState.length,
            type: "error",
            content: err.message,
          },
        },
      });
      setisWaitingRequest(false);
      return false;
    });
};

const ListBlockedUsersRequest = async () => {
  return Axios.get(`${USER_SERVICE_API}/api/user/blocks`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken") || "",
    },
  }).then((response) => (response.data.status ? response.data.data : []));
};

const ListDeviceSessionsRequest = async () => {
  return Axios.get(`${USER_SERVICE_API}/api/user/devices`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken") || "",
    },
  }).then((response) => (response.data.status ? response.data.data : []));
};

const RevokeDeviceSessionRequest = async (
  sessionID: string,
  dispatch: Dispatch<any>,
  currentAlertState: any,
  setisWaitingRequest: any,
) => {
  return Axios.delete(`${USER_SERVICE_API}/api/user/devices`, {
    data: { sessionID },
    headers: {
      "x-access-token": localStorage.getItem("authtoken") || "",
    },
  })
    .then((response) => {
      dispatch({
        type: SET_ALERTS,
        payload: {
          alerts: {
            id: currentAlertState.length,
            type: response.data.status ? "success" : "warning",
            content: response.data.message,
          },
        },
      });
      setisWaitingRequest(false);
      return response.data.status as boolean;
    })
    .catch((err) => {
      dispatch({
        type: SET_ALERTS,
        payload: {
          alerts: {
            id: currentAlertState.length,
            type: "error",
            content: err.message,
          },
        },
      });
      setisWaitingRequest(false);
      return false;
    });
};

const ReportUserRequest = async (
  params: {
    target_type: string;
    target_id: string;
    reason: string;
    description?: string;
  },
  dispatch: Dispatch<any>,
  currentAlertState: any,
  setisWaitingRequest: any,
) => {
  return Axios.post(`${USER_SERVICE_API}/api/user/reports`, params, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken") || "",
    },
  })
    .then((response) => {
      dispatch({
        type: SET_ALERTS,
        payload: {
          alerts: {
            id: currentAlertState.length,
            type: response.data.status ? "success" : "warning",
            content: response.data.status
              ? "Report submitted. Thank you for letting us know."
              : response.data.message,
          },
        },
      });
      setisWaitingRequest(false);
      return response.data.status as boolean;
    })
    .catch((err) => {
      dispatch({
        type: SET_ALERTS,
        payload: {
          alerts: {
            id: currentAlertState.length,
            type: "error",
            content: err.message,
          },
        },
      });
      setisWaitingRequest(false);
      return false;
    });
};

const UpdateProfileInfoRequest = async (
  params: any,
  dispatch: Dispatch<any>,
  currentAlertState: any,
  setisWaitingRequest: any,
) => {
  const payload = params;
  Axios.put(`${USER_SERVICE_API}/api/user/me`, payload, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken") || "",
    },
  })
    .then((response) => {
      if (response.data.status) {
        const userData: ConvertedResponse = convertLoginResponse(
          response.data.data,
        );

        dispatch({
          type: SET_ALERTS,
          payload: {
            alerts: {
              id: currentAlertState.length,
              type: "success",
              content: "Successfully updated profile",
            },
          },
        });

        dispatch({
          type: SET_AUTHENTICATION,
          payload: {
            authentication: {
              // Spread the current store state (not just a flat object) -
              // this reducer fully replaces authentication, so omitting
              // this would silently drop active_entity_context/
              // allowed_modules and white-screen the app.
              ...store.getState().authentication,
              auth: true,
              user: {
                userID: userData.id,
                username: userData.username,
                fullName: {
                  firstName: userData.fullname.firstName,
                  middleName: userData.fullname.middleName,
                  lastName: userData.fullname.lastName,
                },
                birthdate: userData.birthdate,
                gender: userData.gender,
                email: userData.email,
                isActivated: userData.isActivated,
                isVerified: userData.isVerified,
                isComplete: userData.isComplete,
                pendingConsents: userData.pendingConsents,
                entity_id: userData.entity_id,
                profile: userData.profile,
                coverphoto: userData.coverphoto || "",
              },
            },
          },
        });
      } else {
        dispatch({
          type: SET_ALERTS,
          payload: {
            alerts: {
              id: currentAlertState.length,
              type: "warning",
              content: response.data.message,
            },
          },
        });
      }
      setisWaitingRequest(false);
    })
    .catch((err) => {
      console.log(err.message);
      dispatch({
        type: SET_ALERTS,
        payload: {
          alerts: {
            id: currentAlertState.length,
            type: "error",
            content: "Some fields might be invalid or already taken",
          },
        },
      });
      setisWaitingRequest(false);
    });
};

const CreateInitialConversation = async (otherEntityID: string) => {
  return await Axios.post(
    `${API}/m/crtc`,
    { otherEntityID },
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((response) => {
      if (response.data.status) {
        return response.data.conversationID;
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

const ReplyAssistRequest = async (
  conversationID: string,
  messageID: string,
) => {
  return await Axios.post(
    `${API}/prompt/reply-assist`,
    { conversationID, messageID },
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((response) => {
      if (response.data.status) {
        return response.data;
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

export {
  GetAllowedModulesRequest,
  SwitchEntityRequest,
  SwitchBackToSelfRequest,
  JoinRoomRequest,
  CreateTransportRequest,
  TransportConnectRequest,
  TransportProduceRequest,
  ConsumeRequest,
  CloseProducerRequest,
  LeaveRoomRequest,
  ParticipantStatusRequest,
  AuthCheck,
  LoginRequest,
  ThirdPartyAuthenticationRequest,
  RegisterRequest,
  LogoutRequest,
  VerifyCodeRequest,
  SearchRequest,
  EntitySearchRequest,
  SearchOverviewRequest,
  SearchPeopleRequest,
  SearchRealmsRequest,
  SearchPostsRequest,
  NetworkOverviewRequest,
  NetworkSectionRequest,
  GroupShortcutsRequest,
  JoinRealmGroupRequest,
  ContactRequest,
  NotificationInitRequest,
  NotificationsOverviewV2Request,
  NotificationsSectionV2Request,
  ReadNotificationsRequest,
  DeclineContactRequest,
  AcceptContactRequest,
  ContactsListInitRequest,
  SendMessageRequest,
  SendFilesRequest,
  InitConversationRequest,
  InitConversationListRequest,
  ContactsListReusableRequest,
  CreateGroupChatRequest,
  CreateServerRequest,
  CreateConferenceRequest,
  CreateRealmInviteRequest,
  GetRealmInviteRequest,
  UpdateRealmInviteRequest,
  SeenMessageRequest,
  CallRequest,
  ActiveContactsRequest,
  RejectCallRequest,
  EndCallRequest,
  GetProfileInfo,
  CreatePostRequest,
  GetPostRequest,
  DeleteMessageRequest,
  ReactToMessageRequest,
  SetMessageReactionRequest,
  ConversationInfoRequest,
  IsTypingBroadcastRequest,
  AddNewMemberRequest,
  InitServerListRequest,
  InitServerConversationRequest,
  InitServerChannelsRequest,
  AddNewMemberToServer,
  CreateChannelRequest,
  GetMembersListInServer,
  GetFeedRequest,
  GetPostPreviewRequest,
  NotificationOverrideRequest,
  GetFeedEmojisRequest,
  ReactionSaveRequest,
  GetReactionTotalRequest,
  CommentReactionSaveRequest,
  GetCommentReactionTotalRequest,
  GetCommentsRequest,
  SaveCommentRequest,
  DeleteCommentRequest,
  GetLinkPreviewRequest,
  PublicServersListRequest,
  LottieJSONRequest,
  GetDiaryTotalRequest,
  GetMoodListRequest,
  GetTagsListRequest,
  PostNewEntryRequest,
  GetUserEntriesRequest,
  GetEntryRequest,
  BroadcastCoordinatesRequest,
  SnapCoordinatesOpenRoute,
  UploadMediaRequest,
  VoiceRequest,
  CreatePageRequest,
  FollowRealmRequest,
  UnfollowRealmRequest,
  GetFollowRealmRequest,
  GetMyRealmsRequest,
  GetTopRealmsRequest,
  DeletePostRequest,
  UpdatePostRequest,
  SavePostRequest,
  UnsavePostRequest,
  GetSavedPostsRequest,
  UpdateRealmMediaRequest,
  UpdateRealmRequest,
  GetRealmMembersRequest,
  GetRealmFollowersRequest,
  UpdateMemberRoleRequest,
  RemoveRealmMemberRequest,
  RemoveRealmFollowersRequest,
  UpdateChatHistoryRequest,
  ManualInitConversationListRequest,
  GetEncodingsRequest,
  ReconnectStaleCallerSessionRequest,
  CompleteProfileRequest,
  GetCurrentPoliciesRequest,
  AcceptPoliciesRequest,
  ExportAccountDataRequest,
  DeleteAccountRequest,
  BlockUserRequest,
  PokeUserRequest,
  UnblockUserRequest,
  ListBlockedUsersRequest,
  ListDeviceSessionsRequest,
  RevokeDeviceSessionRequest,
  ReportUserRequest,
  UpdateProfileInfoRequest,
  InitConversationListV1Request,
  InitConversationInfoRequest,
  CreateInitialConversation,
  ReplyAssistRequest,
};
