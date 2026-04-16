/**
 * Redis 缓存实现
 * 适合生产环境和分布式应用
 * 
 * 使用前需要：
 * 1. npm install redis
 * 2. 启动 Redis 服务器
 */

import { createClient } from 'redis';

class RedisCache {
    constructor() {
        this.client = null;
        this.connected = false;
    }

    /**
     * 初始化 Redis 连接
     */
    async connect() {
        try {
            this.client = createClient({
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                password: process.env.REDIS_PASSWORD || undefined,
                db: process.env.REDIS_DB || 0
            });

            this.client.on('error', (err) => {
                console.error('[Redis] 连接错误:', err);
                this.connected = false;
            });

            this.client.on('connect', () => {
                console.log('[Redis] 连接成功');
                this.connected = true;
            });

            await this.client.connect();
        } catch (error) {
            console.error('[Redis] 初始化失败:', error);
            throw error;
        }
    }

    /**
     * 设置缓存
     * @param {string} key - 缓存键
     * @param {any} value - 缓存值（会自动转换为 JSON）
     * @param {number} ttl - 过期时间（秒），0 表示永不过期
     */
    async set(key, value, ttl = 0) {
        if (!this.connected) {
            console.warn('[Redis] 未连接，跳过缓存设置');
            return;
        }

        try {
            const jsonValue = JSON.stringify(value);
            if (ttl > 0) {
                await this.client.setEx(key, ttl, jsonValue);
            } else {
                await this.client.set(key, jsonValue);
            }
            console.log(`[Redis] 缓存已设置: ${key}`);
        } catch (error) {
            console.error(`[Redis] 设置缓存失败 (${key}):`, error);
        }
    }

    /**
     * 获取缓存
     * @param {string} key - 缓存键
     * @returns {any} 缓存值，不存在返回 null
     */
    async get(key) {
        if (!this.connected) {
            console.warn('[Redis] 未连接，跳过缓存查询');
            return null;
        }

        try {
            const value = await this.client.get(key);
            if (value) {
                console.log(`[Redis] 缓存命中: ${key}`);
                return JSON.parse(value);
            }
            return null;
        } catch (error) {
            console.error(`[Redis] 获取缓存失败 (${key}):`, error);
            return null;
        }
    }

    /**
     * 检查缓存是否存在
     * @param {string} key - 缓存键
     * @returns {boolean}
     */
    async has(key) {
        if (!this.connected) return false;

        try {
            const exists = await this.client.exists(key);
            return exists === 1;
        } catch (error) {
            console.error(`[Redis] 检查缓存失败 (${key}):`, error);
            return false;
        }
    }

    /**
     * 删除缓存
     * @param {string} key - 缓存键
     */
    async delete(key) {
        if (!this.connected) return;

        try {
            await this.client.del(key);
            console.log(`[Redis] 缓存已删除: ${key}`);
        } catch (error) {
            console.error(`[Redis] 删除缓存失败 (${key}):`, error);
        }
    }

    /**
     * 删除匹配模式的所有缓存
     * @param {string} pattern - 匹配模式，如 'user:*'
     */
    async deletePattern(pattern) {
        if (!this.connected) return;

        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(keys);
                console.log(`[Redis] 已删除 ${keys.length} 个缓存 (${pattern})`);
            }
        } catch (error) {
            console.error(`[Redis] 删除模式缓存失败 (${pattern}):`, error);
        }
    }

    /**
     * 清空所有缓存
     */
    async clear() {
        if (!this.connected) return;

        try {
            await this.client.flushDb();
            console.log('[Redis] 所有缓存已清空');
        } catch (error) {
            console.error('[Redis] 清空缓存失败:', error);
        }
    }

    /**
     * 获取缓存统计信息
     */
    async getStats() {
        if (!this.connected) {
            return { connected: false };
        }

        try {
            const info = await this.client.info('stats');
            const dbSize = await this.client.dbSize();
            return {
                connected: true,
                dbSize,
                info
            };
        } catch (error) {
            console.error('[Redis] 获取统计信息失败:', error);
            return { connected: false };
        }
    }

    /**
     * 关闭连接
     */
    async disconnect() {
        if (this.client) {
            await this.client.quit();
            this.connected = false;
            console.log('[Redis] 连接已关闭');
        }
    }
}

// 导出单例
export const redisCache = new RedisCache();
