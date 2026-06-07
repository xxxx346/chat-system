"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocket = setupSocket;
const database_1 = require("../config/database");
const Message_1 = require("../models/Message");
const Conversation_1 = require("../models/Conversation");
const ConversationMember_1 = require("../models/ConversationMember");
const MessageStatus_1 = require("../models/MessageStatus");
const User_1 = require("../models/User");
const onlineUsers = new Map(); // userId -> socketId
function setupSocket(io) {
    io.on('connection', (socket) => {
        const userId = parseInt(socket.handshake.query.userId);
        const username = socket.handshake.query.username;
        if (userId) {
            onlineUsers.set(userId, socket.id);
            socket.userId = userId;
            socket.join(`user:${userId}`);
            io.emit('user:online', { userId, username });
            console.log(`User ${username}(${userId}) connected`);
        }
        socket.on('message:send', async (data) => {
            try {
                if (data.sender_id !== userId)
                    return;
                const messageRepo = database_1.AppDataSource.getRepository(Message_1.Message);
                const message = messageRepo.create({
                    conversation_id: data.conversation_id,
                    sender_id: data.sender_id,
                    type: data.type || 'text',
                    content: data.content,
                    file_url: data.file_url,
                    file_size: data.file_size,
                    file_name: data.file_name,
                });
                const saved = await messageRepo.save(message);
                // Update conversation last_message
                const convRepo = database_1.AppDataSource.getRepository(Conversation_1.Conversation);
                await convRepo.update(data.conversation_id, {
                    last_message: data.content
                        ? (data.content.length > 200 ? data.content.substring(0, 200) + '...' : data.content)
                        : `[${data.type || 'message'}]`,
                    last_message_time: saved.created_at,
                });
                // Create MessageStatus for other members
                const memberRepo = database_1.AppDataSource.getRepository(ConversationMember_1.ConversationMember);
                const members = await memberRepo.find({ where: { conversation_id: data.conversation_id } });
                const statusRepo = database_1.AppDataSource.getRepository(MessageStatus_1.MessageStatus);
                const statuses = members
                    .filter((m) => m.user_id !== data.sender_id)
                    .map((m) => ({
                    message_id: saved.id,
                    user_id: m.user_id,
                    status: 'delivered',
                }));
                if (statuses.length > 0) {
                    await statusRepo.save(statuses);
                }
                // Get sender info
                const userRepo = database_1.AppDataSource.getRepository(User_1.User);
                const sender = await userRepo.findOne({ where: { id: data.sender_id } });
                const messageData = {
                    ...saved,
                    sender: sender
                        ? { id: sender.id, username: sender.username, nickname: sender.nickname, avatar: sender.avatar }
                        : { id: data.sender_id },
                };
                io.to(`conv:${data.conversation_id}`).emit('message:new', messageData);
            }
            catch (err) {
                console.error('Failed to persist message:', err);
            }
        });
        socket.on('message:read', async (data) => {
            try {
                const statusRepo = database_1.AppDataSource.getRepository(MessageStatus_1.MessageStatus);
                await statusRepo.update({ message_id: data.message_id, user_id: userId }, { status: 'read', read_at: new Date() });
                io.to(`conv:${data.conversation_id}`).emit('message:read:ack', { ...data, userId });
            }
            catch (err) {
                console.error('Failed to mark message read:', err);
            }
        });
        socket.on('typing:start', (data) => {
            socket.to(`conv:${data.conversation_id}`).emit('typing:start', data);
        });
        socket.on('typing:end', (data) => {
            socket.to(`conv:${data.conversation_id}`).emit('typing:end', data);
        });
        socket.on('join:conversation', (convId) => {
            socket.join(`conv:${convId}`);
        });
        socket.on('leave:conversation', (convId) => {
            socket.leave(`conv:${convId}`);
        });
        // Voice call WebRTC signaling
        socket.on('voice:offer', async (data) => {
            const targetSocket = onlineUsers.get(data.targetUserId);
            if (targetSocket) {
                let avatar = '';
                try {
                    const userRepo = database_1.AppDataSource.getRepository(User_1.User);
                    const sender = await userRepo.findOne({ where: { id: userId } });
                    if (sender)
                        avatar = sender.avatar || '';
                }
                catch (e) { /* ignore */ }
                io.to(targetSocket).emit('voice:offer', { ...data, fromUserId: userId, fromUsername: username, fromAvatar: avatar });
            }
        });
        socket.on('voice:answer', (data) => {
            const targetSocket = onlineUsers.get(data.targetUserId);
            if (targetSocket) {
                io.to(targetSocket).emit('voice:answer', data);
            }
        });
        socket.on('voice:ice-candidate', (data) => {
            const targetSocket = onlineUsers.get(data.targetUserId);
            if (targetSocket) {
                io.to(targetSocket).emit('voice:ice-candidate', data);
            }
        });
        socket.on('voice:end', (data) => {
            const targetSocket = onlineUsers.get(data.targetUserId);
            if (targetSocket) {
                io.to(targetSocket).emit('voice:end', { userId });
            }
        });
        socket.on('disconnect', () => {
            if (userId) {
                onlineUsers.delete(userId);
                io.emit('user:offline', { userId, username });
                console.log(`User ${username}(${userId}) disconnected`);
            }
        });
    });
}
//# sourceMappingURL=index.js.map