import express from 'express';
import { Account } from './db';

const router = express.Router();

router.get('/balance', async function (req, res) {
    const userId = req.body.userId;
    try {
        const account = await Account.findOne({ _id: userId });
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
    const userId = req.body.userId;
    const receiverId = req.body.receiverId;
    const amount = req.body.amount;
    try {
        const account = await Account.findOne({ userId });
        if (!account) {
            res.status(400).json({
                status: false,
                message: 'user not found'
            }); return;
        }
        if (account.balance < amount * 100) {
            res.status(400).json({
                status: false,
                message: 'insufficient balance'
            }); return;
        }

    } catch (error) {
        res.status(503).json({
            status: false,
            message: 'something went wrong'
        })
    }
});

export default router;