import multer from "multer";
import path from "path";
import fs from "fs";

/** 头像文件落盘目录（相对进程工作目录，与静态资源 URL 前缀一致） */
const uploadDir = "uploads/avatars";

// 确保上传目录存在，避免 multer 首次写入失败
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // 使用登录用户名 + 时间戳，避免文件名冲突；扩展名取自原始文件
        const ext = path.extname(file.originalname);
        const name = `${req.user.username}_${Date.now()}${ext}`;
        cb(null, name);
    },
});

// 仅允许常见图片 MIME，拒绝可执行脚本等类型
const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        "image/jpg",
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
    ];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("仅支持 jpg / png / gif / webp 图片"), false);
    }
};

/** 单文件「avatar」字段的头像上传中间件工厂结果 */
export const uploadAvatar = multer({
    storage,
    fileFilter,
    limits: {
        /** 单文件大小上限：5MB */
        fileSize: 1024 * 1024 * 5,
    },
});
