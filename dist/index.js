"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const middleware_1 = __importDefault(require("./middleware"));
const account_1 = __importDefault(require("./account"));
const user_1 = __importDefault(require("./user"));
const app = (0, express_1.default)();
const router = express_1.default.Router();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use('/user', user_1.default);
app.use('/account', middleware_1.default, account_1.default);
app.listen(3000, () => {
    console.log("listening on 3000");
});
