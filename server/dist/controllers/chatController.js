"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConversations = getConversations;
exports.createConversation = createConversation;
exports.getMessages = getMessages;
exports.searchMessages = searchMessages;
exports.exportMessages = exportMessages;
exports.updateConversation = updateConversation;
exports.getUnreadCount = getUnreadCount;
exports.removeMember = removeMember;
const database_1 = require("../config/database");
const Conversation_1 = require("../models/Conversation");
const ConversationMember_1 = require("../models/ConversationMember");
const Message_1 = require("../models/Message");
const MessageStatus_1 = require("../models/MessageStatus");
const User_1 = require("../models/User");
const Friend_1 = require("../models/Friend");
const response_1 = require("../utils/response");
const convRepo = () => database_1.AppDataSource.getRepository(Conversation_1.Conversation);
const memberRepo = () => database_1.AppDataSource.getRepository(ConversationMember_1.ConversationMember);
const messageRepo = () => database_1.AppDataSource.getRepository(Message_1.Message);
const userRepo = () => database_1.AppDataSource.getRepository(User_1.User);
const friendRepo = () => database_1.AppDataSource.getRepository(Friend_1.Friend);
async function getConversations(req, res) {
    try {
        const userId = req.user.userId;
        const memberships = await memberRepo().find({ where: { user_id: userId } });
        const convIds = memberships.map(m => m.conversation_id);
        if (convIds.length === 0)
            return (0, response_1.success)(res, []);
        const conversations = await convRepo()
            .createQueryBuilder('c')
            .where('c.id IN (:...ids)', { ids: convIds })
            .orderBy('c.last_message_time', 'DESC')
            .getMany();
        const result = await Promise.all(conversations.map(async (conv) => {
            const members = await memberRepo().find({ where: { conversation_id: conv.id } });
            const memberIds = members.map(m => m.user_id);
            const users = memberIds.length > 0 ? await userRepo().findByIds(memberIds) : [];
            let name = conv.name;
            let avatar = conv.avatar;
            if (conv.type === 'private') {
                const other = users.find(u => u.id !== userId);
                if (other) {
                    name = name || other.nickname || other.username;
                    avatar = avatar || other.avatar;
                }
            }
            return {
                ...conv,
                name,
                avatar,
                members: users.map(u => ({ id: u.id, username: u.username, nickname: u.nickname, avatar: u.avatar })),
                unread: 0,
            };
        }));
        return (0, response_1.success)(res, result);
    }
    catch (err) {
        return (0, response_1.error)(res, err.message);
    }
}
async function createConversation(req, res) {
    try {
        const { type, name, member_ids } = req.body;
        const userId = req.user.userId;
        if (type === 'private' && member_ids && member_ids.length === 1) {
            const otherId = member_ids[0];
            const memberships = await memberRepo().find({ where: { user_id: userId } });
            const convIds = memberships.map(m => m.conversation_id);
            if (convIds.length > 0) {
                const existingConvs = await convRepo().findByIds(convIds);
                const privateConvs = existingConvs.filter(c => c.type === 'private');
                for (const conv of privateConvs) {
                    const members = await memberRepo().find({ where: { conversation_id: conv.id } });
                    const memberIds = members.map(m => m.user_id);
                    if (memberIds.includes(otherId) && memberIds.includes(userId)) {
                        return (0, response_1.success)(res, conv, 'Conversation already exists');
                    }
                }
            }
        }
        const conversation = convRepo().create({
            type: type || 'private',
            name: name || '',
        });
        await convRepo().save(conversation);
        const allMemberIds = [userId, ...(member_ids || [])];
        for (const id of allMemberIds) {
            const member = memberRepo().create({ conversation_id: conversation.id, user_id: id });
            await memberRepo().save(member);
        }
        // Fetch created conversation with members
        const members = await memberRepo().find({ where: { conversation_id: conversation.id } });
        const userIds = members.map(m => m.user_id);
        const users = userIds.length > 0 ? await userRepo().findByIds(userIds) : [];
        return (0, response_1.success)(res, { ...conversation, members: users }, 'Conversation created');
    }
    catch (err) {
        return (0, response_1.error)(res, err.message);
    }
}
async function getMessages(req, res) {
    try {
        const conversationId = parseInt(req.params.id);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;
        const messages = await messageRepo().find({
            where: { conversation_id: conversationId },
            order: { created_at: 'DESC' },
            skip: offset,
            take: limit,
        });
        const userIds = [...new Set(messages.map(m => m.sender_id))];
        const users = userIds.length > 0 ? await userRepo().findByIds(userIds) : [];
        const userMap = new Map(users.map(u => [u.id, { id: u.id, username: u.username, nickname: u.nickname, avatar: u.avatar }]));
        const result = messages.reverse().map(m => ({
            ...m,
            sender: userMap.get(m.sender_id) || null,
        }));
        const total = await messageRepo().count({ where: { conversation_id: conversationId } });
        return (0, response_1.success)(res, { messages: result, total, page, limit, totalPages: Math.ceil(total / limit) });
    }
    catch (err) {
        return (0, response_1.error)(res, err.message);
    }
}
async function searchMessages(req, res) {
    try {
        const conversationId = parseInt(req.params.id);
        const query = req.query.q;
        if (!query)
            return (0, response_1.error)(res, 'Search query required');
        const messages = await messageRepo()
            .createQueryBuilder('m')
            .where('m.conversation_id = :convId', { convId: conversationId })
            .andWhere('m.type = :type', { type: 'text' })
            .andWhere('m.content LIKE :q', { q: `%${query}%` })
            .orderBy('m.created_at', 'DESC')
            .limit(100)
            .getMany();
        const userIds = [...new Set(messages.map(m => m.sender_id))];
        const users = userIds.length > 0 ? await userRepo().findByIds(userIds) : [];
        const userMap = new Map(users.map(u => [u.id, { id: u.id, username: u.username, nickname: u.nickname }]));
        return (0, response_1.success)(res, messages.map(m => ({ ...m, sender: userMap.get(m.sender_id) })));
    }
    catch (err) {
        return (0, response_1.error)(res, err.message);
    }
}
async function exportMessages(req, res) {
    try {
        const conversationId = parseInt(req.params.id);
        const format = req.query.format || 'json';
        const messages = await messageRepo().find({
            where: { conversation_id: conversationId },
            order: { created_at: 'ASC' },
        });
        const userIds = [...new Set(messages.map(m => m.sender_id))];
        const users = userIds.length > 0 ? await userRepo().findByIds(userIds) : [];
        const userMap = new Map(users.map(u => [u.id, u.username]));
        if (format === 'txt') {
            const text = messages.map(m => `[${m.created_at}] ${userMap.get(m.sender_id) || 'Unknown'} (${m.type}): ${m.content || m.file_url || ''}`).join('\n');
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename=chat-${conversationId}.txt`);
            return res.send(text);
        }
        const data = messages.map(m => ({
            time: m.created_at, sender: userMap.get(m.sender_id) || 'Unknown',
            type: m.type, content: m.content, file_url: m.file_url,
        }));
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=chat-${conversationId}.json`);
        return res.json(data);
    }
    catch (err) {
        return (0, response_1.error)(res, err.message);
    }
}
async function updateConversation(req, res) {
    try {
        const convId = parseInt(req.params.id);
        const conv = await convRepo().findOne({ where: { id: convId } });
        if (!conv)
            return (0, response_1.error)(res, 'Conversation not found', 404);
        if (req.body.name)
            conv.name = req.body.name;
        if (req.body.avatar)
            conv.avatar = req.body.avatar;
        await convRepo().save(conv);
        return (0, response_1.success)(res, conv, 'Conversation updated');
    }
    catch (err) {
        return (0, response_1.error)(res, err.message);
    }
}
async function getUnreadCount(req, res) {
    try {
        const userId = req.user.userId;
        const statusRepo = database_1.AppDataSource.getRepository(MessageStatus_1.MessageStatus);
        const result = await statusRepo.createQueryBuilder('ms')
            .innerJoin(Message_1.Message, 'm', 'm.id = ms.message_id')
            .select('m.conversation_id', 'conversation_id')
            .addSelect('COUNT(*)', 'count')
            .where('ms.user_id = :userId', { userId })
            .andWhere('ms.status = :status', { status: 'sent' })
            .groupBy('m.conversation_id')
            .getRawMany();
        const countByConv = {};
        for (const row of result) {
            countByConv[row.conversation_id] = parseInt(row.count);
        }
        return (0, response_1.success)(res, countByConv);
    }
    catch (err) {
        return (0, response_1.error)(res, err.message);
    }
}
async function removeMember(req, res) {
    try {
        const convId = parseInt(req.params.id);
        const memberId = parseInt(req.params.userId);
        const member = await memberRepo().findOne({ where: { conversation_id: convId, user_id: memberId } });
        if (!member)
            return (0, response_1.error)(res, 'Member not found', 404);
        await memberRepo().remove(member);
        return (0, response_1.success)(res, null, 'Member removed');
    }
    catch (err) {
        return (0, response_1.error)(res, err.message);
    }
}
//# sourceMappingURL=chatController.js.map