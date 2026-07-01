/* eslint-disable @typescript-eslint/no-explicit-any */
import sign from "jwt-encode";
import jwt_decode from "jwt-decode";
import {
  REMOVE_PREVIEW_PARTICIPANT,
  SET_ALERTS,
  SET_COORDINATES,
  // SET_CONTACTS_LIST_OVERRIDE,
  SET_IS_TYPING_LIST,
  SET_MESSAGES_LIST_OVERRIDE,
  // SET_NOTIFICATIONS_LIST,
  // SET_NOTIFICATIONS_LIST_OVERRIDE,
  SET_PENDING_CALL_ALERTS,
  SET_PREVIEW_PARTICIPANTS,
  SET_PREVIEW_PARTICIPANTS_BULK,
  SET_REJECTED_CALL_LIST,
  UPDATE_ACTIVE_USERS_LIST,
} from "../../redux/types";
import message_ringtone from "../../assets/sounds/message_alert.mp3";
import notification_ringtone from "../../assets/sounds/notification_alert.mp3";
import seen_rightone from "../../assets/sounds/seen_alert.mp3";
// import chatterloop_icon from "../../assets/imgs/chatterloop.png";
import { Dispatch } from "react";
import {
  ContactsListInitRequest,
  InitConversationListRequest,
  NotificationOverrideRequest,
} from "./requests";
import envs from "./env_configs";

const API = envs.CHATTERLOOP_API;
const SECRET = envs.SECRET;

let sseNtfsSource: any = null;

