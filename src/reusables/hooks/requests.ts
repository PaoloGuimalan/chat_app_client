/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Axios from "axios";
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
import sign from "jwt-encode";
import jwt_decode from "jwt-decode";
import { Dispatch } from "react";
import { convertLoginResponse } from "./reusable";
import { ConvertedResponse } from "../vars/types";
import { PaginationProp } from "../vars/props";
import { IContact, INewEntry } from "../vars/interfaces";
import { removeNullsFromObject } from "./validatevariables";
import envs from "./env_configs";
import { clearViewPosts, getAllViewCache } from "./localforagehelper";

const API = envs.CHATTERLOOP_API;
const USER_SERVICE_API = envs.USER_SERVICE_API;
const SECRET = envs.SECRET;

const AuthCheck = (dispatch: any) => {
  Axios.get(`${API}/auth/jwtchecker`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
  })
    .then((response) => {
      if (response.data.status) {
        const userData: any = jwt_decode(response.data.result.usertoken);
        // console.log(userData)
        dispatch({
          type: SET_AUTHENTICATION,
          payload: {
            authentication: {
              auth: true,
              user: {
                userID: userData.userID,
                fullName: {
                  firstName: userData.fullname.firstName,
                  middleName: userData.fullname.middleName,
                  lastName: userData.fullname.lastName,
                },
                email: userData.email,
                isActivated: userData.isActivated,
                isVerified: userData.isVerified,
                profile: userData.profile,
                coverphoto: userData.coverphoto || "",
              },
            },
          },
        });
      } else {
        dispatch({
          type: SET_AUTHENTICATION,
          payload: {
            authentication: {
              ...authenticationstate,
              auth: false,
            },
          },
        });
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

        dispatch({
          type: SET_AUTHENTICATION,
          payload: {
            authentication: {
              auth: true,
              user: {
                userID: userData.userID,
                fullName: {
                  firstName: userData.fullname.firstName,
                  middleName: userData.fullname.middleName,
                  lastName: userData.fullname.lastName,
                },
                email: userData.email,
                isActivated: userData.isActivated,
                isVerified: userData.isVerified,
                profile: userData.profile,
                coverphoto: userData.coverphoto || "",
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

        dispatch({
          type: SET_AUTHENTICATION,
          payload: {
            authentication: {
              auth: true,
              user: {
                userID: userData.userID,
                fullName: {
                  firstName: userData.fullname.firstName,
                  middleName: userData.fullname.middleName,
                  lastName: userData.fullname.lastName,
                },
                email: userData.email,
                isActivated: userData.isActivated,
                isVerified: userData.isVerified,
                profile: userData.profile,
                coverphoto: userData.coverphoto || "",
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

        dispatch({
          type: SET_AUTHENTICATION,
          payload: {
            authentication: {
              auth: true,
              user: {
                userID: response.data.username,
                fullName: {
                  firstName: payload.firstName,
                  middleName: payload.middleName,
                  lastName: payload.lastName,
                },
                email: payload.email,
                isActivated: true,
                isVerified: false,
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
) => {
  // `${API}/u/getContacts`
  Axios.get(
    `${USER_SERVICE_API}/api/user/contacts?page=${page}&page_size=${range}`,
    {
      headers: {
        "x-access-token": localStorage.getItem("authtoken"),
      },
    },
  )
    .then((response) => {
      const paginatedContacts: PaginationProp<IContact> = response.data;

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

const SendFilesRequest = (params: any) => {
  const payload = params;
  const encodedPayload = sign(payload, SECRET);

  Axios.post(
    `${API}/u/sendFiles`,
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

const InitConversationListRequest = async (page: number, range: number) => {
  return await Axios.get(`${API}/u/initConversationList`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
      page: page,
      range: range,
    },
  })
    .then((response) => {
      if (response.data.status) {
        const decodedResult: any = jwt_decode(response.data.result);

        // console.log(decodedResult.conversationslist)
        return decodedResult.conversationslist;
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
        return 1;
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

const GetProfileInfo = async (params: any) => {
  const userID = params.userID;

  // `${API}/p/userinfo/${userID}`
  return await Axios.get(`${USER_SERVICE_API}/api/user/auth/${userID}/`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
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

const GetPostRequest = async (params: any) => {
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

  return await Axios.get(`${API}/s/initserversetup/${conversationID}`, {
    headers: {
      "x-access-token": localStorage.getItem("authtoken"),
    },
  })
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

const CreateChannelRequest = (payloadprop: any, setisCreateGCToggle: any) => {
  const payload = payloadprop;
  const encodedPayload = sign(payload, SECRET);

  Axios.post(
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
      }
    })
    .catch((err) => {
      console.log(err);
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

        dispatch(decodedResult.members);
        setisLoading(false);

        // console.log(decodedResult.members)
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

export {
  AuthCheck,
  LoginRequest,
  ThirdPartyAuthenticationRequest,
  RegisterRequest,
  LogoutRequest,
  VerifyCodeRequest,
  SearchRequest,
  ContactRequest,
  NotificationInitRequest,
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
  GetCommentsRequest,
  SaveCommentRequest,
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
};
