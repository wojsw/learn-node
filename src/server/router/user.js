import express from "express";
import { memoryCache } from "../cache/memory.js";
import { pool } from "../db/index.js";

export function createUserRoute() {
    const userRouter = express.Router();

    /**
     * 获取用户信息
     * 演示缓存的使用：
     * 1. 先从缓存查找
     * 2. 缓存不存在则从数据库查询
     * 3. 将结果存入缓存，5分钟后过期
     */
    userRouter.get("/information", async (req, res) => {
        try {
            const username = req.user.username;
            const cacheKey = `user:${username}`;

            // 1. 先从缓存查找
            let userInfo = memoryCache.get(cacheKey);
            if (userInfo) {
                console.log(`[Cache] 命中缓存: ${cacheKey}`);
                return res.status(200).json({
                    code: 1,
                    success: true,
                    message: "success (from cache)",
                    data: userInfo
                });
            }

            // 2. 缓存不存在，从数据库查询
            console.log(`[Cache] 缓存未命中，从数据库查询: ${cacheKey}`);
            const result = await pool.query(
                "SELECT id, username, email FROM users WHERE username = $1",
                [username]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    code: 0,
                    success: false,
                    message: "user not found"
                });
            }

            userInfo = result.rows[0];

            // 3. 将结果存入缓存，5分钟后过期
            memoryCache.set(cacheKey, userInfo, 5 * 60 * 1000);

            res.status(200).json({
                code: 1,
                success: true,
                message: "success",
                data: userInfo
            });
        } catch (error) {
            console.error("获取用户信息失败:", error);
            res.status(500).json({
                code: 0,
                success: false,
                message: "failed"
            });
        }
    });

    /**
     * 获取缓存统计信息（调试用）
     */
    userRouter.get("/cache-stats", (req, res) => {
        const stats = memoryCache.getStats();
        res.status(200).json({
            code: 1,
            success: true,
            data: stats
        });
    });

    return userRouter;
}