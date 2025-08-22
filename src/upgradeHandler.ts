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
	console.log('WebSocket connection established for URL:', url);
	
	if (url?.startsWith('/comments')) {
		console.log('Routing to comment handler');
		handleCommentWSConnection(ws);
	} else if (url?.startsWith('/notifications')) {
		console.log('Routing to notification handler');
		handleNotificationWSConnection(ws);
	} else {
		console.log('Invalid endpoint, closing connection');
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
	console.log('WebSocket upgrade request for URL:', request.url);
	
	// Check if the request is for either comments or notifications
	if (request.url && (request.url.startsWith('/comments') || request.url.startsWith('/notifications'))) {
		console.log('Handling WebSocket upgrade for:', request.url);
		wss.handleUpgrade(request, socket, head, (ws) => {
			wss.emit('connection', ws, request);
		});
	} else {
		console.log('Rejecting WebSocket upgrade for invalid URL:', request.url);
		socket.destroy();
	}
}

export { wss };