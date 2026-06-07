"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const database_1 = require("./config/database");
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const socket_1 = require("./socket");
dotenv_1.default.config();
// Ensure upload directories exist
const uploadDirs = ['uploads/voice', 'uploads/files'];
uploadDirs.forEach(dir => {
    const p = path_1.default.join(__dirname, '..', dir);
    if (!fs_1.default.existsSync(p))
        fs_1.default.mkdirSync(p, { recursive: true });
});
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// In production, serve the built frontend
const clientDist = path_1.default.join(__dirname, '../../client/dist');
if (fs_1.default.existsSync(clientDist)) {
    console.log('Serving frontend from:', clientDist);
    app.use(express_1.default.static(clientDist));
}
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
});
exports.io = io;
// Routes
const auth_1 = __importDefault(require("./routes/auth"));
const friend_1 = __importDefault(require("./routes/friend"));
const chat_1 = __importDefault(require("./routes/chat"));
const voice_1 = __importDefault(require("./routes/voice"));
const file_1 = __importDefault(require("./routes/file"));
app.use('/api/auth', auth_1.default);
app.use('/api/friends', friend_1.default);
app.use('/api/conversations', chat_1.default);
app.use('/api/voice', voice_1.default);
app.use('/api/files', file_1.default);
app.get('/api/health', (_, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Serve index.html for all other routes (SPA fallback)
if (fs_1.default.existsSync(clientDist)) {
    app.get('*', (_, res) => {
        res.sendFile(path_1.default.join(clientDist, 'index.html'));
    });
}
// Socket setup
(0, socket_1.setupSocket)(io);
// Start server
const PORT = process.env.PORT || 3001;
database_1.AppDataSource.initialize()
    .then(() => {
    console.log('Database connected successfully');
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
})
    .catch((err) => {
    console.error('Database connection failed:', err);
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT} (without database)`);
    });
});
//# sourceMappingURL=server.js.map