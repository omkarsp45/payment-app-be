import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

export default function userMiddleware(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.token;
    if (typeof token !== "string") {
        res.status(401).json({ message: "You have not logged in before" })
    } else {
        const decodedToken = jwt.verify(token, process.env.AUTH_KEY as string) as jwt.JwtPayload;
        const email = decodedToken.email;
        if (email) {
            req.body.email = email;
            next();
        } else {
            res.status(401).json({
                status: false,
                message: "Token Expired or Invalid Token",
            })
        }
    }
}