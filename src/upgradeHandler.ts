import { Duplex } from 'stream';
import { IncomingMessage } from 'http';
import { Buffer } from 'buffer';
import { WebSocketServer, WebSocket as WSWebSocket } from 'ws';
import { handleCommentWSConnection } from './controllers/commentController';
import { handleNotificationWSConnection } from './services/notificationWSService';

const wss = new WebSocketServer({ noServer: true });

// Single connection handler that routes based on URL
wss.on('connection', (ws: WSWebSocket, request: IncomingMessage) => {
	const url = request.url;
	
	if (url?.startsWith('/comments')) {
		handleCommentWSConnection(ws);
	} else if (url?.startsWith('/notifications')) {
		handleNotificationWSConnection(ws);
	} else {
		ws.close(1008, 'Invalid endpoint');
	}
});

export const taskConnectionsMap: Map<number, Set<WSWebSocket>> = new Map();
export const notificationConnectionsMap: Map<number, WSWebSocket> = new Map();

export function handleUpgrade(
	request: IncomingMessage, 
	socket: Duplex, 
	head: Buffer
) {
	
	// Check if the request is for either comments or notifications
	if (request.url && (request.url.startsWith('/comments') || request.url.startsWith('/notifications'))) {
		wss.handleUpgrade(request, socket, head, (ws) => {
			wss.emit('connection', ws, request);
		});
	} else {
		socket.destroy();
	}
}

export { wss };