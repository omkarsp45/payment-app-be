require('dotenv').config()
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User, Account } from './db'
import userMiddleware from './middleware'

const app = express();
app.use(express.json());
app.use(cors());

const userSchema = z.object({
    firstname: z.string().optional(),
    lastname: z.string().optional(),
    email: z.string().email(),
    password: z.string()
});

app.post('/signup', async function (req, res) {
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

app.post('/signin', async function (req, res) {
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
                email
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

app.put('/update', userMiddleware, async function (req, res) {
    const email = req.body.email;
    const { firstname, lastname, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 8);
        await User.updateOne({ email }, {
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

app.listen(3000, () => {
    console.log("listening on 3000");
})