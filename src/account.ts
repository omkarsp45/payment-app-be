import express from 'express';
import { Account } from './db';
import mongoose from 'mongoose';

const router = express.Router();

router.get('/balance', async function (req, res) {
    const userId = req.body.userId;
    try {
        const account = await Account.findOne({ userId: userId });
        if (account) {
            res.status(200).json({
                status: true,
                balance: account?.balance / 100
            })
        } else {
            res.status(400).json({
                status: false,
                message: 'You are not connected to bank'
            })
        }
    } catch (error) {
        res.status(503).json({
            status: false,
            message: 'something went wrong'
        })
    }
});

router.post('/transfer', async function (req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();
    const { userId, receiverId, amount } = req.body;
    try {
        const account = await Account.findOne({ userId }).session(session);
        if (!account) {
            await session.abortTransaction();
            res.status(400).json({
                status: false,
                message: 'user not found'
            }); return;
        }
        if (account.balance < amount * 100) {
            await session.abortTransaction();
            res.status(400).json({
                status: false,
                message: 'insufficient balance'
            }); return;
        }
        const receiver = await Account.findOne({ userId: receiverId }).session(session);
        if (!receiver) {
            await session.abortTransaction();
            res.status(400).json({
                status: false,
                message: 'receiver not found'
            }); return;
        }
        await Account.updateOne({ userId: userId }, { $inc: { balance: -amount * 100 } }).session(session);
        await Account.updateOne({ userId: receiverId }, { $inc: { balance: amount * 100 } }).session(session);

        await session.commitTransaction();
        res.json({
            message: "Transfer successful"
        });
    } catch (error) {
        await session.abortTransaction();
        res.status(503).json({
            status: false,
            message: 'Transfer failed'
        })
    }
});

export default router;