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
const db_1 = require("./db");
const mongoose_1 = __importDefault(require("mongoose"));
const router = express_1.default.Router();
router.get('/balance', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const userId = req.body.userId;
        try {
            const account = yield db_1.Account.findOne({ userId: userId });
            if (account) {
                res.status(200).json({
                    status: true,
                    balance: (account === null || account === void 0 ? void 0 : account.balance) / 100
                });
            }
            else {
                res.status(400).json({
                    status: false,
                    message: 'You are not connected to bank'
                });
            }
        }
        catch (error) {
            res.status(503).json({
                status: false,
                message: 'something went wrong'
            });
        }
    });
});
router.post('/transfer', function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const session = yield mongoose_1.default.startSession();
        session.startTransaction();
        const { userId, receiverId, amount } = req.body;
        try {
            const account = yield db_1.Account.findOne({ userId }).session(session);
            if (!account) {
                yield session.abortTransaction();
                res.status(400).json({
                    status: false,
                    message: 'user not found'
                });
                return;
            }
            if (account.balance < amount * 100) {
                yield session.abortTransaction();
                res.status(400).json({
                    status: false,
                    message: 'insufficient balance'
                });
                return;
            }
            const receiver = yield db_1.Account.findOne({ userId: receiverId }).session(session);
            if (!receiver) {
                yield session.abortTransaction();
                res.status(400).json({
                    status: false,
                    message: 'receiver not found'
                });
                return;
            }
            yield db_1.Account.updateOne({ userId: userId }, { $inc: { balance: -amount * 100 } }).session(session);
            yield db_1.Account.updateOne({ userId: receiverId }, { $inc: { balance: amount * 100 } }).session(session);
            yield session.commitTransaction();
            res.json({
                message: "Transfer successful"
            });
        }
        catch (error) {
            yield session.abortTransaction();
            res.status(503).json({
                status: false,
                message: 'Transfer failed'
            });
        }
    });
});
exports.default = router;
