/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import "../../styles/styles.css";
import { AnimatePresence, motion } from "framer-motion";
// import { RxEnterFullScreen } from "react-icons/rx";
import {
  BsFillMicFill,
  BsFillMicMuteFill,
  BsCameraVideoFill,
  BsCameraVideoOffFill,
  BsFillChatDotsFill,
} from "react-icons/bs";
import { MdScreenShare, MdStopScreenShare } from "react-icons/md";
import { HiPhoneMissedCall } from "react-icons/hi";
import { IoMdClose } from "react-icons/io";
import { FiUsers, FiCheck, FiX } from "react-icons/fi";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
// import { END_CALL_LIST } from "@/redux/types";
import ConversationV2 from "../tabs/messenger/ConversationV2";
import { Device } from "mediasoup-client";
import {
  ConsumeRequest,
  CreateTransportRequest,
  EndCallRequest,
  JoinRoomRequest,
  LeaveRoomRequest,
  ParticipantStatusRequest,
  CloseProducerRequest,
  TransportConnectRequest,
  TransportProduceRequest,
  VoiceRequest,
  GetEncodingsRequest,
  GetRealmInviteRequest,
  UpdateRealmInviteRequest,
  GetRealmMembersRequest,
  UpdateMemberRoleRequest,
  RemoveRealmMemberRequest,
} from "@/reusables/hooks/requests";
import { AuthenticationInterface } from "@/reusables/vars/interfaces";
import ConfirmModal from "@/app/widgets/modals/ConfirmModal";
import { removeMemberPrompt } from "@/app/widgets/modals/confirmPrompts";
import {
  buildCallTiles,
  CallStage,
  RemoteAudio,
} from "../absolutes/calls_v2/stage";
import envs from "@/reusables/hooks/env_configs";
import { useNavigate } from "react-router-dom";
import { useReconnect } from "@/reusables/hooks/useReconnect";
import { useCallPresence } from "@/reusables/hooks/callPresence";
import { Avatar, useTheme } from "@/reusables/design";
import { notifyRequestError } from "@/reusables/hooks/errormessages";
import InvitePeople from "@/app/widgets/invites/InvitePeople";
import MemberActionsMenu from "./MemberActionsMenu";
import { useConferenceIdentity } from "./identity";

// The chat panel's accent - the one it always had.
const CONFERENCE_CHAT_THEME = { primary: "#4994ec", lighten: "#82b6ec" };

// The chat / People drawer beside the call.
const SIDE_PANEL_W = 360;
const DRAWER_TRANSITION = { duration: 0.3, ease: [0.2, 0, 0, 1] };
// Swapping chat for People (or back) inside the open drawer.
const PANEL_SWAP = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 16 },
  transition: { duration: 0.2, ease: [0.2, 0, 0, 1] },
};

type ConferenceMember = {
  member_id: string;
  account_id: string;
  entityID: string;
  username: string;
  name: string;
  profile: string | undefined;
  type: string;
  role: string;
};

// The owner's and admins' label in the People panel. The owner had none, so
// it read as an ordinary member - and was offered "Promote to Admin".
function RoleBadge({ role }: { role: string | undefined }) {
  if (role !== "owner" && role !== "admin") return null;
  return (
    <span className="tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-[0.04em] tw-text-[var(--brand)] tw-bg-[var(--brand-soft)] tw-rounded-full tw-px-[6px] tw-py-[2px] tw-flex-shrink-0">
      {role === "owner" ? "Owner" : "Admin"}
    </span>
  );
}

