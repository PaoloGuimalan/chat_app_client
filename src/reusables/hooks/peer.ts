class PeerService{
    peer: RTCPeerConnection | null = null
    constructor(){
        if(!this.peer){
            this.peer = new RTCPeerConnection({
                iceServers: [
                    {
                        urls:[
                            'stun:stun.l.google.com:19302',
                            'stun:stun1.l.google.com:19302'
                        ]
                    }
                ]
            })
        }
    }

    async getAnswer(_: any){
        if(this.peer){
            // await this.peer.setRemoteDescription(offer);
            const answer = await this.peer.createAnswer();
            await this.peer.setLocalDescription(answer);
            return answer;
        }
    }

    async setLocalDescription(answer: any){
        if(this.peer){
            await this.peer.setRemoteDescription(answer);
        }
    }

    async getOffer(){
        if(this.peer){
            const offer = await this.peer.createOffer();
            await this.peer.setLocalDescription(offer);
            return offer;
        }
    }
}

export default new PeerService();