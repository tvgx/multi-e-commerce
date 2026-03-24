import * as chokidar from 'chokidar';
import { io } from 'socket.io-client';
import * as path from 'path';

// Config path to watch
const WATCH_DIR = path.resolve(__dirname, '../../storefront/src/lib/layout/');
const WEBSOCKET_URL = 'http://localhost:3000/layout-watcher';

console.log(`\n👀 Starting Layout Watcher Mode...`);
console.log(`Watching directory: ${WATCH_DIR}`);

// Initialize Socket.io connection to NestJS
const socket = io(WEBSOCKET_URL, {
    auth: { token: 'dev_watcher_token' },
    reconnection: true
});

socket.on('connect', () => {
    console.log(`✅ Connected to NestJS WebSocket Gateway (ID: ${socket.id})`);
});

socket.on('connect_error', (err) => {
    console.log(`⚠️ WebSocket Connection Error: NestJS might not be running. Retrying...`);
});

// Setup File Watcher
const watcher = chokidar.watch(`${WATCH_DIR}/**/*.ts`, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    awaitWriteFinish: {
        stabilityThreshold: 500, // Wait 500ms after last write to trigger
        pollInterval: 100
    }
});

let syncTimeout: NodeJS.Timeout;

watcher.on('change', (filePath) => {
    console.log(`[Watch] Detected change in: ${path.basename(filePath)}`);

    // Debounce the sync to avoid blasting the server
    clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
        console.log(`[Watch] Triggering Live Sync to Preview Branch...`);

        // In reality we'd parse the updated TS file here. 
        // For now, we simulate sending a signal to the backend to refresh preview.
        // We can execute the sync-layout logic directly or emit event.
        socket.emit('live-sync', {
            filePath,
            timestamp: new Date().toISOString()
        });

    }, 1000);
});

process.on('SIGINT', () => {
    console.log('Stopping watcher...');
    watcher.close();
    socket.disconnect();
    process.exit(0);
});
