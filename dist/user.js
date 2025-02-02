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
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const middleware_1 = __importDefault(require("./middleware"));
const db_1 = require("./db");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = express_1.default.Router();
const userSchema = zod_1.z.object({
    firstname: zod_1.z.string().optional(),
    lastname: zod_1.z.string().optional(),
    email: zod_1.z.string().email(),
    password: zod_1.z.string()
});
router.post('/signup', function (req, res) {
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
                    return;
                }
            }
            catch (error) {
                res.status(503).json({
                    status: false,
                    message: "Something went wrong, try again",
                    error: error
                });
                return;
            }
            try {
                const hashedPassword = yield bcrypt_1.default.hash(password, 8);
                const data = yield db_1.User.create({
                    firstname, lastname, email, password: hashedPassword
                });
                // not going to add payment functionality for now initialize random account balance 
                yield db_1.Account.create({
                    userId: data._id,
                    balance: 100000
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
router.post('/signin', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = userSchema.safeParse(req.body);
        if (user.success) {
            try {
                const { email, password } = user.data;
                const entry = yield db_1.User.findOne({ email });
                if (!entry) {
                    res.status(400).json({
                        status: false,
                        message: "User does not exist, please sign up",
                    });
                    return;
                }
                // @ts-ignore
                const hashedPassword = entry.password;
                const isMatch = yield bcrypt_1.default.compare(password, hashedPassword);
                if (!isMatch) {
                    res.status(400).json({
                        status: false,
                        message: "Invalid credentials"
                    });
                    return;
                }
                const generateToken = jsonwebtoken_1.default.sign({
                    userId: entry._id
                }, process.env.AUTH_KEY);
                res.status(200).json({
                    status: true,
                    token: generateToken
                });
            }
            catch (err) {
                res.status(503).json({
                    status: false,
                    message: "Server error",
                    error: err
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
router.put('/update', middleware_1.default, function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const userId = req.body.userId;
        const { firstname, lastname, password } = req.body;
        try {
            const hashedPassword = yield bcrypt_1.default.hash(password, 8);
            yield db_1.User.updateOne({ _id: userId }, {
                firstname,
                lastname,
                password: hashedPassword
            });
            res.status(200).json({
                status: true,
                message: "Updated Details"
            });
        }
        catch (err) {
            res.status(503).json({
                status: false,
                message: "Something went wrong, try again"
            });
        }
    });
});
// share data only if user is logged in
router.get("/search", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const filter = req.query.filter || "";
    try {
        const users = yield db_1.User.find({
            $or: [{
                    firstname: {
                        "$regex": filter
                    }
                }, {
                    lastname: {
                        "$regex": filter
                    }
                }]
        });
        res.json({
            user: users.map(user => ({
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                _id: user._id
            }))
        });
    }
    catch (err) {
        res.status(503).json({
            status: false,
            message: "Something went wrong, try again"
        });
    }
}));
exports.default = router;
