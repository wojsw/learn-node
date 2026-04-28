import express from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { JWT_SECRET, REFRESH_TOKEN_SECRET } from "../config/jwt.js";
import { pool } from "../db/index.js";
import { connectRedis } from "../../redis/client.js";

const key = (tokenId) => `refresh:${tokenId}`;


export async function createAuthRoute() {
    const authRouter = express.Router();
    const redisClient = await connectRedis();

    authRouter.post("/login", async (req, res) => {
        const tokenId = crypto.randomUUID();
        const params = req.body;

        try {
            const result = await pool.query(
                "SELECT * FROM users WHERE username = $1",
                [params.username]
            )

            console.log('result = ', result);

            if (result.rows.length === 0) {
                res.status(200).json({
                    code: 0,
                    success: false,
                    message: "user not found"
                })
                return
            }
            
            const user = result.rows[0];
            if (user.password !== params.password) {
                res.status(200).json({
                    code: 0,
                    success: false,
                    message: "password incorrect"
                })
                return
            }
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
            redisClient.set(key(tokenId), refreshToken, { EX: 604800 });
            res.status(200).json({
                code: 1,
                success: true,
                message: "success", 
                data: {
                    accessToken: accessToken,
                    refreshToken: refreshToken
                }   
            })
            
        } catch (error) {
            res.status(200).json({
                code: 0,
                success: false,
                message: "failed"
            })
            return
        }
    });

    authRouter.post('/refresh', async(req, res) => {
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
            const refreshToken = await redisClient.get(key(tokenId));
            if (!refreshToken || refreshToken !== authorization) {
                res.status(401).json({
                    code: 0,
                    success: false,
                    message: "refresh token invalid"
                })
                return
            }

            const decoded = jwt.verify(authorization, REFRESH_TOKEN_SECRET);
            const tokenId = decoded.tokenId;
            console.log('refresh token decoded = ', decoded);

            redisClient.del(key(tokenId));

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
            redisClient.set(key(tokenId), newRefreshToken, { EX: 604800 });
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