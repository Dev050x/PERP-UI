const BASE_URL = process.env.BASE_URL  || "wss://ws.backpack.exchange/";

interface CallbackObject{
    callback: (data: any) => void;
    id:string;
}

export class SignalingManager {
    private ws: WebSocket;
    private static instance: SignalingManager;
    private id: number;
    private isInitialized: boolean;
    private bufferredMessages:any[] = [];
    private callbacks: any = {};
    
    private constructor() {
        this.ws = new WebSocket(BASE_URL);
        this.init();
        this.id = 0;
        this.isInitialized = false;
        this.bufferredMessages = [];
    }

    public static getInstance() {
        if(!this.instance){
            this.instance = new SignalingManager();
        }
        return this.instance;
    }

    init() {
        this.ws.onopen = () => {
            this.isInitialized = true;
            this.bufferredMessages.forEach((msg) => {
                this.ws.send(JSON.stringify(msg));
            });
            this.bufferredMessages = [];
        }

        this.ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            const type = msg.data.e;

            if(this.callbacks[type]) {
                this.callbacks[type].forEach(({ callback }: CallbackObject) => {
                    if(type == "depth") {
                        callback({bids: msg.data.b, asks: msg.data.a});
                    }
                })
            }
        }

    }

    sendMessage(msg: any) {
        const messageToSend = {
            ...msg,
            id: this.id++
        };
        if(!this.isInitialized) {
            this.bufferredMessages.push(messageToSend);
            return;
        }
        this.ws.send(JSON.stringify(messageToSend));
    }

    registerCallback(type: string, callback:any, id:string) {
        this.callbacks[type] = this.callbacks[type] || [];
        this.callbacks[type].push({
            callback,
            id,
        });
    }

    deRegisterCallback(type: string, id:string) {
        if(this.callbacks[type]) {
            const index = this.callbacks[type].findIndex((callback: any) => callback.id === id);
            if (index !== -1) {
                this.callbacks[type].splice(index,1);
            }
        }
    }
    

    
}