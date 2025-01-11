import { Schema, model } from "mongoose";

const userSchema = new Schema({
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true }
})

export const User = model("User", userSchema);