import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/jwt.js";
export function verifyToken(req, res, next) {
    const authorization = req.headers.authorization;
    if (!authorization) {
        res.status(401).json({
            code: 0,
            success: false,
            message: "Unauthorized"
        })

        return
    }
    console.log('authorization = ', authorization);
    const authorizationParts = authorization.split(" ");
    const scheme = authorizationParts[0];
    const token = authorizationParts[1];

    if (scheme !== "Bearer" || !token) {
        res.status(401).json({
            code: 0,
            success: false,
            message: "Unauthorized"
        })
        return
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('decoded = ', decoded);
        // 方便后续路由直接读取当前登录用户
        req.user = decoded

        next()

    } catch (error) {
        res.status(401).json({
            code: 0,
            success: false,
            message: "Unauthorized"
        })
        return
    }
}