function ConferenceVoiceWindow({
  data,
  realmId,
  canManageRequests,
  selfUsername,
}: any) {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );

  const { theme: conferenceTheme } = useTheme();
  // You in this call: yourself, or the page you are switched into - see
  // identity.ts. The call, the member list and the People panel all key on it.
  const me = useConferenceIdentity();

  const navigate = useNavigate();

  const [mediaStream, setmediaStream] = useState<MediaStream | null>(null);
  const [device, setDevice] = useState<any>(null);

  const [enableMic, setenableMic] = useState<boolean>(
    data.initialEnableMic ?? true,
  );
  const [enableCamera, setenableCamera] = useState<boolean>(
    data.initialEnableCamera ?? (data.type || data.callType) === "video",
  );

  const [connectTransportState, setconnectTransportState] = useState<any>({
    params: null,
    instance: null,
    triggered: false,
  });
  const [connectRecvTransportState, setconnectRecvTransportState] =
    useState<any>({
      params: null,
      instance: null,
      triggered: false,
    });

  const [sendTransport, setSendTransport] = useState<any>(null);
  const [recvTransport, setRecvTransport] = useState<any>(null);
  const [pendingConsumeResponses, setPendingConsumeResponses] = useState<any[]>(
    [],
  );
  const [consumers, setConsumers] = useState<Map<string, any>>(new Map());
  // entityID is the server's - the acting entity from each participant's own
  // token - where the username is only what their client sent. It is what
  // a participant is matched to a member by; the username is the fallback
  // for a server that does not send it yet.
  const [joinedParticipants, setJoinedParticipants] = useState<
    { clientId: string; username: string; entityID?: string | null }[]
  >([]);
  const [pendingProducerIds, setPendingProducerIds] = useState<string[]>([]);
  const [participantStatuses, setParticipantStatuses] = useState<
    Map<string, { muted: boolean; cameraOff: boolean }>
  >(new Map());
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isPeopleOpen, setIsPeopleOpen] = useState<boolean>(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState<boolean>(false);
  const [updatingRequestToken, setUpdatingRequestToken] = useState<
    string | null
  >(null);
  // Everyone in the conference, joined to the call or not, with their role.
  // The People panel lists them all (those not in the call yet drawn pale),
  // and it is the ONE copy of each member's role: badges, menus and "may I
  // manage" all read it, so a promote, demote or removal reaches them all at
  // once. Roles used to sit in a second map as well, and those changes only
  // ever updated one of the two.
  const [conferenceMembers, setConferenceMembers] = useState<
    ConferenceMember[]
  >([]);
  const [membersLoaded, setMembersLoaded] = useState<boolean>(false);
  const [updatingRoleFor, setUpdatingRoleFor] = useState<string | null>(null);
  // Members by entity - how participants, your own row and every action find
  // them - and by the username the call knows them by, as a fallback.
  const memberByEntity = useMemo(
    () => new Map(conferenceMembers.map((member) => [member.entityID, member])),
    [conferenceMembers],
  );
  const memberRoleMap = useMemo(
    () =>
      new Map(
        conferenceMembers
          .filter((member) => member.username)
          .map((member) => [member.username, member]),
      ),
    [conferenceMembers],
  );
  const selfRoleFromList = (
    memberByEntity.get(me.entityID) ?? memberRoleMap.get(me.handle)
  )?.role;
  // Owners and admins manage. Once the member list has your row it decides -
  // refetched on every membership change, so a host demoted mid-call loses
  // the controls and one promoted gains them. Until then, the room info read
  // on joining (which was all this ever read, and it never changed). The
  // owner counts too: only "admin" was checked here.
  const effectiveCanManage =
    membersLoaded && selfRoleFromList
      ? selfRoleFromList === "owner" || selfRoleFromList === "admin"
      : Boolean(canManageRequests);
  // The server's rule for role changes and removals (entity/permissions.py,
  // as RealmMembers applies it): only the owner may act on an admin or the
  // owner - an admin's attempt is refused. So an admin gets the menu on
  // members only, and nobody gets it on the owner.
  const viewerIsOwner = selfRoleFromList === "owner";
  const canActOnRole = (role: string | undefined) =>
    role !== "owner" && (viewerIsOwner || role !== "admin");
  const hasLeftRef = useRef(false);
  const hasJoinedRef = useRef(false);
  const isConsumingRef = useRef(false);
  const producerOwnerRef = useRef<Map<string, string>>(new Map());
  const producerSourceRef = useRef<Map<string, string>>(new Map());
  const leaveCallProcessRef = useRef<any>(null);
  const pendingProduceTracksRef = useRef<
    { kind: string; track: MediaStreamTrack; source?: string }[]
  >([]);
  const clientIdRef = useRef<string>(
    (() => {
      // 1. Safe guard check for Server-Side Rendering (SSR) / Window context
      if (typeof window !== "undefined") {
        const savedDevice = localStorage.getItem("device");
        if (savedDevice) return savedDevice;
      }

      // 2. Fallback identifier generator
      return typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    })(), // <--- Added () here to invoke the function immediately
  );

  const audioProducerRef = useRef<any>(null);
  const videoProducerRef = useRef<any>(null);

  // The mic and camera FOLLOW enableMic / enableCamera: applied whenever the
  // state changes, and again whenever a producer is created (startStreaming
  // reads the refs below). The buttons used to pause/resume the producer
  // themselves, which did nothing while there was no producer yet - muting
  // while the call was still connecting, or joining muted, changed only the
  // icon. The producer was then created live: shown muted, heard by everyone,
  // until an unmute and mute again finally reached it.
  const enableMicRef = useRef(enableMic);
  enableMicRef.current = enableMic;
  const enableCameraRef = useRef(enableCamera);
  enableCameraRef.current = enableCamera;

  useEffect(() => {
    // The track as well as the producer, so a muted mic is silent even before
    // there is a producer - and a producer created on a disabled track starts
    // paused.
    mediaStream?.getAudioTracks().forEach((track) => {
      track.enabled = enableMic;
    });
    const producer = audioProducerRef.current;
    if (!producer || producer.closed) return;
    if (enableMic) {
      producer.resume();
    } else {
      producer.pause();
    }
  }, [enableMic, mediaStream]);

  useEffect(() => {
    const producer = videoProducerRef.current;
    if (!producer || producer.closed) return;
    if (enableCamera) {
      producer.resume();
    } else {
      producer.pause();
    }
  }, [enableCamera]);
  const screenProducerRef = useRef<any>(null);
  const screenAudioProducerRef = useRef<any>(null);
  const encodingsRef = useRef<{ camera: any[]; screenshare: any[] } | null>(
    null,
  );
  const isReconnectingRef = useRef(false);

  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );

  const isMobileView = useMemo(
    () => screensizelistener.W < 800,
    [screensizelistener],
  );

  const conversationID = useMemo(
    () => data.conversationID || data.conversationid,
    [data],
  );

  // Third of the three call surfaces - see callPresence.ts. A conference is
  // the one you are least likely to want interrupted.
  useCallPresence(conversationID);

  const isGroupCall = useMemo(
    () => data.isGroup ?? data.conversationType === "group",
    [data],
  );
  const members = useMemo(() => {
    if (!isGroupCall) {
      const candidateMembers = [
        data.userdetails?.entityID,
        data.caller?.entityID,
        ...(Array.isArray(data.recepients) ? data.recepients : []),
      ].filter(Boolean) as string[];

      return Array.from(new Set(candidateMembers)).filter(
        (flt: string) => flt !== me.entityID,
      );
    } else {
      return (data.groupdetails?.receivers || data.recepients || []).filter(
        (flt: string) => flt !== me.entityID,
      );
    }
  }, [data, authentication, isGroupCall]);

  // The chat panel is the same thread every other conversation uses
  // (ConversationV2), so it moves and reads like one - the slide-in, the
  // pending sends with their reply preview, the composer strips, the senders'
  // faces. This is only what it falls back to while the room has no messages:
  // the server has no conversation to describe until the first one is sent.
  const conferenceFallbackSetup = useMemo(
    () => ({
      _id: conversationID,
      conversationID: conversationID,
      conversationType: "conference",
      participant_ids: data.groupdetails?.receivers || data.recepients || members,
      createdAt: null,
      updatedAt: null,
      details: {
        id: conversationID,
        entity_id: data.groupdetails?.entityID ?? "",
        username: data.groupdetails?.slug ?? null,
        display_name:
          data.groupdetails?.groupName || data.callDisplayName || "Conference",
        profile: data.groupdetails?.profile ?? "none",
        privacy: false,
        realm_type: "conference",
      },
      voice_participants: [],
    }),
    [conversationID, data, members],
  );

  const fetchPendingRequests = useCallback(
    (showLoader = false) => {
      if (!realmId || !effectiveCanManage) {
        return;
      }
      if (showLoader) {
        setRequestsLoading(true);
      }
      GetRealmInviteRequest({
        realm_id: realmId,
        kind: "request",
        status: "pending",
      })
        .then((response) => {
          const result = response?.result;
          setPendingRequests(Array.isArray(result) ? result : []);
        })
        .catch((err) => {
          console.log("Failed to load join requests:", err);
        })
        .finally(() => {
          if (showLoader) {
            setRequestsLoading(false);
          }
        });
    },
    [realmId, effectiveCanManage],
  );

  const resolveRequest = useCallback(
    async (inviteToken: string, nextStatus: "accepted" | "declined") => {
      if (!inviteToken || updatingRequestToken) {
        return;
      }
      setUpdatingRequestToken(inviteToken);
      try {
        await UpdateRealmInviteRequest({
          invite_token: inviteToken,
          status: nextStatus,
        });
        setPendingRequests((prev) =>
          prev.filter((req) => req.invite_token !== inviteToken),
        );
      } catch (err) {
        console.log("Failed to update join request:", err);
        notifyRequestError(
          err,
          nextStatus === "accepted"
            ? "We couldn't admit that person."
            : "We couldn't decline that request.",
        );
        fetchPendingRequests();
      } finally {
        setUpdatingRequestToken(null);
      }
    },
    [updatingRequestToken, fetchPendingRequests],
  );

  // Load the current pending requests once for hosts/admins; realtime
  // additions afterwards arrive via SSE (see the listener below).
  useEffect(() => {
    if (!effectiveCanManage || !realmId) {
      return;
    }
    fetchPendingRequests(true);
  }, [effectiveCanManage, realmId]);

  // Realtime: the pending-requests list changed; refetch the full list.
  // The SSE is only a signal — it carries no request data.
  useEffect(() => {
    if (!effectiveCanManage) {
      return;
    }

    const handler = (event: any) => {
      if (event.detail?.event !== "conference_requests_changed") {
        return;
      }

      let payload: any;
      try {
        payload = JSON.parse(event.detail.data);
      } catch {
        return;
      }

      if (
        realmId &&
        payload?.realm_id &&
        String(payload.realm_id) !== String(realmId)
      ) {
        return;
      }

      fetchPendingRequests();
    };

    document.addEventListener("room-events-relay", handler);
    return () => {
      document.removeEventListener("room-events-relay", handler);
    };
  }, [effectiveCanManage, realmId, fetchPendingRequests]);

  const fetchMemberRoles = useCallback(() => {
    if (!realmId) {
      return;
    }
    GetRealmMembersRequest(realmId, 1, 200)
      .then((response) => {
        const results = response?.results;
        if (!Array.isArray(results)) {
          return;
        }
        setConferenceMembers(
          results
            .filter((member: any) => member?.entity?.id)
            .map((member: any) => {
              const d = member.entity.details ?? {};
              const fullName = [d.first_name, d.last_name]
                .filter((part: any) => part && part !== "N/A")
                .join(" ")
                .trim();
              const picture =
                d.profile && d.profile !== "none" && d.profile !== "N/A"
                  ? d.profile
                  : undefined;
              return {
                member_id: member.member_id,
                account_id: d.id,
                entityID: String(member.entity.id),
                username: d.username || d.slug || "",
                name: fullName || d.name || d.username || d.slug || "Someone",
                profile: picture,
                type: member.entity.type,
                role: String(member.role || "member").toLowerCase(),
              };
            }),
        );
        setMembersLoaded(true);
      })
      .catch((err) => {
        console.log("Failed to load realm members:", err);
      });
  }, [realmId]);

  // Every participant loads the member list so admin labels render for all,
  // and so a promoted user can derive their own new admin status from it.
  useEffect(() => {
    if (!realmId) {
      return;
    }
    fetchMemberRoles();
  }, [realmId]);

  // Keyed by entity, not username: a page member has a slug or nothing.
  const changeMemberRole = useCallback(
    async (entityID: string, nextRole: "admin" | "member") => {
      const member = memberByEntity.get(entityID);
      if (!member || updatingRoleFor) {
        return;
      }
      setUpdatingRoleFor(entityID);
      // Optimistic update; SSE will reconcile across all clients.
      setConferenceMembers((prev) =>
        prev.map((entry) =>
          entry.entityID === entityID ? { ...entry, role: nextRole } : entry,
        ),
      );
      try {
        await UpdateMemberRoleRequest(realmId, member.member_id, nextRole);
      } catch (err) {
        console.log("Failed to update member role:", err);
        notifyRequestError(err, "We couldn't change that member's role.");
        // Revert on failure.
        setConferenceMembers((prev) =>
          prev.map((entry) =>
            entry.entityID === entityID
              ? { ...entry, role: member.role }
              : entry,
          ),
        );
      } finally {
        setUpdatingRoleFor(null);
      }
    },
    [memberByEntity, updatingRoleFor, realmId],
  );

  // Removing someone from the call drops their realm membership too, so it
  // is not "mute for now" - it confirms first, like every other removal.
  const [pendingRemoval, setPendingRemoval] = useState<string | null>(null);

  const removeParticipant = useCallback(
    async (entityID: string) => {
      const member = memberByEntity.get(entityID);
      if (!member || updatingRoleFor) {
        return;
      }
      setUpdatingRoleFor(entityID);
      try {
        // Removes realm membership and pushes a realtime removal notice to
        // the target, whose client then leaves the call (see eject listener).
        await RemoveRealmMemberRequest(realmId, [member.entityID]);
        setConferenceMembers((prev) =>
          prev.filter((entry) => entry.entityID !== entityID),
        );
      } catch (err) {
        console.log("Failed to remove participant:", err);
        notifyRequestError(err, "We couldn't remove that participant.");
      } finally {
        setUpdatingRoleFor(null);
      }
    },
    [memberByEntity, updatingRoleFor, realmId],
  );

  // Realtime: this user was removed from the realm; leave the call.
  useEffect(() => {
    const eventNames = Array.from(
      new Set([realmId, conversationID].filter(Boolean)),
    ) as string[];
    if (eventNames.length === 0) {
      return;
    }

    const handler = (event: any) => {
      if (event.detail?.event === "removed_user_notif") {
        leaveCallProcessRef.current?.();
      }
    };

    eventNames.forEach((name) => document.addEventListener(name, handler));
    return () => {
      eventNames.forEach((name) => document.removeEventListener(name, handler));
    };
  }, [realmId, conversationID]);

  // Realtime: the members list changed (role/add/remove); every participant
  // refetches so admin labels stay accurate and a promoted user picks up
  // their new role. The SSE is only a signal — it carries no member data.
  useEffect(() => {
    const handler = (event: any) => {
      if (event.detail?.event !== "conference_members_changed") {
        return;
      }

      let payload: any;
      try {
        payload = JSON.parse(event.detail.data);
      } catch {
        return;
      }

      if (
        realmId &&
        payload?.realm_id &&
        String(payload.realm_id) !== String(realmId)
      ) {
        return;
      }

      fetchMemberRoles();
    };

    document.addEventListener("room-events-relay", handler);
    return () => {
      document.removeEventListener("room-events-relay", handler);
    };
  }, [realmId, fetchMemberRoles]);

  const dispatch = useDispatch();

  const cleanupLocalCallResources = useCallback(() => {
    mediaStream?.getTracks().forEach((track) => track.stop());
    screenStream?.getTracks().forEach((track) => track.stop());
    sendTransport?.close?.();
    recvTransport?.close?.();
    consumers.forEach(({ consumer }) => consumer?.close?.());
    setConsumers(new Map());
    setPendingProducerIds([]);
    setPendingConsumeResponses([]);
    setJoinedParticipants([]);
    setParticipantStatuses(new Map());
    producerOwnerRef.current.clear();
    producerSourceRef.current.clear();
    audioProducerRef.current?.close?.();
    videoProducerRef.current?.close?.();
    screenProducerRef.current?.close?.();
    screenAudioProducerRef.current?.close?.();
    audioProducerRef.current = null;
    videoProducerRef.current = null;
    screenProducerRef.current = null;
    screenAudioProducerRef.current = null;
    pendingProduceTracksRef.current = [];
    setScreenStream(null);
    setIsScreenSharing(false);
  }, [mediaStream, screenStream, sendTransport, recvTransport, consumers]);

  const cleanupTransportsOnly = useCallback(() => {
    sendTransport?.close?.();
    recvTransport?.close?.();
    consumers.forEach(({ consumer }) => consumer?.close?.());
    setConsumers(new Map());
    setPendingProducerIds([]);
    setPendingConsumeResponses([]);
    producerOwnerRef.current.clear();
    producerSourceRef.current.clear();
    audioProducerRef.current?.close?.();
    videoProducerRef.current?.close?.();
    audioProducerRef.current = null;
    videoProducerRef.current = null;
    pendingProduceTracksRef.current = [];
    setSendTransport(null);
    setRecvTransport(null);
    setDevice(null);
    setconnectTransportState({
      params: null,
      instance: null,
      triggered: false,
    });
    setconnectRecvTransportState({
      params: null,
      instance: null,
      triggered: false,
    });
  }, [sendTransport, recvTransport, consumers]);

  const rejoinRoom = useCallback(() => {
    hasJoinedRef.current = false;
    isReconnectingRef.current = true;
    JoinRoomRequest({
      conversationID,
      members,
      instance:
        connectTransportState.instance ||
        connectRecvTransportState.instance ||
        data.instance,
      clientId: clientIdRef.current,
      username: me.handle,
      muted: !enableMic,
      cameraOff: !enableCamera,
    }).finally(() => {
      hasJoinedRef.current = true;
      isReconnectingRef.current = false;
    });
  }, [
    conversationID,
    members,
    connectTransportState.instance,
    connectRecvTransportState.instance,
    data.instance,
    me.handle,
    enableMic,
    enableCamera,
  ]);

  const leaveCallProcess = useCallback(
    ({
      keepalive = false,
      unmounting = false,
    }: { keepalive?: boolean; unmounting?: boolean } = {}) => {
      if (hasLeftRef.current) {
        return;
      }
      hasLeftRef.current = true;

      const instance =
        connectTransportState.instance ||
        connectRecvTransportState.instance ||
        data.instance;
      const payload = { conversationID, instance };

      const endCallRecepients =
        Array.isArray(data?.recepients) && data.recepients.length > 0
          ? data.recepients
          : members;

      const payloadWithClient = {
        ...payload,
        clientId: clientIdRef.current,
        recipients: endCallRecepients,
      };

      const localUserID = authentication.user.userID;
      const callerUserID = data?.caller?.userID || null;
      const isCaller = callerUserID === localUserID;

      if (!keepalive && isCaller && endCallRecepients.length > 0) {
        EndCallRequest({
          conversationID,
          conversationType:
            data.conversationType || (isGroupCall ? "group" : "single"),
          recepients: endCallRecepients,
        });
      }

      if (keepalive) {
        fetch(`${envs.CHATTERLOOP_API}/webrtc/leave-room-keepalive`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-access-token": localStorage.getItem("authtoken") || "",
          },
          body: JSON.stringify(payloadWithClient),
          keepalive: true,
        }).catch(() => {
          // no-op
        });
      } else {
        LeaveRoomRequest(payloadWithClient).catch((err) => {
          console.log("Leave room request failed:", err);
        });
      }

      cleanupLocalCallResources();
      //   dispatch({
      //     type: END_CALL_LIST,
      //     payload: {
      //       callID: data.conversationid || conversationID,
      //     },
      //   });
      // Not when unmounting: the route already moved on, and navigating
      // now would override wherever the user went.
      if (!unmounting) {
        navigate("/conference");
      }
    },
    [
      cleanupLocalCallResources,
      connectTransportState.instance,
      connectRecvTransportState.instance,
      data,
      conversationID,
      dispatch,
      authentication.user.userID,
      isGroupCall,
      members,
    ],
  );

  useEffect(() => {
    leaveCallProcessRef.current = leaveCallProcess;
  }, [leaveCallProcess]);

  useReconnect({
    conversationID,
    clientId: clientIdRef.current,
    instance:
      connectTransportState.instance ||
      connectRecvTransportState.instance ||
      data.instance,
    sendTransport,
    recvTransport,
    onBeforeRejoin: cleanupTransportsOnly,
    onRejoin: rejoinRoom,
    hasLeft: hasLeftRef.current,
  });

  const createTransportProcess = useCallback(
    async (instance: string | null) => {
      await VoiceRequest({
        userID: authentication.user.userID,
        // The acting entity's picture - the server announces the acting
        // entity (a page as itself), so its face should match.
        profile: me.profile ?? "none",
        clientID: clientIdRef.current,
        channelID: conversationID,
        recipients: members,
        instance,
      });
      CreateTransportRequest({
        conversationID,
        instance,
        direction: "send",
        clientId: clientIdRef.current,
      });
      CreateTransportRequest({
        conversationID,
        instance,
        direction: "recv",
        clientId: clientIdRef.current,
      });
    },
    [device, conversationID],
  );

  const joinRoomProcess = async (
    routerRtpCapabilities: any,
    instance: string | null,
    participants: {
      clientId: string;
      username: string;
      entityID?: string | null;
      muted?: boolean;
      cameraOff?: boolean;
    }[] = [],
  ) => {
    const incomingParticipants = participants.filter(
      (participant) => participant.clientId !== clientIdRef.current,
    );

    // Set placeholders immediately, before transport/device setup and consume flow.
    setJoinedParticipants((prev) => {
      const next = new Map(
        prev.map((participant) => [participant.clientId, participant]),
      );
      incomingParticipants.forEach((participant) => {
        next.set(participant.clientId, participant);
      });
      return Array.from(next.values());
    });
    setParticipantStatuses((prev) => {
      const next = new Map(prev);
      incomingParticipants.forEach((participant) => {
        next.set(participant.clientId, {
          muted: participant.muted ?? false,
          cameraOff: participant.cameraOff ?? false,
        });
      });
      return next;
    });

    const newDevice = new Device();
    await newDevice.load({ routerRtpCapabilities });
    setDevice(newDevice);

    createTransportProcess(instance);
  };

  useEffect(() => {
    if (
      device &&
      connectTransportState.params &&
      mediaStream &&
      !connectTransportState.triggered
    ) {
      setconnectTransportState((prev: any) => ({
        ...prev,
        triggered: true,
      }));
      const transport = device.createSendTransport(
        connectTransportState.params,
      );
      setSendTransport(transport);

      transport.on(
        "connect",
        async ({ dtlsParameters }: any, callback: any, errback: any) => {
          try {
            TransportConnectRequest({
              conversationID,
              transportId: connectTransportState.params.id,
              dtlsParameters,
              instance: connectTransportState.instance,
              clientId: clientIdRef.current,
            });
            callback();
          } catch (error) {
            errback(error);
          }
        },
      );

      transport.on(
        "produce",
        async (
          { kind, rtpParameters, appData }: any,
          callback: any,
          errback: any,
        ) => {
          const pendingIndex = pendingProduceTracksRef.current.findIndex(
            (entry) =>
              entry.kind === kind &&
              (!appData?.source || entry.source === appData?.source),
          );
          const pendingEntry =
            pendingIndex >= 0
              ? pendingProduceTracksRef.current.splice(pendingIndex, 1)[0]
              : null;
          const targetTrack =
            pendingEntry?.track ||
            (kind === "audio"
              ? mediaStream.getAudioTracks()[0]
              : mediaStream.getVideoTracks()[0]);

          if (!targetTrack) {
            errback(new Error(`Missing ${kind} track`));
            return;
          }

          const temporaryListener = async (event: any) => {
            const data = JSON.parse(event.detail.data);
            if (data.clientId && data.clientId !== clientIdRef.current) {
              return;
            }
            switch (event.detail.event) {
              case "produce-response":
                callback({ id: data.id });
                document.removeEventListener(
                  "room-events-relay-produce",
                  temporaryListener,
                );
                break;
              default:
                break;
            }
          };

          document.addEventListener(
            "room-events-relay-produce",
            temporaryListener,
          );
          try {
            await TransportProduceRequest({
              conversationID,
              transportId: connectTransportState.params.id,
              kind,
              rtpParameters,
              instance: connectTransportState.instance,
              members,
              track: targetTrack,
              clientId: clientIdRef.current,
              appData,
            });
          } catch (error) {
            console.error("❌ SERVER CONNECT FAILED:", error);
            document.removeEventListener(
              "room-events-relay-produce",
              temporaryListener,
            );
            errback(error);
          }
        },
      );

      const startStreaming = async () => {
        try {
          const videoTrack = mediaStream.getVideoTracks()[0];
          const audioTrack = mediaStream.getAudioTracks()[0];

          if (videoTrack) {
            pendingProduceTracksRef.current.push({
              kind: videoTrack.kind,
              track: videoTrack,
              source: "camera",
            });
            videoProducerRef.current = await transport.produce({
              track: videoTrack,
              kind: videoTrack.kind,
              encodings: encodingsRef.current?.camera,
              appData: { source: "camera" },
            });
            // Off before this producer existed - see enableCameraRef.
            if (!enableCameraRef.current) {
              videoProducerRef.current.pause();
            }
            console.log("Video producer created!", videoProducerRef.current.id);
          }

          if (audioTrack) {
            pendingProduceTracksRef.current.push({
              kind: audioTrack.kind,
              track: audioTrack,
              source: "microphone",
            });
            audioProducerRef.current = await transport.produce({
              track: audioTrack,
              kind: audioTrack.kind,
              appData: { source: "microphone" },
            });
            // Muted before this producer existed - see enableMicRef.
            if (!enableMicRef.current) {
              audioProducerRef.current.pause();
            }
            console.log("Audio producer created!", audioProducerRef.current.id);
          }
        } catch (e) {
          console.error("Produce failed", e);
        }
      };

      startStreaming();
    }
  }, [device, connectTransportState, mediaStream, members]);

  useEffect(() => {
    if (!sendTransport || !screenStream || screenProducerRef.current) {
      return;
    }

    const screenTrack = screenStream.getVideoTracks()[0];
    const screenAudioTrack = screenStream.getAudioTracks()[0];
    if (!screenTrack && !screenAudioTrack) {
      return;
    }

    const produceScreen = async () => {
      try {
        if (screenTrack) {
          pendingProduceTracksRef.current.push({
            kind: screenTrack.kind,
            track: screenTrack,
            source: "screen",
          });
          screenProducerRef.current = await sendTransport.produce({
            track: screenTrack,
            kind: screenTrack.kind,
            encodings: encodingsRef.current?.screenshare,
            appData: { source: "screen" },
          });
        }

        if (screenAudioTrack) {
          pendingProduceTracksRef.current.push({
            kind: screenAudioTrack.kind,
            track: screenAudioTrack,
            source: "screen-audio",
          });
          screenAudioProducerRef.current = await sendTransport.produce({
            track: screenAudioTrack,
            kind: screenAudioTrack.kind,
            appData: { source: "screen-audio" },
          });
        }

        const handleScreenEnded = () => {
          setIsScreenSharing(false);
          notifyProducerClosed(screenProducerRef.current?.id);
          notifyProducerClosed(screenAudioProducerRef.current?.id);
          screenProducerRef.current?.close?.();
          screenProducerRef.current = null;
          screenAudioProducerRef.current?.close?.();
          screenAudioProducerRef.current = null;
          screenStream.getTracks().forEach((track) => track.stop());
          setScreenStream(null);
        };
        if (screenTrack) {
          screenTrack.onended = handleScreenEnded;
        }
      } catch (err) {
        console.log("Screen share produce failed:", err);
        setIsScreenSharing(false);
      }
    };

    produceScreen();
  }, [sendTransport, screenStream]);

  const connectTransport = (params: any, instance: string) => {
    setconnectTransportState({ params, instance, triggered: false });
  };

  useEffect(() => {
    if (
      device &&
      connectRecvTransportState.params &&
      // recvTransportMetadata &&
      !connectRecvTransportState.triggered
    ) {
      setconnectRecvTransportState((prev: any) => ({
        ...prev,
        triggered: true,
      }));
      const transport = device.createRecvTransport(
        connectRecvTransportState.params,
      );
      setRecvTransport(transport);

      transport.on(
        "connect",
        async ({ dtlsParameters }: any, callback: any) => {
          await TransportConnectRequest({
            conversationID,
            transportId: connectRecvTransportState.params.id,
            dtlsParameters,
            instance: connectRecvTransportState.instance,
            clientId: clientIdRef.current,
          });
          callback();
        },
      );
    }
  }, [device, connectRecvTransportState]);

  const connectRecvTransport = (params: any, instance: string) => {
    setconnectRecvTransportState({ params, instance, triggered: false });
  };

  const consumeProducers = useCallback(
    (conversationID: string, producerId: any) => {
      const recvTransportId = connectRecvTransportState.params?.id;
      const instance =
        connectRecvTransportState.instance || connectTransportState.instance;

      if (!recvTransportId || !instance || !device) {
        setPendingProducerIds((prev) =>
          prev.includes(producerId) ? prev : [...prev, producerId],
        );
        return;
      }

      ConsumeRequest({
        conversationID,
        transportId: recvTransportId,
        producerId,
        rtpCapabilities: device.rtpCapabilities,
        instance,
        clientId: clientIdRef.current,
      });
    },
    [connectRecvTransportState, connectTransportState, device],
  );

  const consumeResponseHandler = useCallback(
    async (
      id: any,
      producerId: any,
      kind: any,
      rtpParameters: any,
      ownerClientId: string | null,
      source: string | null,
    ) => {
      if (!recvTransport) {
        return;
      }

      const consumer = await recvTransport.consume({
        id,
        producerId,
        kind,
        rtpParameters,
      });

      const removeConsumer = () => {
        setConsumers((prev) => {
          if (!prev.has(producerId)) {
            return prev;
          }
          const next = new Map(prev);
          const entry = next.get(producerId);
          entry?.consumer?.close?.();
          next.delete(producerId);
          return next;
        });
      };

      consumer.on("producerclose", removeConsumer);
      consumer.on("transportclose", removeConsumer);
      consumer.on("trackended", removeConsumer);

      setConsumers((prev) => {
        if (prev.has(producerId)) {
          consumer?.close?.();
          return prev;
        }
        const next = new Map(prev);
        next.set(producerId, { id, kind, consumer, ownerClientId, source });
        return next;
      });
    },
    [recvTransport],
  );

  const notifyProducerClosed = useCallback(
    (producerId?: string) => {
      if (!producerId) {
        return;
      }
      const instance =
        connectTransportState.instance ||
        connectRecvTransportState.instance ||
        data.instance;
      CloseProducerRequest({
        conversationID,
        producerId,
        instance,
        clientId: clientIdRef.current,
      }).catch((err) => {
        console.log("Close producer request failed:", err);
      });
    },
    [
      CloseProducerRequest,
      conversationID,
      connectTransportState.instance,
      connectRecvTransportState.instance,
      data.instance,
    ],
  );

  useEffect(() => {
    if (
      !recvTransport ||
      pendingConsumeResponses.length === 0 ||
      isConsumingRef.current
    ) {
      return;
    }

    const nextConsume = pendingConsumeResponses[0];
    isConsumingRef.current = true;

    consumeResponseHandler(
      nextConsume.id,
      nextConsume.producerId,
      nextConsume.kind,
      nextConsume.rtpParameters,
      nextConsume.ownerClientId || null,
      nextConsume.source || null,
    )
      .catch((err) => {
        console.log("Consume response handler failed:", err);
      })
      .finally(() => {
        setPendingConsumeResponses((prev) => prev.slice(1));
        isConsumingRef.current = false;
      });
  }, [recvTransport, pendingConsumeResponses, consumeResponseHandler]);

  useEffect(() => {
    if (
      pendingProducerIds.length === 0 ||
      !connectRecvTransportState.params?.id ||
      !connectRecvTransportState.instance ||
      !device
    ) {
      return;
    }

    pendingProducerIds.forEach((producerId) => {
      ConsumeRequest({
        conversationID,
        transportId: connectRecvTransportState.params.id,
        producerId,
        rtpCapabilities: device.rtpCapabilities,
        instance: connectRecvTransportState.instance,
        clientId: clientIdRef.current,
      });
    });

    setPendingProducerIds([]);
  }, [
    pendingProducerIds,
    connectRecvTransportState,
    device,
    conversationID,
    consumeProducers,
  ]);

  useEffect(() => {
    const initLocalMedia = async () => {
      let audioStream: MediaStream | null = null;
      let videoStream: MediaStream | null = null;

      try {
        audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
      } catch (err) {
        console.log("Audio device not available:", err);
      }

      try {
        videoStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      } catch (err) {
        console.log("Video device not available:", err);
      }

      const tracks = [
        ...(audioStream?.getAudioTracks() || []),
        ...(videoStream?.getVideoTracks() || []),
      ];

      if (tracks.length === 0) {
        return;
      }

      const combined = new MediaStream(tracks);
      setmediaStream(combined);
    };

    initLocalMedia();
  }, []);

  const startScreenShare = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      setScreenStream(displayStream);
      setIsScreenSharing(true);
    } catch (err) {
      console.log("Screen share request failed:", err);
      setIsScreenSharing(false);
    }
  };

  const stopScreenShare = () => {
    notifyProducerClosed(screenProducerRef.current?.id);
    notifyProducerClosed(screenAudioProducerRef.current?.id);
    screenProducerRef.current?.close?.();
    screenProducerRef.current = null;
    screenAudioProducerRef.current?.close?.();
    screenAudioProducerRef.current = null;
    screenStream?.getTracks().forEach((track) => track.stop());
    setScreenStream(null);
    setIsScreenSharing(false);
  };

  useEffect(() => {
    const instance =
      connectTransportState.instance ||
      connectRecvTransportState.instance ||
      data.instance;

    if (!instance || hasLeftRef.current) {
      return;
    }

    ParticipantStatusRequest({
      conversationID,
      instance,
      clientId: clientIdRef.current,
      muted: !enableMic,
      cameraOff: !enableCamera,
    }).catch((err) => {
      console.log("Participant status request failed:", err);
    });
  }, [
    enableMic,
    enableCamera,
    connectTransportState.instance,
    connectRecvTransportState.instance,
    data.instance,
    conversationID,
  ]);

  useEffect(() => {
    const mainListener = async (event: any) => {
      const data = JSON.parse(event.detail.data);
      const isScopedEvent =
        data?.clientId &&
        [
          "join-room-response",
          "create-transport-response",
          "transport-connect-response",
          "consume-response",
          "consume-error",
          "consume-transport-error",
        ].includes(event.detail.event);

      if (isScopedEvent && data.clientId !== clientIdRef.current) {
        return;
      }

      switch (event.detail.event) {
        case "join-room-response":
          joinRoomProcess(
            data.routerRtpCapabilities,
            data.instance,
            data.participants || [],
          );
          break;
        case "create-transport-response":
          if (data.direction === "send") {
            connectTransport(data.response, data.instance);
          } else {
            connectRecvTransport(data.response, data.instance);
          }
          break;
        case "transport-connect-response":
          console.log(data);
          break;
        case "participant-joined":
          if (
            data.conversationID === conversationID &&
            data.clientId &&
            data.username &&
            data.clientId !== clientIdRef.current
          ) {
            setJoinedParticipants((prev) => {
              if (
                prev.some(
                  (participant) => participant.clientId === data.clientId,
                )
              ) {
                return prev;
              }
              return [
                ...prev,
                {
                  clientId: data.clientId,
                  username: data.username,
                  entityID: data.entityID ?? null,
                },
              ];
            });
            setParticipantStatuses((prev) => {
              const next = new Map(prev);
              next.set(data.clientId, {
                muted: Boolean(data.muted),
                cameraOff: Boolean(data.cameraOff),
              });
              return next;
            });
          }
          break;
        case "participant-left":
          if (data.conversationID === conversationID) {
            const leftClientId = data.clientId || null;
            const leftUsername = data.username || null;

            setJoinedParticipants((prev) => {
              const next = leftClientId
                ? prev.filter(
                    (participant) => participant.clientId !== leftClientId,
                  )
                : leftUsername
                  ? prev.filter(
                      (participant) => participant.username !== leftUsername,
                    )
                  : prev;

              if (
                !isGroupCall &&
                next.length === 0 &&
                ((leftClientId && leftClientId !== clientIdRef.current) ||
                  (!leftClientId &&
                    leftUsername &&
                    leftUsername !== me.handle))
              ) {
                setTimeout(() => {
                  leaveCallProcess();
                }, 0);
              }

              return next;
            });
            if (leftClientId) {
              setParticipantStatuses((prev) => {
                if (!prev.has(leftClientId)) {
                  return prev;
                }
                const next = new Map(prev);
                next.delete(leftClientId);
                return next;
              });
            }

            const producerIds = data.producerIds || [];
            setConsumers((prev) => {
              const next = new Map(prev);
              producerIds.forEach((producerId: string) => {
                const found = next.get(producerId);
                found?.consumer?.close?.();
                next.delete(producerId);
                producerSourceRef.current.delete(producerId);
              });
              return next;
            });
          }
          break;
        case "callreject": {
          const rejectedConversationID =
            data?.rejectdata?.conversationID || data?.conversationID;
          const rejectedBy = data?.rejectdata?.rejectedBy || data?.rejectedBy;
          const endedBy = data?.rejectdata?.endedBy || data?.endedBy;
          const hasRemoteParticipant =
            joinedParticipants.length > 0 || consumers.size > 0;

          if (!isGroupCall && rejectedConversationID === conversationID) {
            if (endedBy) {
              leaveCallProcess();
              break;
            }

            if (rejectedBy && !hasRemoteParticipant) {
              leaveCallProcess();
            }
          }
          break;
        }
        case "participant-status":
          if (
            data.conversationID === conversationID &&
            data.clientId &&
            data.clientId !== clientIdRef.current
          ) {
            setParticipantStatuses((prev) => {
              const next = new Map(prev);
              next.set(data.clientId, {
                muted: Boolean(data.muted),
                cameraOff: Boolean(data.cameraOff),
              });
              return next;
            });
          }
          break;
        case "producer-closed":
          if (data.conversationID === conversationID && data.producerId) {
            setConsumers((prev) => {
              if (!prev.has(data.producerId)) {
                return prev;
              }
              const next = new Map(prev);
              const entry = next.get(data.producerId);
              entry?.consumer?.close?.();
              next.delete(data.producerId);
              return next;
            });
            producerOwnerRef.current.delete(data.producerId);
            producerSourceRef.current.delete(data.producerId);
          }
          break;
        case "new_producer":
          if (data.clientId === clientIdRef.current) {
            break;
          }
          if (data.conversationID === conversationID) {
            if (data.producerId && data.clientId) {
              producerOwnerRef.current.set(data.producerId, data.clientId);
              if (data.source) {
                producerSourceRef.current.set(data.producerId, data.source);
              }
            }
            if (
              data.clientId &&
              data.username &&
              data.clientId !== clientIdRef.current
            ) {
              setJoinedParticipants((prev) => {
                if (
                  prev.some(
                    (participant) => participant.clientId === data.clientId,
                  )
                ) {
                  return prev;
                }
                return [
                  ...prev,
                  {
                    clientId: data.clientId,
                    username: data.username,
                    entityID: data.entityID ?? null,
                  },
                ];
              });
            }
            consumeProducers(data.conversationID, data.producerId);
          }
          break;
        case "consume-response":
          if (data.conversationID === conversationID) {
            const { id, producerId, kind, rtpParameters, source } = data;
            const ownerClientId =
              producerOwnerRef.current.get(producerId) || null;
            const resolvedSource =
              source || producerSourceRef.current.get(producerId) || null;
            setPendingConsumeResponses((prev) => {
              const isExisting = prev.some((mp) => mp.id === id);
              if (isExisting) {
                return prev;
              }
              return [
                ...prev,
                {
                  id,
                  producerId,
                  kind,
                  rtpParameters,
                  ownerClientId,
                  source: resolvedSource,
                },
              ];
            });
          }
          break;
        case "consume-error":
        case "consume-transport-error":
          console.log("Consume failed:", event.detail.event, data);
          break;
        default:
          break;
      }
    };

    document.addEventListener("room-events-relay", mainListener);

    return () => {
      document.removeEventListener("room-events-relay", mainListener);
    };
  }, [
    consumeProducers,
    leaveCallProcess,
    conversationID,
    isGroupCall,
    authentication,
    joinedParticipants,
    consumers,
  ]);

  useEffect(() => {
    if (data && !hasJoinedRef.current) {
      hasJoinedRef.current = true;

      GetEncodingsRequest()
        .then((res) => {
          if (res) encodingsRef.current = res;
        })
        .catch(() => {
          // Non-fatal — produce will fall back to browser defaults
        });

      JoinRoomRequest({
        conversationID,
        members,
        instance: data.instance,
        clientId: clientIdRef.current,
        username: me.handle,
        muted: !enableMic,
        cameraOff: !enableCamera,
      });
    }
  }, [data, members]);

  useEffect(() => {
    const handlePageExit = () => {
      leaveCallProcessRef.current?.({ keepalive: true });
    };

    window.addEventListener("beforeunload", handlePageExit);
    window.addEventListener("pagehide", handlePageExit);

    return () => {
      window.removeEventListener("beforeunload", handlePageExit);
      window.removeEventListener("pagehide", handlePageExit);
    };
  }, []);

  useEffect(() => {
    return () => {
      leaveCallProcessRef.current?.({ unmounting: true });
    };
  }, []);

  const videoConsumers = Array.from(consumers.values()).filter(
    ({ kind }) => kind === "video",
  );
  const audioConsumers = Array.from(consumers.values()).filter(
    ({ kind }) => kind === "audio",
  );
  const videoOwnerIds = new Set(
    videoConsumers
      .map(({ ownerClientId }) => ownerClientId)
      .filter((ownerClientId) => Boolean(ownerClientId)),
  );
  // A participant's member row: by the entity the server stamped on them,
  // else by the username their client sent. The members not in the call are
  // everyone in the conference but you and whoever has joined.
  const memberFor = (participant: {
    username: string;
    entityID?: string | null;
  }) =>
    (participant.entityID
      ? memberByEntity.get(String(participant.entityID))
      : undefined) ?? memberRoleMap.get(participant.username);
  const joinedEntityIDs = new Set(
    joinedParticipants
      .map((participant) => memberFor(participant)?.entityID)
      .filter(Boolean),
  );
  const notJoinedMembers = conferenceMembers.filter(
    (member) =>
      member.entityID !== me.entityID && !joinedEntityIDs.has(member.entityID),
  );
  const waitingParticipants = joinedParticipants.filter(
    (participant) => !videoOwnerIds.has(participant.clientId),
  );
  const participantByClientId = new Map(
    joinedParticipants.map((participant) => [
      participant.clientId,
      participant,
    ]),
  );

  const tiles = buildCallTiles({
    mediaStream,
    enableCamera,
    enableMic,
    screenStream,
    videoConsumers,
    waitingParticipants,
    participantByClientId,
    participantStatuses,
  });

  return (
    <div className="tw-flex tw-flex-row tw-w-full tw-h-full tw-relative">
      <motion.div
        animate={{
          borderWidth: "0px",
        }}
        id="div_conference_indv"
        style={{ flex: 1, minWidth: 0 }}
      >
        <div id="div_top_nav_call_window">
          {/* A conference has no callDisplayName - its name is the group's. */}
          <span id="span_call_displayname">
            {data.callDisplayName || data.groupdetails?.groupName}
          </span>
          {/* <button
          onClick={() => {
            // sendVideoData()
          }}
          className="btn_top_nav_call_window"
        >
          <RxEnterFullScreen style={{ fontSize: "20px", color: "white" }} />
        </button> */}
        </div>
        <CallStage tiles={tiles} />
        <div style={{ display: "none" }}>
          {audioConsumers.map(({ id, consumer }) => (
            <RemoteAudio key={id} consumer={consumer} />
          ))}
        </div>
        <div id="div_voice_controls">
          <button
            onClick={() => setenableMic((on) => !on)}
            className={`btn_call_controls ${enableMic ? "" : "btn_call_controls_enable"}`}
          >
            {enableMic ? <BsFillMicFill /> : <BsFillMicMuteFill />}
          </button>
          <button
            onClick={() => setenableCamera((on) => !on)}
            className={`btn_call_controls ${enableCamera ? "" : "btn_call_controls_enable"}`}
          >
            {enableCamera ? <BsCameraVideoFill /> : <BsCameraVideoOffFill />}
          </button>
          <button
            onClick={() => {
              if (isScreenSharing) {
                stopScreenShare();
              } else {
                startScreenShare();
              }
            }}
            className={`btn_call_controls ${isScreenSharing ? "btn_call_controls_enable" : ""}`}
          >
            {isScreenSharing ? <MdStopScreenShare /> : <MdScreenShare />}
          </button>
          <button
            onClick={() => {
              setIsChatOpen((prev) => {
                if (!prev) {
                  setIsPeopleOpen(false);
                }
                return !prev;
              });
            }}
            className={`btn_call_controls ${isChatOpen ? "btn_call_controls_enable" : ""}`}
          >
            <BsFillChatDotsFill />
          </button>
          <button
            onClick={() => {
              setIsPeopleOpen((prev) => {
                if (!prev) {
                  setIsChatOpen(false);
                }
                return !prev;
              });
            }}
            className={`btn_call_controls tw-relative ${isPeopleOpen ? "btn_call_controls_enable" : ""}`}
          >
            <FiUsers />
            {effectiveCanManage && pendingRequests.length > 0 && (
              <span className="tw-absolute tw--top-[2px] tw--right-[2px] tw-min-w-[16px] tw-h-[16px] tw-px-[4px] tw-rounded-full tw-bg-[var(--pink)] tw-text-white tw-text-[10px] tw-font-semibold tw-flex tw-items-center tw-justify-center tw-leading-none">
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              leaveCallProcess();
            }}
            className="btn_call_controls btn_call_controls_end"
          >
            <HiPhoneMissedCall />
          </button>
        </div>
      </motion.div>
      {/* Chat and People share one side drawer, and it animates both ways -
          the panels used to pop in and vanish at once on close. On a wide
          screen it opens by growing its width, so the call stage beside it
          reflows instead of jumping, and the panel slides in glued to its
          edge; on a phone it covers the call and slides in from the right.
          Swapping chat for People crossfades inside the open drawer. Width
          and x are both always set so a rotate across the breakpoint while
          it is open still lands right. */}
      <AnimatePresence initial={false}>
        {(isChatOpen || isPeopleOpen) && (
          <motion.div
            key="side-drawer"
            initial={
              isMobileView ? { x: "100%", width: "100%" } : { x: 0, width: 0 }
            }
            animate={
              isMobileView
                ? { x: 0, width: "100%" }
                : { x: 0, width: SIDE_PANEL_W }
            }
            exit={
              isMobileView ? { x: "100%", width: "100%" } : { x: 0, width: 0 }
            }
            transition={DRAWER_TRANSITION}
            className={
              isMobileView
                ? "tw-absolute tw-inset-y-0 tw-left-0 tw-z-20 tw-overflow-hidden"
                : "tw-relative tw-h-full tw-flex-shrink-0 tw-overflow-hidden"
            }
          >
            {/* Full width at every step of the drawer's growth, so the panel
                slides rather than squeezes. */}
            <div
              className="tw-absolute tw-inset-y-0 tw-left-0"
              style={{ width: isMobileView ? "100%" : SIDE_PANEL_W }}
            >
              <AnimatePresence initial={false}>
              {isChatOpen && (
                <motion.div
                  key="chat"
                  {...PANEL_SWAP}
                  // The theme's surface, not white: the conversation takes a
                  // moment to load, and a white panel flashed behind it in
                  // the dark theme.
                  className={`tw-absolute tw-inset-0 tw-bg-[var(--surface)] tw-flex tw-flex-col ${
                    isMobileView ? "" : "tw-border-l tw-border-[var(--border)]"
                  }`}
                >
                  <div className="tw-flex-1 tw-min-h-0 tw-flex tw-bg-[var(--surface)]">
                    <ConversationV2
                      conversationID={conversationID}
                      fallbackSetup={conferenceFallbackSetup}
                      theme={CONFERENCE_CHAT_THEME}
                      setIsChatOpen={setIsChatOpen}
                    />
                  </div>
                </motion.div>
              )}
              {isPeopleOpen && (
                <motion.div
                  key="people"
                  {...PANEL_SWAP}
                  className={`cl-redesign tw-absolute tw-inset-0 tw-bg-[var(--surface)] tw-text-[var(--text)] tw-flex tw-flex-col ${
                    isMobileView ? "" : "tw-border-l tw-border-[var(--border)]"
                  }`}
                  data-theme={conferenceTheme}
                >
                  <div className="tw-flex tw-flex-row tw-items-center tw-justify-between tw-px-[14px] tw-py-[12px] tw-border-b tw-border-[var(--border)] tw-flex-shrink-0">
                    <span className="tw-text-[15px] tw-font-semibold tw-font-Inter tw-text-[var(--text)]">
                      People
                    </span>
                    <button
                      type="button"
                      aria-label="Close people panel"
                      onClick={() => setIsPeopleOpen(false)}
                      className="tw-border-none tw-bg-transparent tw-cursor-pointer tw-p-[4px] tw-rounded-full hover:tw-bg-[var(--surface-hover)] tw-flex tw-items-center tw-justify-center tw-text-[var(--text-2)]"
                    >
                      <IoMdClose style={{ fontSize: "18px" }} />
                    </button>
                  </div>
                  <div className="tw-flex-1 tw-min-h-0 tw-overflow-y-auto t-scroll tw-px-[14px] tw-py-[12px] tw-flex tw-flex-col tw-gap-[18px]">
                    {/* Invite from inside the room - by email (no account needed:
                        the link opens this conference lobby) or by username. Hosts
                        only: the server checks realm.invite.create either way. */}
                    {effectiveCanManage && realmId && (
                      <div className="tw-rounded-[10px] tw-border tw-border-[var(--border)] tw-bg-[var(--surface-2)] tw-overflow-hidden tw-flex-shrink-0">
                        <InvitePeople
                          realmId={realmId}
                          realmType="conference"
                          realmName={
                            data.groupdetails?.groupName ||
                            data.callDisplayName ||
                            "this conference"
                          }
                        />
                      </div>
                    )}
                    {effectiveCanManage && (
                      <div className="tw-flex tw-flex-col tw-gap-[8px]">
                        <div className="tw-flex tw-flex-row tw-items-center tw-justify-between">
                          <span className="tw-text-[12px] tw-font-semibold tw-uppercase tw-tracking-[0.04em] tw-text-[var(--text-2)]">
                            Pending requests ({pendingRequests.length})
                          </span>
                          {requestsLoading && (
                            <AiOutlineLoading3Quarters className="tw-animate-spin tw-text-[13px] tw-text-[var(--text-2)]" />
                          )}
                        </div>
                        {!requestsLoading && pendingRequests.length === 0 ? (
                          <span className="tw-text-[12px] tw-text-[var(--text-2)] tw-font-Inter">
                            No pending join requests.
                          </span>
                        ) : (
                          pendingRequests.map((req) => (
                            <div
                              key={req.invite_token || req.id}
                              className="tw-flex tw-flex-row tw-items-center tw-gap-[10px] tw-rounded-[10px] tw-border tw-border-[var(--border)] tw-bg-[var(--surface-2)] tw-px-[10px] tw-py-[8px]"
                            >
                              <div className="tw-w-[34px] tw-h-[34px] tw-rounded-full tw-bg-[var(--brand-soft)] tw-text-[var(--brand)] tw-flex tw-items-center tw-justify-center tw-text-[13px] tw-font-semibold tw-flex-shrink-0">
                                {(req.target_email || "?").charAt(0).toUpperCase()}
                              </div>
                              <span
                                title={req.target_email}
                                className="tw-flex-1 tw-min-w-0 tw-text-[12px] tw-text-[var(--text)] tw-font-Inter tw-truncate"
                              >
                                {req.target_email || "Unknown user"}
                              </span>
                              <button
                                type="button"
                                aria-label="Approve request"
                                disabled={updatingRequestToken === req.invite_token}
                                onClick={() =>
                                  resolveRequest(req.invite_token, "accepted")
                                }
                                className="tw-w-[30px] tw-h-[30px] tw-rounded-full tw-border-none tw-bg-[var(--green)] tw-text-white tw-flex tw-items-center tw-justify-center tw-cursor-pointer disabled:tw-opacity-[0.5] disabled:tw-cursor-not-allowed tw-flex-shrink-0"
                              >
                                {updatingRequestToken === req.invite_token ? (
                                  <AiOutlineLoading3Quarters className="tw-animate-spin tw-text-[13px]" />
                                ) : (
                                  <FiCheck size={16} />
                                )}
                              </button>
                              <button
                                type="button"
                                aria-label="Decline request"
                                disabled={updatingRequestToken === req.invite_token}
                                onClick={() =>
                                  resolveRequest(req.invite_token, "declined")
                                }
                                className="tw-w-[30px] tw-h-[30px] tw-rounded-full tw-border-none tw-bg-[var(--pink)] tw-text-white tw-flex tw-items-center tw-justify-center tw-cursor-pointer disabled:tw-opacity-[0.5] disabled:tw-cursor-not-allowed tw-flex-shrink-0"
                              >
                                <FiX size={16} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                    <div className="tw-flex tw-flex-col tw-gap-[8px]">
                      {/* Everyone in the conference: you and whoever is in the call,
                          then the members who have not joined it yet, drawn pale. */}
                      <div className="tw-flex tw-flex-row tw-items-baseline tw-justify-between tw-gap-[8px]">
                        <span className="tw-text-[12px] tw-font-semibold tw-uppercase tw-tracking-[0.04em] tw-text-[var(--text-2)]">
                          Participants ({joinedParticipants.length + 1 + notJoinedMembers.length})
                        </span>
                        <span className="tw-text-[11px] tw-font-Inter tw-text-[var(--text-3)]">
                          {joinedParticipants.length + 1} in call
                        </span>
                      </div>
                      <div className="tw-flex tw-flex-row tw-items-center tw-gap-[10px] tw-rounded-[10px] tw-px-[10px] tw-py-[8px] tw-bg-[var(--brand-soft)]">
                        <Avatar
                          id={me.entityID || me.handle}
                          entityId={me.entityID}
                          name={me.name}
                          src={me.profile}
                          kind={me.isPage ? "realm" : undefined}
                          size={34}
                        />
                        <span className="tw-flex-1 tw-min-w-0 tw-text-[12px] tw-text-[var(--text)] tw-font-Inter tw-truncate">
                          {me.isPage ? me.name : me.handle} (You)
                        </span>
                        <RoleBadge role={selfRoleFromList} />
                        <div className="tw-flex tw-flex-row tw-items-center tw-gap-[8px] tw-text-[var(--text-2)]">
                          {!enableMic && <BsFillMicMuteFill size={13} />}
                          {!enableCamera && <BsCameraVideoOffFill size={13} />}
                        </div>
                      </div>
                      {joinedParticipants.map((participant) => {
                        const status = participantStatuses.get(participant.clientId);
                        const memberInfo = memberFor(participant);
                        const canManageThisMember = Boolean(
                          effectiveCanManage &&
                          memberInfo?.member_id &&
                          memberInfo.entityID !== me.entityID &&
                          participant.username !== selfUsername &&
                          canActOnRole(memberInfo?.role),
                        );
                        return (
                          <div
                            key={participant.clientId}
                            className="tw-flex tw-flex-row tw-items-center tw-gap-[10px] tw-rounded-[10px] tw-px-[10px] tw-py-[8px] hover:tw-bg-[var(--surface-hover)]"
                          >
                            <Avatar
                              id={
                                memberInfo?.entityID ||
                                participant.username ||
                                participant.clientId
                              }
                              entityId={memberInfo?.entityID}
                              name={memberInfo?.name || participant.username || "?"}
                              src={memberInfo?.profile}
                              kind={memberInfo?.type}
                              size={34}
                            />
                            <span className="tw-flex-1 tw-min-w-0 tw-text-[12px] tw-text-[var(--text)] tw-font-Inter tw-truncate">
                              {/* Their handle from the member list where known -
                                  the server's, not whatever their client sent. */}
                              @{memberInfo?.username || participant.username}
                            </span>
                            <RoleBadge role={memberInfo?.role} />
                            <div className="tw-flex tw-flex-row tw-items-center tw-gap-[8px] tw-text-[var(--text-2)]">
                              {status?.muted && <BsFillMicMuteFill size={13} />}
                              {status?.cameraOff && <BsCameraVideoOffFill size={13} />}
                            </div>
                            {canManageThisMember && memberInfo && (
                              <MemberActionsMenu
                                role={memberInfo.role}
                                viewerIsOwner={viewerIsOwner}
                                busy={updatingRoleFor === memberInfo.entityID}
                                locked={updatingRoleFor !== null}
                                onPromote={() =>
                                  changeMemberRole(memberInfo.entityID, "admin")
                                }
                                onDemote={() =>
                                  changeMemberRole(memberInfo.entityID, "member")
                                }
                                onRemove={() =>
                                  setPendingRemoval(memberInfo.entityID)
                                }
                              />
                            )}
                          </div>
                        );
                      })}
                      {notJoinedMembers.map((member) => (
                        <div
                          key={member.entityID}
                          className="tw-flex tw-flex-row tw-items-center tw-gap-[10px] tw-rounded-[10px] tw-px-[10px] tw-py-[8px]"
                        >
                          {/* Pale, but not the menu - it is as live as a
                              joined member's. */}
                          <div
                            className="tw-flex tw-flex-row tw-items-center tw-gap-[10px] tw-flex-1 tw-min-w-0 tw-opacity-[0.45]"
                            title="Not in the call yet"
                          >
                            <Avatar
                              id={member.entityID}
                              entityId={member.entityID}
                              name={member.name}
                              src={member.profile}
                              kind={member.type}
                              size={34}
                            />
                            <div className="tw-flex tw-flex-col tw-flex-1 tw-min-w-0">
                              <span className="tw-text-[12px] tw-text-[var(--text)] tw-font-Inter tw-truncate">
                                {member.username ? `@${member.username}` : member.name}
                              </span>
                              <span className="tw-text-[11px] tw-text-[var(--text-3)] tw-font-Inter tw-truncate">
                                Not joined yet
                              </span>
                            </div>
                            <RoleBadge role={member.role} />
                          </div>
                          {effectiveCanManage &&
                            member.member_id &&
                            canActOnRole(member.role) && (
                              <MemberActionsMenu
                                role={member.role}
                                viewerIsOwner={viewerIsOwner}
                                busy={updatingRoleFor === member.entityID}
                                locked={updatingRoleFor !== null}
                                onPromote={() =>
                                  changeMemberRole(member.entityID, "admin")
                                }
                                onDemote={() =>
                                  changeMemberRole(member.entityID, "member")
                                }
                                onRemove={() => setPendingRemoval(member.entityID)}
                              />
                            )}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {pendingRemoval && (
        <ConfirmModal
          {...removeMemberPrompt(
            memberByEntity.get(pendingRemoval)?.username
              ? `@${memberByEntity.get(pendingRemoval)?.username}`
              : memberByEntity.get(pendingRemoval)?.name || "this member",
            "conference",
          )}
          onClose={() => setPendingRemoval(null)}
          onConfirm={() => {
            const entityID = pendingRemoval;
            setPendingRemoval(null);
            removeParticipant(entityID);
          }}
        />
      )}
    </div>
  );
}

export default ConferenceVoiceWindow;
