"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const db_1 = require("./db");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
function db() {
    return __awaiter(this, void 0, void 0, function* () {
        yield mongoose_1.default.connect('mongodb+srv://omkarspatil:BqnWhFkTKZGJQYfV@test.xslxo.mongodb.net/payment-app');
        console.log('connected to db');
    });
}
db();
const userSchema = zod_1.z.object({
    firstname: zod_1.z.string().optional(),
    lastname: zod_1.z.string().optional(),
    email: zod_1.z.string().email(),
    password: zod_1.z.string()
});
app.post('/signup', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = userSchema.safeParse(req.body);
        if (user.success) {
            const { firstname, lastname, email, password } = user.data;
            try {
                const check = yield db_1.User.findOne({ email });
                if (check) {
                    res.status(400).json({
                        status: false,
                        message: "User already exists",
                    });
                }
            }
            catch (error) {
                res.status(503).json({
                    status: false,
                    message: "Something went wrong, try again",
                    error: error
                });
            }
            try {
                const hashedPassword = yield bcrypt_1.default.hash(password, 8);
                const data = yield db_1.User.create({
                    firstname, lastname, email, password: hashedPassword
                });
                res.status(200).json({
                    status: true,
                    message: "User created successfully",
                    data: data,
                });
            }
            catch (error) {
                res.status(503).json({
                    status: false,
                    message: "Server error",
                    error: error,
                });
            }
        }
        else {
            res.status(400).json({
                status: false,
                message: "Invalid input",
                error: user.error,
            });
        }
    });
});
app.post('/signin', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = userSchema.safeParse(req.body);
        if (user.success) {
            try {
                const { email, password } = user.data;
                const entry = yield db_1.User.findOne({ email });
                if (entry) {
                    res.status(400).json({
                        status: false,
                        message: "User does not exist, please sign up",
                    });
                }
                // @ts-ignore
                const hashedPassword = entry.password;
                const isMatch = bcrypt_1.default.compare(password, hashedPassword);
                if (!isMatch) {
                    res.status(400).json({
                        status: false,
                        message: "Invalid credentials"
                    });
                }
                const generateToken = jsonwebtoken_1.default.sign({
                    firstname: entry === null || entry === void 0 ? void 0 : entry.firstname,
                    lastname: entry === null || entry === void 0 ? void 0 : entry.lastname,
                    email: entry === null || entry === void 0 ? void 0 : entry.email
                }, process.env.AUTH_KEY);
                res.status(200).json({
                    status: true,
                    token: generateToken
                });
            }
            catch (error) {
                res.status(503).json({
                    status: false,
                    message: "Server error",
                    error: error
                });
            }
        }
        else {
            res.status(400).json({
                status: false,
                message: "Invalid input",
                error: user.error,
            });
        }
    });
});
app.listen(3000, () => {
    console.log("listening on 3000");
});
