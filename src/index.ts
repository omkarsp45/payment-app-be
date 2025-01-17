require('dotenv').config()
import express from 'express';
import cors from 'cors';
import userMiddleware from './middleware'
import accountRouter from './account'
import userRouter from './user'

const app = express();
const router = express.Router();
app.use(express.json());
app.use(cors());

app.use('/user', userRouter);
app.use('/account', userMiddleware, accountRouter);

app.listen(3000, () => {
    console.log("listening on 3000");
})