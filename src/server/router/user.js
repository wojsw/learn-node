import express from "express";
import { uploadAvatar } from "../middleware/upload.js";
import { pool } from "../db/index.js";
import { connectRedis } from "../../redis/client.js";

/**
 * 包装 multer 单文件处理：把「类型不符 / 超大」等错误转成 JSON，避免挂死请求
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
function handleAvatarUpload(req, res, next) {
    uploadAvatar.single("avatar")(req, res, (err) => {
        if (err) {
            // MulterError 或 fileFilter 抛出的普通 Error 统一返回 400
            const message =
                err.code === "LIMIT_FILE_SIZE"
                    ? "文件过大，请上传 5MB 以内的图片"
                    : err.message || "上传失败";
            res.status(400).json({
                code: 0,
                success: false,
                message,
            });
            return;
        }
        next();
    });
}

const profileKey = (username) => `profile:${username}`;

async function getCachedProfile(redis, username) {
    const key = profileKey(username);
    const profile = await redis.get(key);
    if (profile) {
        return JSON.parse(profile)
    } else {
        return null
    }
}

async function setCachedProfile(redis, username, profile) {
    const key = profileKey(username);
    await redis.set(key, JSON.stringify(profile), { EX: 604800 });
}

async function clearCachedProfile(redis, username) {
    const key = profileKey(username);
    await redis.del(key);
}

export async function createUserRoute() {
    const userRouter = express.Router();
    const redisClient = await connectRedis();

    userRouter.get("/information", async (req, res) => {
        const cachedProfile = await getCachedProfile(redisClient, req.user.username);
        if (cachedProfile) {
            res.status(200).json({
                code: 1,
                success: true,
                message: "success",
                data: cachedProfile,
            });
            return
        }
        const username = req.user.username;
        const result = await pool.query(
            "SELECT username, avatar_url FROM users WHERE username = $1",
            [username]
        );
        const user = result.rows[0];
        if (!user) {
            res.status(404).json({
                code: 0,
                success: false,
                message: "user not found",
            });
            return;
        }

        // avatarUrl 可能为 null，表示尚未上传过头像
        res.status(200).json({
            code: 1,
            success: true,
            message: "success",
            data: {
                username: user.username,
                avatarUrl: user.avatar_url,
            },
        });
        await setCachedProfile(redisClient, username, {
            username: user.username,
            avatarUrl: user.avatar_url,
        });
    });

    userRouter.post(
        "/upload-avatar",
        handleAvatarUpload,
        async (req, res) => {
            // 提到 try 外：catch 里失效缓存时仍要能读到用户名（try 内 const 在 catch 中不可见）
            const username = req.user.username;
            try {
                if (!req.file) {
                    res.status(400).json({
                        code: 0,
                        success: false,
                        message: "请选择要上传的图片文件",
                    });
                    return;
                }
                // 与 express.static 暴露路径一致：根路径下 /uploads/avatars/...
                const avatarUrl = `/uploads/avatars/${req.file.filename}`;

                await pool.query(
                    "UPDATE users SET avatar_url = $1 WHERE username = $2",
                    [avatarUrl, username]
                );

                res.status(200).json({
                    code: 1,
                    success: true,
                    message: "头像上传成功",
                    data: {
                        avatarUrl,
                    },
                });
                await setCachedProfile(redisClient, username, {
                    username: username,
                    avatarUrl: avatarUrl,
                });
            } catch (error) {
                // 任一步失败都可能让「库已更新但缓存仍是旧头像」或留下错误状态；清掉 profile 缓存，下次 GET 从 DB 拉最新
                await clearCachedProfile(redisClient, username);
                res.status(500).json({
                    code: 0,
                    success: false,
                    message: error.message,
                });
            }
        }
    );

    return userRouter;
}