const SSENotificationsTRequest = (
  dispatch: Dispatch<any>,
  currentAlertState: any,
  authentication: any,
) => {
  const payload = {
    token: localStorage.getItem("authtoken"),
    deviceToken: localStorage.getItem("device"),
    type: "notifications",
  };

  const encodedPayload = sign(payload, SECRET);

  sseNtfsSource = new EventSource(
    `${API}/u/sseNotifications/${encodedPayload}`,
  );

  sseNtfsSource.addEventListener("notifications", (e: any) => {
    const parsedresponse = JSON.parse(e.data);
    // console.log(parsedresponse)
    if (parsedresponse.auth) {
      if (parsedresponse.status) {
        // const decodedResult: any = jwt_decode(parsedresponse.result);
        // console.log(decodedResult)
        //play ringtone
        const audioMessage = new Audio(notification_ringtone);
        audioMessage.play();

        // dispatch({
        //   type: SET_NOTIFICATIONS_LIST,
        //   payload: {
        //     notficationslist: {
        //       list: decodedResult.notifications,
        //       totalunread: decodedResult.totalunread,
        //     },
        //   },
        // });

        NotificationOverrideRequest(1, 10, dispatch, (bool: boolean) => {
          return bool;
        });

        dispatch({
          type: SET_ALERTS,
          payload: {
            alerts: {
              id: currentAlertState.length,
              type: "info",
              content: parsedresponse.message,
            },
          },
        });
      }
    }
  });

  sseNtfsSource.addEventListener("coordinates_broadcast", (e: any) => {
    const parsedresponse = JSON.parse(e.data);
    if (parsedresponse.auth) {
      if (parsedresponse.status) {
        const decodedResult: any = jwt_decode(parsedresponse.result);

        dispatch({
          type: SET_COORDINATES,
          payload: {
            coordinates: decodedResult,
          },
        });
      }
    }
  });

  sseNtfsSource.addEventListener("notifications_reload", (e: any) => {
    const parsedresponse = JSON.parse(e.data);
    // console.log(parsedresponse)
    if (parsedresponse.auth) {
      if (parsedresponse.status) {
        // const decodedResult: any = jwt_decode(parsedresponse.result);

        // dispatch({
        //   type: SET_NOTIFICATIONS_LIST_OVERRIDE,
        //   payload: {
        //     notficationslist: {
        //       list: decodedResult.notifications,
        //       totalunread: decodedResult.totalunread,
        //     },
        //   },
        // });

        NotificationOverrideRequest(1, 10, dispatch, (bool: boolean) => {
          return bool;
        });
      }
    }
  });

  sseNtfsSource.addEventListener("istyping_broadcast", (e: any) => {
    const parsedresponse = JSON.parse(e.data);
    // console.log(parsedresponse)
    if (parsedresponse.auth) {
      if (parsedresponse.status) {
        const decodedResult: any = jwt_decode(parsedresponse.result);

        dispatch({
          type: SET_IS_TYPING_LIST,
          payload: {
            istyping: decodedResult.istyping,
          },
        });

        // console.log(decodedResult.istyping);
      }
    }
  });

  sseNtfsSource.addEventListener("incomingcall", (e: any) => {
    const parsedresponse = JSON.parse(e.data);
    if (parsedresponse.auth) {
      if (parsedresponse.status) {
        const decodedResult: any = jwt_decode(parsedresponse.result);
        const randomID = Math.random() * (2000 - 1 + 1) + 1;
        //play ringtone

        dispatch({
          type: SET_ALERTS,
          payload: {
            alerts: {
              id: randomID,
              type: "incomingcall",
              content: parsedresponse.message,
              callmetadata: decodedResult.callmetadata,
            },
          },
        });

        dispatch({
          type: SET_PENDING_CALL_ALERTS,
          payload: {
            pendingcallalerts: {
              callID: decodedResult.callmetadata.conversationID,
            },
          },
        });
      }
    }
  });

  sseNtfsSource.addEventListener("callreject", (e: any) => {
    const parsedresponse = JSON.parse(e.data);
    if (parsedresponse.auth) {
      if (parsedresponse.status) {
        const decodedResult: any = jwt_decode(parsedresponse.result);
        const conversationID: any = decodedResult.rejectdata.conversationID;

        // console.log("ERR REJ END", decodedResult);

        dispatch({
          type: SET_REJECTED_CALL_LIST,
          payload: {
            callID: conversationID,
          },
        });

        document.dispatchEvent(
          new CustomEvent("room-events-relay", {
            detail: {
              event: "callreject",
              data: JSON.stringify(decodedResult.rejectdata),
            },
          }),
        );
      }
    }
  });

  sseNtfsSource.addEventListener("contactslist", (e: any) => {
    const parsedresponse = JSON.parse(e.data);
    if (parsedresponse.auth) {
      if (parsedresponse.status) {
        // const decodedResult: any = jwt_decode(parsedresponse.result);
        //play ringtone
        // dispatch({
        //   type: SET_CONTACTS_LIST_OVERRIDE,
        //   payload: {
        //     contactslist: decodedResult.contacts,
        //   },
        // });
        ContactsListInitRequest(1, 50, true, dispatch, (bool: boolean) => {
          return bool;
        });
      }
    }
  });

  sseNtfsSource.addEventListener("messages_list", (e: any) => {
    const parsedresponse = JSON.parse(e.data);
    if (parsedresponse.auth) {
      if (parsedresponse.status) {
        InitConversationListRequest(1, 20).then((response) => {
          dispatch({
            type: SET_MESSAGES_LIST_OVERRIDE,
            payload: {
              messageslist: response.items,
            },
          });
        });

        if (parsedresponse.message.mentioner) {
          // {
          //   entityID: sender,
          //   username: `@${username}`,
          //   realmName: realmName,
          //   isSingle: decodedToken.conversationType === "single",
          // }

          const mention = parsedresponse.message.mentioner;

          const audioMessage = new Audio(notification_ringtone);
          audioMessage.play();

          dispatch({
            type: SET_ALERTS,
            payload: {
              alerts: {
                id: currentAlertState.length,
                type: "info",
                content: mention.isSingle
                  ? `${mention.username} mentioned you`
                  : `${mention.username} mentioned you at ${mention.realmName}`,
              },
            },
          });
        }

        if (parsedresponse.message.deletedMessageID) {
          document.dispatchEvent(
            new CustomEvent(parsedresponse.message.conversationID, {
              detail: {
                event: "reload_deleted_message",
                data: parsedresponse,
              },
            }),
          );
        } else {
          document.dispatchEvent(
            new CustomEvent(parsedresponse.message.conversationID, {
              detail: {
                event: "reload",
                data: parsedresponse,
              },
            }),
          );
        }

        if (authentication.user.entityID != parsedresponse.message.entityID) {
          if (parsedresponse.onseen) {
            //play ringtone
            setTimeout(() => {
              const audioMessage = new Audio(seen_rightone);
              audioMessage.play();
            }, 1500);
          } else {
            //play ringtone
            setTimeout(() => {
              const audioMessage = new Audio(message_ringtone);
              audioMessage.play();
            }, 1500);
          }
        }
      }
    }
  });

  sseNtfsSource.addEventListener("active_users", (e: any) => {
    const parsedresponse = JSON.parse(e.data);
    if (parsedresponse.auth) {
      if (parsedresponse.status) {
        const decodedResult: any = jwt_decode(parsedresponse.result);

        // console.log(decodedResult.user);
        dispatch({
          type: UPDATE_ACTIVE_USERS_LIST,
          payload: {
            updatedUser: decodedResult.user,
          },
        });
      }
    }
  });

  sseNtfsSource.addEventListener("voice-joined", (e: any) => {
    const parsedresponse = JSON.parse(e.data);
    if (parsedresponse.auth) {
      if (parsedresponse.status) {
        const decodedResult: any = jwt_decode(parsedresponse.result);

        dispatch({
          type: SET_PREVIEW_PARTICIPANTS,
          payload: {
            previewparticipant: decodedResult.voice_participant,
          },
        });
      }
    }
  });

  sseNtfsSource.addEventListener("join-room-response", (e: any) => {
    document.dispatchEvent(
      new CustomEvent("room-events-relay", {
        detail: {
          event: "join-room-response",
          data: e.data,
        },
      }),
    );
  });

  sseNtfsSource.addEventListener("create-transport-response", (e: any) => {
    document.dispatchEvent(
      new CustomEvent("room-events-relay", {
        detail: {
          event: "create-transport-response",
          data: e.data,
        },
      }),
    );
  });

  sseNtfsSource.addEventListener("transport-connect-response", (e: any) => {
    document.dispatchEvent(
      new CustomEvent("room-events-relay", {
        detail: {
          event: "transport-connect-response",
          data: e.data,
        },
      }),
    );
  });

  sseNtfsSource.addEventListener("produce-response", (e: any) => {
    document.dispatchEvent(
      new CustomEvent("room-events-relay-produce", {
        detail: {
          event: "produce-response",
          data: e.data,
        },
      }),
    );
  });

  sseNtfsSource.addEventListener("new_producer", (e: any) => {
    document.dispatchEvent(
      new CustomEvent("room-events-relay", {
        detail: {
          event: "new_producer",
          data: e.data,
        },
      }),
    );
  });

  sseNtfsSource.addEventListener("participant-joined", (e: any) => {
    document.dispatchEvent(
      new CustomEvent("room-events-relay", {
        detail: {
          event: "participant-joined",
          data: e.data,
        },
      }),
    );
  });

  sseNtfsSource.addEventListener("participant-left", (e: any) => {
    document.dispatchEvent(
      new CustomEvent("room-events-relay", {
        detail: {
          event: "participant-left",
          data: e.data,
        },
      }),
    );
  });

  sseNtfsSource.addEventListener("update_participants", (e: any) => {
    const data = JSON.parse(e.data);

    if (data.result.action === "left") {
      dispatch({
        type: REMOVE_PREVIEW_PARTICIPANT,
        payload: {
          previewparticipant: {
            clientID: data.result.clientId,
          },
        },
      });
    }
  });

  sseNtfsSource.addEventListener("participant-status", (e: any) => {
    document.dispatchEvent(
      new CustomEvent("room-events-relay", {
        detail: {
          event: "participant-status",
          data: e.data,
        },
      }),
    );
  });

  sseNtfsSource.addEventListener("producer-closed", (e: any) => {
    document.dispatchEvent(
      new CustomEvent("room-events-relay", {
        detail: {
          event: "producer-closed",
          data: e.data,
        },
      }),
    );
  });

  sseNtfsSource.addEventListener("consume-response", (e: any) => {
    document.dispatchEvent(
      new CustomEvent("room-events-relay", {
        detail: {
          event: "consume-response",
          data: e.data,
        },
      }),
    );
  });

  sseNtfsSource.addEventListener("consume-transport-error", (e: any) => {
    console.log("consume-transport-error", e.data);
    document.dispatchEvent(
      new CustomEvent("room-events-relay", {
        detail: {
          event: "consume-transport-error",
          data: e.data,
        },
      }),
    );
  });

  sseNtfsSource.addEventListener("consume-error", (e: any) => {
    document.dispatchEvent(
      new CustomEvent("room-events-relay", {
        detail: {
          event: "consume-error",
          data: e.data,
        },
      }),
    );
  });

  sseNtfsSource.addEventListener("conference_requests_changed", (e: any) => {
    document.dispatchEvent(
      new CustomEvent("room-events-relay", {
        detail: {
          event: "conference_requests_changed",
          data: e.data,
        },
      }),
    );
  });

  sseNtfsSource.addEventListener("conference_members_changed", (e: any) => {
    document.dispatchEvent(
      new CustomEvent("room-events-relay", {
        detail: {
          event: "conference_members_changed",
          data: e.data,
        },
      }),
    );
  });

  sseNtfsSource.addEventListener("conference_access_changed", (e: any) => {
    document.dispatchEvent(
      new CustomEvent("room-events-relay", {
        detail: {
          event: "conference_access_changed",
          data: e.data,
        },
      }),
    );
  });

  sseNtfsSource.addEventListener("removed_user_notif", (e: any) => {
    const data = JSON.parse(e.data);

    InitConversationListRequest(1, 10).then((response) => {
      dispatch({
        type: SET_PREVIEW_PARTICIPANTS_BULK,
        payload: {
          participants: response.conversationslist
            .map((mp: any) => mp.voice_participants)
            .flat(),
        },
      });
      dispatch({
        type: SET_MESSAGES_LIST_OVERRIDE,
        payload: {
          messageslist: response.items,
        },
      });
    });

    document.dispatchEvent(
      new CustomEvent(data.result.realm_id, {
        detail: {
          event: "removed_user_notif",
          data: data,
        },
      }),
    );
  });
};

const CloseSSENotifications = () => {
  if (sseNtfsSource) {
    sseNtfsSource.close();
  }
};

export { SSENotificationsTRequest, CloseSSENotifications };
