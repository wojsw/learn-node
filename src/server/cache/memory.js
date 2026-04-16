/**
 * 简单的内存缓存实现
 * 适合小型应用和开发环境
 */

class MemoryCache {
    constructor() {
        this.cache = new Map();
        this.timers = new Map();
    }

    /**
     * 设置缓存
     * @param {string} key - 缓存键
     * @param {any} value - 缓存值
     * @param {number} ttl - 过期时间（毫秒），0 表示永不过期
     */
    set(key, value, ttl = 0) {
        // 如果已存在该键，清除旧的定时器
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
        }

        this.cache.set(key, value);

        // 如果设置了 TTL，则在指定时间后删除
        if (ttl > 0) {
            const timer = setTimeout(() => {
                this.cache.delete(key);
                this.timers.delete(key);
                console.log(`[Cache] 缓存过期: ${key}`);
            }, ttl);
            this.timers.set(key, timer);
        }
    }

    /**
     * 获取缓存
     * @param {string} key - 缓存键
     * @returns {any} 缓存值，不存在返回 null
     */
    get(key) {
        return this.cache.get(key) || null;
    }

    /**
     * 检查缓存是否存在
     * @param {string} key - 缓存键
     * @returns {boolean}
     */
    has(key) {
        return this.cache.has(key);
    }

    /**
     * 删除缓存
     * @param {string} key - 缓存键
     */
    delete(key) {
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
            this.timers.delete(key);
        }
        this.cache.delete(key);
        console.log(`[Cache] 缓存已删除: ${key}`);
    }

    /**
     * 清空所有缓存
     */
    clear() {
        this.timers.forEach(timer => clearTimeout(timer));
        this.cache.clear();
        this.timers.clear();
        console.log('[Cache] 所有缓存已清空');
    }

    /**
     * 获取缓存统计信息
     */
    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// 导出单例
export const memoryCache = new MemoryCache();
