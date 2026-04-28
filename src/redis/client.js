import { createClient } from 'redis'
import dotenv from 'dotenv'

dotenv.config()

let client = null

export async function connectRedis() {
    if (client && client.isOpen) return client;

    client = createClient({
        url: process.env.REDIS_URL
    })
    client.on('error', (err) => {
        console.error('Redis error:', err)
    })

    await client.connect()
    console.log('Redis connected')
    return client
}