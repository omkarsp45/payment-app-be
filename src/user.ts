import express from 'express';
import { z } from 'zod';
import userMiddleware from './middleware';
import { User, Account } from './db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router();

const userSchema = z.object({
    firstname: z.string().optional(),
    lastname: z.string().optional(),
    email: z.string().email(),
    password: z.string()
});

router.post('/signup', async function (req, res) {
    const user = userSchema.safeParse(req.body);
    if (user.success) {
        const { firstname, lastname, email, password } = user.data;
        try {
            const check = await User.findOne({ email });
            if (check) {
                res.status(400).json({
                    status: false,
                    message: "User already exists",
                });
                return;
            }
        } catch (error) {
            res.status(503).json({
                status: false,
                message: "Something went wrong, try again",
                error: error
            });
            return;
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 8);
            const data = await User.create({
                firstname, lastname, email, password: hashedPassword
            });
            // not going to add payment functionality for now initialize random account balance 
            await Account.create({
                userId: data._id,
                balance: 100000
            })
            res.status(200).json({
                status: true,
                message: "User created successfully",
                data: data,
            });
        } catch (error) {
            res.status(503).json({
                status: false,
                message: "Server error",
                error: error,
            });
        }
    } else {
        res.status(400).json({
            status: false,
            message: "Invalid input",
            error: user.error,
        });
    }
});

router.post('/signin', async function (req, res) {
    const user = userSchema.safeParse(req.body);
    if (user.success) {
        try {
            const { email, password } = user.data;
            const entry = await User.findOne({ email });
            if (!entry) {
                res.status(400).json({
                    status: false,
                    message: "User does not exist, please sign up",
                });
                return;
            }
            // @ts-ignore
            const hashedPassword = entry.password;
            const isMatch = await bcrypt.compare(password, hashedPassword);
            if (!isMatch) {
                res.status(400).json({
                    status: false,
                    message: "Invalid credentials"
                });
                return;
            }
            const generateToken = jwt.sign({
                userId: entry._id
            }, process.env.AUTH_KEY as string);

            res.status(200).json({
                status: true,
                token: generateToken
            });
        } catch (err) {
            res.status(503).json({
                status: false,
                message: "Server error",
                error: err
            });
        }
    } else {
        res.status(400).json({
            status: false,
            message: "Invalid input",
            error: user.error,
        });
    }
});

router.put('/update', userMiddleware, async function (req, res) {
    const userId = req.body.userId;
    const { firstname, lastname, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 8);
        await User.updateOne({ _id: userId }, {
            firstname,
            lastname,
            password: hashedPassword
        })
        res.status(200).json({
            status: true,
            message: "Updated Details"
        })
    } catch (err) {
        res.status(503).json({
            status: false,
            message: "Something went wrong, try again"
        })
    }
})

// share data only if user is logged in
router.get("/search", async (req, res) => {
    const filter = req.query.filter || "";
    try {
        const users = await User.find({
            $or: [{
                firstname: {
                    "$regex": filter
                }
            }, {
                lastname: {
                    "$regex": filter
                }
            }]
        })
        res.json({
            user: users.map(user => ({
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                _id: user._id
            }))
        })
    } catch (err) {
        res.status(503).json({
            status: false,
            message: "Something went wrong, try again"
        })
    }
})

export default router;