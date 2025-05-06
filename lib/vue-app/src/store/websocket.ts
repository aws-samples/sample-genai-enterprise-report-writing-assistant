import { v4 as uuidv4 } from "uuid";
import { defineStore } from "pinia";
import { useChatStore } from "./chat";
import { useTableStore } from "./table";
import WebSocketClient from "@/services/websocket-client";
import WebSocketResponse from "@/models/classes/WebSocketResponse";

export const useWebSocketStore = defineStore("webSocketStore", {
  state: () => ({
    webSocketClient: new WebSocketClient(),
    webSocketId: "",
    webSocketSessionId: uuidv4(),
  }),
  actions: {
    // This should always return an active WebSocket Id
    async getWebSocketId() {
      await this.refreshWebSocketConnection();
      return this.webSocketId;
    },
    // This will ping the existing WebSocket connection to keep it alive, or
    // will establish a new WebSocket connection if needed
    async refreshWebSocketConnection() {
      if (this.webSocketId) {
        console.log("Pinging websocket");
        await this.webSocketClient.ping();
      } else {
        console.log("Connecting to websocket");
        this.webSocketClient.connect(
          this.onWebSocketMessage,
          this.onWebSocketClose
        );
        // We need to wait for the first message to come back from API Gateway
        // to get the WebSocket Id
        while (!this.webSocketId) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }
    },
    // This will be called whenever a message is received from the WebSocket.
    async onWebSocketMessage(event: any) {
      const message: WebSocketResponse = new WebSocketResponse(event.data);

      // The "default" route/action is used to retrieve the WebSocket connection id
      if (message.connectionId) {
        this.webSocketId = message.connectionId;
        message.logConnectionId();
      } 
      // Else if the action is for a table, it is a GenAi recommendation or combined
      // submission response.
      else if (message.action && message.action.startsWith("tableStore")) {
        const submissionType = message.action.split("/")[1];
        const tableStore = useTableStore(submissionType);
        tableStore.receiveModelResponse(message.messageId, message.text);
      }
      // All other messages are chat responses. The actual message processing
      // takes place in the pinia Chat store.
      else {
        // message.logText();  // Enable for debugging
        const submissionType = message.action;
        const chatStore = useChatStore(submissionType);
        chatStore.receiveModelResponse(message.messageId, message.text);
      }
    },
    // If the WebSocket connection is closed, clear the WebSocket Id. A new
    // connection will be established if/when it is needed.
    onWebSocketClose() {
      this.webSocketId = "";
      console.log("WebSocket connection closed");
    },
  },
});
