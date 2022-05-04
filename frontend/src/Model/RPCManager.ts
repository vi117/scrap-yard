import {RPCResponse, RPCMethod, RPCNotification} from "model/dist/mod";

type RPCCallback = {
    resolve: (v:RPCResponse)=>void,
    reject: (e:Error)=>void
};

export class RPCMessageManager{
    close() {
        if(this.ws){
            this.ws.close();
        }
        this.callbackList.clear();
    }
    private callbackList: Map<number, RPCCallback>
    private curId: number;
    private ws?: WebSocket;
    constructor(){
        this.curId = 1;
        this.callbackList = new Map();
    }
    get opened(){
        return this.ws?.readyState === WebSocket.OPEN;
    }
    async open(url: string| URL, protocals?:string| string){
        return new Promise<void>((resolve, reject)=>{
            this.ws = new WebSocket(url,protocals);
            this.ws.onmessage = (e)=>{
                const data = JSON.parse(e.data) as RPCResponse;
                const callback = this.callbackList.get(data.id);
                if(callback){
                    callback.resolve(data);
                }
            };
            this.ws.onopen = ()=>{
                resolve();
            }
            this.ws.onerror = (e)=>{
                reject(new Error("connection error"));
            }
        });
    }
    
    private genId(){
        const ret = this.curId;
        this.curId++;
        return ret;
    }
    /**
     * helper function to invoke method
     * @returns header of method
     */
    genHeader() : {jsonrpc: "2.0", id: number} {
        return {
            jsonrpc: "2.0",
            id: this.genId()
        }
    }

    send(message: RPCMethod): Promise<RPCResponse>{
        if(!this.ws){
            throw new Error("not connected");
        }
        this.ws.send(JSON.stringify(message));
        const ret = new Promise<RPCResponse>((resolve,reject)=>{
            this.callbackList.set(message.id,{resolve,reject});
        });
        return ret;
    }
    sendNotification(message: RPCNotification){
        if(!this.ws){
            throw new Error("not connected");
        }
        this.ws.send(JSON.stringify(message));
    }
    async invokeMethod(m: Omit<RPCMethod, "id"|"jsonrpc">): Promise<RPCResponse>{
        const message = {
            ...this.genHeader(),
            method: m.method,
            params: m.params
        } as RPCMethod;
        return await this.send(message);
    }
}