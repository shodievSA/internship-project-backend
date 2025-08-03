import { notificationConnectionsMap } from "..";
import type { WebSocket as WSWebSocket } from "ws";

interface IdentifyUserMsg {
  type: "identify-user";
  userId: number;
}

type IncomingMsg = IdentifyUserMsg;

export function handleNotificationWSConnection(ws: WSWebSocket) {
  let userId: number | null = null;

  ws.on("message", async (data: string) => {
    try {
      const msg: IncomingMsg = JSON.parse(data.toString());
      if (msg.type === "identify-user") {
        // Associate the WebSocket connection with the user ID
        userId = msg.userId;
        notificationConnectionsMap.set(userId, ws);
      }
    } catch (err) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Invalid message or server error.",
        })
      );
    }
  });

  ws.on("close", () => {
    // Remove the WebSocket connection from the notificationConnectionsMap
    if (userId !== null) {
      notificationConnectionsMap.delete(userId);
    }
  });
}