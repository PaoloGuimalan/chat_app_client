class callalert{
    audioMessage: any;
    
    constructor(audioMessage: any){
        this.audioMessage = audioMessage
    }

    start(){
        this.audioMessage.play();

        setTimeout(() => {
            this.audioMessage.pause();
            this.audioMessage.currentTime = 0;
        },60000)
    }

    stop(){
        this.audioMessage.pause();
        this.audioMessage.currentTime = 0;
    }
}

export { 
    callalert
 }