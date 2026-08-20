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
import { isInAnyCall } from "./callPresence";

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

  // Close any existing stream before opening a new one. This used to just
  // reassign, leaking the previous EventSource - and there are two callers
  // (Home and ConferenceRoom), so entering a conference left TWO live
  // connections delivering every event twice. Every handler below then ran
  // twice, which showed up as duplicated API calls (notifications, contacts,
  // and the profile refresh) for a single server-side event.
  if (sseNtfsSource) {
    sseNtfsSource.close();
    sseNtfsSource = null;
  }

  sseNtfsSource = new EventSource(
    `${API}/u/sseNotifications/${encodedPayload}`,
  );

  sseNtfsSource.addEventListener("notifications", (e: any) => {
    const parsedresponse = JSON.parse(e.data);
    // console.log(parsedresponse)
    if (parsedresponse.auth) {
      if (parsedresponse.status) {
        // Deliberately does NOT relay to the profile page: this event names
        // no subject, so reacting to it reloaded whatever profile happened to
        // be open on every unrelated like, comment or follow. The addressed
        // `profile_relationship_updated` event below is the one the profile
        // listens to.

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

  // The ONLY event the profile page reacts to, because it is the only one
  // that says WHO the change was with. It is published after commit
  // (entity/services/realtime.py), so refetching on it reads settled rows -
  // the contactslist/notifications publishes happen mid-transaction and, on
  // the remove path, before purge_between() tears the follow edges down.
  //
  // Fires on contact accept, decline, remove and follow-request approval.
  //
  // Nothing is dispatched to redux: the only thing that cares is a mounted
  // profile page. If none is mounted this is a no-op, and the next visit
  // loads fresh data anyway.
  sseNtfsSource.addEventListener("profile_relationship_updated", (e: any) => {
    const parsedresponse = JSON.parse(e.data);
    if (parsedresponse.auth && parsedresponse.status) {
      // The Redis->SSE bridge forwards `message` as the frame body
      // (res.sse(data.event, data.message) in the server's redis/pubsub.js),
      // so `result` sits at the top level here, not under `message`.
      const entityID = parsedresponse.result?.entity_id;
      // No subject means nothing can be matched against, so nothing is
      // relayed - better a missed refresh than reloading an unrelated page.
      if (!entityID) return;

      document.dispatchEvent(
        new CustomEvent("profile-events-relay", {
          detail: {
            event: "profile_relationship_updated",
            entityID: String(entityID),
          },
        }),
      );
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

        // Already on a call in this tab - stay silent. Alert.tsx starts a
        // 60-second ringtone the moment this dispatches, and it was doing so
        // over live calls, voice channels and conferences alike because
        // nothing here asked. isInAnyCall covers all three surfaces;
        // callslist would only have covered the first.
        //
        // SILENT, not declined. Rejecting on the user's behalf posts
        // /rejectcall, which tells the CALLER their call was refused and
        // tears it down - so a busy laptop would cancel a call the same
        // person could have answered on their phone. The event still
        // reaches every other device on this entity's channel, and any of
        // them that is free rings normally.
        if (isInAnyCall()) {
          return;
        }

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
        // Relayed to the profile page because this event now names its
        // subject: `result.entity_id` is the OTHER party from THIS
        // recipient's point of view (user/views.py builds it per recipient).
        // Without an id nothing is relayed - an unaddressed event cannot say
        // which profile went stale, and reloading on it reloads whatever
        // page happens to be open.
        //
        // Emitted before the contacts refetch below so a throw down there
        // cannot swallow it.
        {
          const subjectID = parsedresponse.result?.entity_id;
          if (subjectID) {
            document.dispatchEvent(
              new CustomEvent("profile-events-relay", {
                detail: {
                  event: "contactslist",
                  entityID: String(subjectID),
                },
              }),
            );
          }
        }

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

        if (authentication.user.entity_id != parsedresponse.message.entityID) {
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

  // A channel was created in a server you can see. Relayed rather than
  // dispatched to redux: the only thing that cares is whichever server's
  // channel list is open, and it has to compare the id against its own.
  //
  // The channel list already refetches on `messageslist`, which is why a TEXT
  // channel showed up live - creating one writes a system message, and that
  // raises messages_list. A VOICE room has no chat history to write one into,
  // so nothing was published for it at all and the room only appeared after a
  // manual refresh. This event is published for both kinds; the duplicate for a
  // text channel costs one refetch, not a wrong list.
  sseNtfsSource.addEventListener("server_channels_changed", (e: any) => {
    const parsedresponse = JSON.parse(e.data);
    if (!parsedresponse.auth || !parsedresponse.status) return;

    const serverID = parsedresponse.result?.realm_id;
    if (!serverID) return;

    document.dispatchEvent(
      new CustomEvent("server-events-relay", {
        detail: {
          event: "server_channels_changed",
          serverID: String(serverID),
          channelID: parsedresponse.result?.channel_id
            ? String(parsedresponse.result.channel_id)
            : null,
          type: parsedresponse.result?.type ?? null,
        },
      }),
    );
  });

  // Somebody joined or was removed from a realm. Two audiences on one event:
  // the people it happened TO (whose server rail gains or loses an entry) and
  // the people who stay (whose member lists moved) - the rail listener checks
  // `entity_ids` against the acting entity to tell them apart.
  //
  // Joining a server writes membership rows and nothing else, so before this
  // the rail only moved on a full reload.
  sseNtfsSource.addEventListener("realm_membership_changed", (e: any) => {
    const parsedresponse = JSON.parse(e.data);
    if (!parsedresponse.auth || !parsedresponse.status) return;

    const realmID = parsedresponse.result?.realm_id;
    if (!realmID) return;

    document.dispatchEvent(
      new CustomEvent("server-events-relay", {
        detail: {
          event: "realm_membership_changed",
          realmID: String(realmID),
          realmType: parsedresponse.result?.type ?? null,
          action: parsedresponse.result?.action ?? null,
          entityIDs: Array.isArray(parsedresponse.result?.entity_ids)
            ? parsedresponse.result.entity_ids.map((id: any) => String(id))
            : [],
        },
      }),
    );
  });

  sseNtfsSource.addEventListener("removed_user_notif", (e: any) => {
    const data = JSON.parse(e.data);

    // Losing a realm is a membership change too, and it is the only half of one
    // that has ever been published. Relayed on the same channel as the join so
    // the rail has ONE listener rather than two that must agree.
    document.dispatchEvent(
      new CustomEvent("server-events-relay", {
        detail: {
          event: "realm_membership_changed",
          realmID: String(data.result?.realm_id ?? ""),
          realmType: data.result?.type ?? null,
          action: "removed",
          // The event is published per removed member to their own channel, so
          // its arrival already means it happened to whoever is reading it.
          entityIDs: data.result?.entityID ? [String(data.result.entityID)] : [],
        },
      }),
    );

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
    // Cleared so a later SSENotificationsTRequest() does not try to close an
    // already-closed handle, and so "is a stream open?" stays answerable.
    sseNtfsSource = null;
  }
};

export { SSENotificationsTRequest, CloseSSENotifications };
