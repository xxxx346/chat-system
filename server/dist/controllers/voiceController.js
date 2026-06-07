"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadVoice = uploadVoice;
exports.getVoice = getVoice;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const response_1 = require("../utils/response");
const database_1 = require("../config/database");
const Message_1 = require("../models/Message");
const UPLOAD_DIR = path_1.default.join(__dirname, '../../uploads/voice');
if (!fs_1.default.existsSync(UPLOAD_DIR)) {
    fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
}
async function uploadVoice(req, res) {
    try {
        const { conversation_id } = req.body;
        const files = req.files;
        if (!req.file && (!files || !files.audio)) {
            return (0, response_1.error)(res, 'Voice file required');
        }
        const file = req.file || (files?.audio ? files.audio[0] : null);
        if (!file)
            return (0, response_1.error)(res, 'Voice file required');
        const fileName = `${(0, uuid_1.v4)()}.webm`;
        const filePath = path_1.default.join(UPLOAD_DIR, fileName);
        fs_1.default.writeFileSync(filePath, file.buffer);
        const fileUrl = `/uploads/voice/${fileName}`;
        const messageRepo = database_1.AppDataSource.getRepository(Message_1.Message);
        const message = messageRepo.create({
            conversation_id: parseInt(conversation_id),
            sender_id: req.user.userId,
            type: 'voice',
            file_url: fileUrl,
            file_size: file.size,
            file_name: fileName,
        });
        await messageRepo.save(message);
        return (0, response_1.success)(res, { ...message, file_url: fileUrl }, 'Voice uploaded');
    }
    catch (err) {
        return (0, response_1.error)(res, err.message);
    }
}
async function getVoice(req, res) {
    try {
        const messageRepo = database_1.AppDataSource.getRepository(Message_1.Message);
        const message = await messageRepo.findOne({ where: { id: parseInt(req.params.id) } });
        if (!message || !message.file_url)
            return (0, response_1.error)(res, 'Voice not found', 404);
        const filePath = path_1.default.join(UPLOAD_DIR, path_1.default.basename(message.file_url));
        if (!fs_1.default.existsSync(filePath))
            return (0, response_1.error)(res, 'File not found', 404);
        res.setHeader('Content-Type', 'audio/webm');
        res.sendFile(filePath);
    }
    catch (err) {
        return (0, response_1.error)(res, err.message);
    }
}
//# sourceMappingURL=voiceController.js.map