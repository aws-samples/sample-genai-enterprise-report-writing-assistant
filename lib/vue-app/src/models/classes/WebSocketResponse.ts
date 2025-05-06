class WebSocketResponse {
  statusCode: number;
  connectionId: string;
  action: string;
  messageId: number;
  text: string;

  constructor(data: string) {
    const json = JSON.parse(data);
    this.statusCode = json.statusCode;
    this.connectionId = json.connectionId;
    this.action = json.action;
    this.messageId = json.message_id;
    this.text = json.text;
  }

  logConnectionId() {
    console.log(
      `WebSocket connection id: ${this.connectionId
        .replace(/\n/g, "")
        .replace(/\r/g, "")}`
    );
  }

  logText() {
    console.log(this.text.replace(/\n/g, "").replace(/\r/g, ""));
  }
}

export default WebSocketResponse;
