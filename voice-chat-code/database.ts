import 'reflect-metadata'
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

// Railway MySQL plugin provides MYSQL_URL (not DATABASE_URL)
const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_URL

const entities = [
  User, FriendGroup, Friend, FriendRequest,
  Conversation, ConversationMember, Message, MessageStatus,
]

let dbConfig: any

if (databaseUrl) {
  dbConfig = {
    type: 'mysql',
    url: databaseUrl,
    synchronize: true,
    logging: false,
    entities,
  }
} else {
  // Fallback: individual env vars (local dev)
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

console.log('Database config:', databaseUrl ? 'using DATABASE_URL' : `using ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`)

export const AppDataSource = new DataSource(dbConfig)
