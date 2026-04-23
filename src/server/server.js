import express from "express";
import cors from "cors";

import { createAuthRoute } from "./router/auth.js";
import { createUserRoute } from "./router/user.js";
import { verifyToken } from "./middleware/verify.js";

import { testDbConnection } from "./db/index.js";

const app = express();

app.use(cors());

app.use(express.json());

// 用户上传的头像目录，URL 形如 /uploads/avatars/xxx.png
app.use("/uploads", express.static("uploads"));
// 可选：托管项目根下其它静态资源（如本地打开的 HTML 演示页）
app.use(express.static("."));

app.use("/api/auth", createAuthRoute())

app.use("/api/user", verifyToken, createUserRoute())

await testDbConnection();

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});