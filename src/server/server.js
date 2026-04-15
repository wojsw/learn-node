import express from "express";
import cors from "cors";

import { createAuthRoute } from "./router/auth.js";
import { createUserRoute } from "./router/user.js";
import { verifyToken } from "./middleware/auth.js";

const app = express();

app.use(cors());

app.use(express.json());

app.use("/api/auth", createAuthRoute())

app.use("/api/user", verifyToken, createUserRoute())

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});