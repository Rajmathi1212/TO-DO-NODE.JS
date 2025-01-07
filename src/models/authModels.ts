import mongoose from "mongoose";

export interface IUser extends mongoose.Document {
    user_id: string;
    user_name: string;
    first_name: string;
    last_name: string;
    email_address: string;
    mobile_number: string;
    password: string;
    gender: string;
    created_on: string;
    is_active: number;
}

const userSchema = new mongoose.Schema<IUser>({
    user_id: { type: String, required: true },
    user_name: { type: String, required: true },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email_address: { type: String, required: true },
    mobile_number: { type: String, required: true },
    password: { type: String, required: true },
    gender: { type: String, required: true },
    created_on: { type: String, required: true },
    is_active: { type: Number, default: 1 },
});

export const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);
