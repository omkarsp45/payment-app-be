"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = userMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function userMiddleware(req, res, next) {
    const token = req.headers.token;
    if (typeof token !== "string") {
        res.status(401).json({ message: "You have not logged in before" });
    }
    else {
        const decodedToken = jsonwebtoken_1.default.verify(token, process.env.AUTH_KEY);
        const email = decodedToken.email;
        if (email) {
            req.body.email = email;
            next();
        }
        else {
            res.status(401).json({
                status: false,
                message: "Token Expired or Invalid Token",
            });
        }
    }
}
