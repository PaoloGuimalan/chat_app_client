/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import envs from "./env_configs";
class PeerService {
  peer: RTCPeerConnection | null = null;
  constructor() {
    if (!this.peer) {
      this.peer = new RTCPeerConnection({
        iceServers: [
          {
            // STUN is for simple IP discovery
            urls: `stun:${envs.TURN_SERVER_URL}`,
          },
          {
            // TURN is for relaying data when P2P fails
            urls: `turn:${envs.TURN_SERVER_URL}`,
            username: envs.TURN_SERVER_USERNAME, // From your: user=admin:chatterloop12345678
            credential: envs.TURN_SERVER_CREDENTIAL,
          },
        ],
      });
    }
  }

  async getAnswer(_: any) {
    if (this.peer) {
      // await this.peer.setRemoteDescription(offer);
      const answer = await this.peer.createAnswer();
      await this.peer.setLocalDescription(answer);
      return answer;
    }
  }

  async setLocalDescription(answer: any) {
    if (this.peer) {
      await this.peer.setRemoteDescription(answer);
    }
  }

  async getOffer() {
    if (this.peer) {
      const offer = await this.peer.createOffer();
      await this.peer.setLocalDescription(offer);
      return offer;
    }
  }
}

export default PeerService;
