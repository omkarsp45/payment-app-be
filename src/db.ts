import mongoose, { mongo } from "mongoose";

(async () => {
    await mongoose.connect('mongodb+srv://omkarspatil:BqnWhFkTKZGJQYfV@test.xslxo.mongodb.net/payment-app');
    console.log('connected to db');
})();

const userSchema = new mongoose.Schema({
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true }
})

const accountSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    balance: { type: Number, required: true }
})

export const User = mongoose.model("User", userSchema);
export const Account = mongoose.model("Account", accountSchema);