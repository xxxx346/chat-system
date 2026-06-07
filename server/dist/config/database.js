"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = require("../models/User");
const FriendGroup_1 = require("../models/FriendGroup");
const Friend_1 = require("../models/Friend");
const FriendRequest_1 = require("../models/FriendRequest");
const Conversation_1 = require("../models/Conversation");
const ConversationMember_1 = require("../models/ConversationMember");
const Message_1 = require("../models/Message");
const MessageStatus_1 = require("../models/MessageStatus");
dotenv_1.default.config();
let dbConfig;
if (process.env.DATABASE_URL) {
    dbConfig = {
        type: 'mysql',
        url: process.env.DATABASE_URL,
        synchronize: true,
        logging: false,
        entities: [User_1.User, FriendGroup_1.FriendGroup, Friend_1.Friend, FriendRequest_1.FriendRequest, Conversation_1.Conversation, ConversationMember_1.ConversationMember, Message_1.Message, MessageStatus_1.MessageStatus],
    };
}
else {
    dbConfig = {
        type: 'mysql',
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 3306,
        username: process.env.DB_USERNAME || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_DATABASE || 'chat_system',
        synchronize: true,
        logging: false,
        entities: [User_1.User, FriendGroup_1.FriendGroup, Friend_1.Friend, FriendRequest_1.FriendRequest, Conversation_1.Conversation, ConversationMember_1.ConversationMember, Message_1.Message, MessageStatus_1.MessageStatus],
    };
}
exports.AppDataSource = new typeorm_1.DataSource(dbConfig);
//# sourceMappingURL=database.js.map