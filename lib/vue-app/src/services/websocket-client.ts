import { fetchAuthSession } from "aws-amplify/auth";
import { useWebSocketStore } from "@/store/websocket";

const websocketApiBaseUrl = import.meta.env.VITE_WEBSOCKET_URL || "";

export default class WebSocketClient {
  webSocket: any;
  baseUri = websocketApiBaseUrl;

  public async connect(
    onMessageFunction: Function,
    onCloseFunction: Function
  ) {
    if (websocketApiBaseUrl) {
      const authSession = await fetchAuthSession();
      const accessToken = authSession.tokens?.accessToken?.toString();
      const webSocketStore = useWebSocketStore();

      const webSocket = new WebSocket(this.uri(webSocketStore.webSocketSessionId, accessToken));
      webSocket.onopen = function (this) {
        console.log("WebSocket connection established");
        this.send('{"action": "default"}');
      };
      webSocket.onmessage = function (event: any) {
        onMessageFunction(event);
      };
      webSocket.onclose = function () {
        onCloseFunction();
      };
      this.webSocket = webSocket;
    }
  }

  public ping() {
    this.webSocket.send('{"action": "default"}');
  }

  protected uri(webSocketSessionId: string, accessToken?: string) {
    return accessToken ? `${this.baseUri}?SessionId=${webSocketSessionId}&Auth=${accessToken}` : this.baseUri;
  }
}
