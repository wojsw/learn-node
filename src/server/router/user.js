import express from "express";
export function createUserRoute() {
    const userRouter = express.Router();

    userRouter.get("/information", (req, res) => {
        res.status(200).json({
            code: 1,
            success: true,
            message: "success",
            data: {
                username: '金生旺',
                email: 'jin19980326@gmail.com',
            }
        })
    })

    return userRouter;
}