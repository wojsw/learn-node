import express from "express";
import { uploadAvatar } from "../middleware/upload.js";
import { pool } from "../db/index.js";

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

export function createUserRoute() {
    const userRouter = express.Router();

    userRouter.get("/information", async (req, res) => {
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
    });

    userRouter.post(
        "/upload-avatar",
        handleAvatarUpload,
        async (req, res) => {
            try {
                if (!req.file) {
                    res.status(400).json({
                        code: 0,
                        success: false,
                        message: "请选择要上传的图片文件",
                    });
                    return;
                }

                const username = req.user.username;
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
            } catch (error) {
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