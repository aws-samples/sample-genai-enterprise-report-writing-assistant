/**
* This is an approach to catch response timeouts from LLM queries,
* for example, if the LLM takes too long or never responds at all.
* When the LLM is called, we start a 60 second timer. When the LLM 
* response is received, we clear the timer. If the timer expires,
* we'll assume that the request has failed. There is probably a
* better way to do this ¯\_(ツ)_/¯
*/
const WEBSOCKET_TIMEOUT_SECONDS = 60;

export default class WebSocketTimeout {
    timeoutId: NodeJS.Timeout | null;
    timeoutSeconds: number;
    
    constructor() {
        this.timeoutId = null;
        this.timeoutSeconds = WEBSOCKET_TIMEOUT_SECONDS;
    }
    
    start(callbackMethod: any) {
        this.timeoutId = setTimeout(callbackMethod, this.timeoutSeconds * 1000);
    }

    clear() {
        if(this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }
  
}