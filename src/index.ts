import 'dotenv/config';
import './config/passport';
import express from 'express';
import passport from 'passport';
import cors from 'cors';
import session from './config/session';
import initDB from './models';
import v1Router from './routes/api/v1/index';
import errorHandler from './middlewares/errorHandler';
import { startCronJobs } from './services/cronService';
import { createServer } from 'http';
import { WebSocketServer, WebSocket as WSWebSocket } from 'ws';
import { handleCommentWSConnection } from './controllers/commentController';
import { handleNotificationWSConnection } from './services/notificationWSService';
import { initConsumers } from './queues/initConsumers';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.enable('trust proxy');
app.use(cors({
	origin: process.env.FRONTEND_URL,
	credentials: true,
}));
app.use(session);
app.use(passport.initialize());
app.use(passport.session());
app.use('/api/v1', v1Router);
app.use(errorHandler);

export const taskConnectionsMap: Map<number, Set<WSWebSocket>> = new Map();
export const notificationConnectionsMap: Map<number, WSWebSocket> = new Map();

const server = createServer(app);
const wss = new WebSocketServer({ noServer: true });
const notificationWSS = new WebSocketServer({ noServer: true });

wss.on('connection', handleCommentWSConnection);
notificationWSS.on('connection', handleNotificationWSConnection)

server.on('upgrade', (request, socket, head) => {
	
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

});

async function main() {

	try {

		await initDB();
		await startCronJobs();
		await initConsumers();
		server.listen(PORT, () => console.log(`Server is running at http://localhost:${PORT}`));

	} catch (error) {

		console.error('Failed to start server:', error);

	}

}

export { wss };
export { notificationWSS };

main();
