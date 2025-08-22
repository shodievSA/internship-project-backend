import { Duplex } from 'stream';
import { IncomingMessage } from 'http';
import { Buffer } from 'buffer';
import { WebSocketServer, WebSocket as WSWebSocket } from 'ws';
import { handleCommentWSConnection } from './controllers/commentController';
import { handleNotificationWSConnection } from './services/notificationWSService';

const wss = new WebSocketServer({ noServer: true });
const notificationWSS = new WebSocketServer({ noServer: true });

wss.on('connection', handleCommentWSConnection);
notificationWSS.on('connection', handleNotificationWSConnection);

export const taskConnectionsMap: Map<number, Set<WSWebSocket>> = new Map();
export const notificationConnectionsMap: Map<number, WSWebSocket> = new Map();

export function handleUpgrade(
	request: IncomingMessage, 
	socket: Duplex, 
	head: Buffer
) {

	if (request.url && request.url.startsWith('/comments')) {
	
		wss.handleUpgrade(request, socket, head, (ws) => {
			wss.emit('connection', ws, request);
		});

	} else if (request.url && request.url.startsWith('/notifications')) {

		notificationWSS.handleUpgrade(request, socket, head, (ws) => { 
			notificationWSS.emit('connection', ws, request)
		});

	} else {

		socket.destroy();

	}

};

export { wss };
export { notificationWSS };
