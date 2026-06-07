import Redis from 'ioredis'

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  lazyConnect: true,
  retryStrategy: () => null,
})

redis.connect().catch(() => {
  console.log('Redis not available, running without cache')
})

export default redis
