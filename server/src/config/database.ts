import { DataSource } from 'typeorm'
import dotenv from 'dotenv'

dotenv.config()

let dbConfig: any

// Support DATABASE_URL (Railway / cloud) or individual env vars (local)
if (process.env.DATABASE_URL) {
  dbConfig = {
    type: 'mysql',
    url: process.env.DATABASE_URL,
    synchronize: true,
    logging: false,
    entities: [__dirname + '/../models/*.{ts,js}'],
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
    entities: [__dirname + '/../models/*.{ts,js}'],
  }
}

export const AppDataSource = new DataSource(dbConfig)
