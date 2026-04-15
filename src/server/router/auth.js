import express from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { JWT_SECRET, REFRESH_TOKEN_SECRET } from "../config/jwt.js";


const refreshTokenMap = new Map();

export function createAuthRoute() {
    const authRouter = express.Router();

    authRouter.post("/login", (req, res) => {
        const tokenId = crypto.randomUUID();
        const params = req.body;

        if (params.username === "admin" && params.password === "123456") {
            const refreshToken = jwt.sign(
                {
                    username: params.username,
                    type: 'refresh',
                    tokenId: tokenId
                },
                REFRESH_TOKEN_SECRET,
                {
                    expiresIn: '7d'
                }
            )
            const accessToken = jwt.sign(
                {
                    username: params.username,
                    type: 'access',
                    tokenId: tokenId
                },
                JWT_SECRET,
                {
                    expiresIn: '1m'
                }
            )
            refreshTokenMap.set(tokenId, refreshToken);
            res.status(200).json({
                code: 1,
                success: true,
                message: "success", 
                data: {
                    accessToken: accessToken,
                    refreshToken: refreshToken
                }   
            })
        } else {
            res.status(200).json({
                code: 0,
                success: false,
                message: "failed"
            })
        }
    });

    authRouter.post('/refresh', (req, res) => {
        const authorization = req.body.authorization;
        if (!authorization) {
            res.status(401).json({
                code: 0,
                success: false,
                message: "refresh token required"
            })
            return
        }

        try {
            const decoded = jwt.verify(authorization, REFRESH_TOKEN_SECRET);
            const tokenId = decoded.tokenId;
            console.log('refresh token decoded = ', decoded);

            refreshTokenMap.delete(tokenId)

            const newRefreshToken = jwt.sign(
                {
                    username: decoded.username,
                    type: 'refresh',
                    tokenId: tokenId
                },
                REFRESH_TOKEN_SECRET,
                {
                    expiresIn: '7d'
                }
            )
            const newAccessToken = jwt.sign(
                {
                    username: decoded.username,
                    type: 'access',
                    tokenId: tokenId
                },
                JWT_SECRET,
                {
                    expiresIn: '1m'
                }
            )
            refreshTokenMap.set(tokenId, newRefreshToken);
            res.status(200).json({
                code: 1,
                success: true, 
                message: "success",
                data: {
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken
                }
            })
        } catch (error) {
            res.status(401).json({
                code: 0,
                success: false,
                message: "refresh token invalid"
            })
            return
        }
    })

    return authRouter;
}