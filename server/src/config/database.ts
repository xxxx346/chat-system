import { DataSource } from 'typeorm'
import dotenv from 'dotenv'
import { User } from '../models/User'
import { FriendGroup } from '../models/FriendGroup'
import { Friend } from '../models/Friend'
import { FriendRequest } from '../models/FriendRequest'
import { Conversation } from '../models/Conversation'
import { ConversationMember } from '../models/ConversationMember'
import { Message } from '../models/Message'
import { MessageStatus } from '../models/MessageStatus'

dotenv.config()

const entities = [
  User,
  FriendGroup,
  Friend,
  FriendRequest,
  Conversation,
  ConversationMember,
  Message,
  MessageStatus,
]

let dbConfig: any

// Support DATABASE_URL (Railway / cloud) or individual env vars (local)
if (process.env.DATABASE_URL) {
  dbConfig = {
    type: 'mysql',
    url: process.env.DATABASE_URL,
    synchronize: true,
    logging: false,
    entities,
  }
} else {
  dbConfig = {
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'chat_system',
    synchronize: true,
    logging: false,
    entities,
  }
}

export const AppDataSource = new DataSource(dbConfig)
