import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { User } from '../models/authModels';

dotenv.config();


// Login endpoint
export const userLogin = async (req: Request, res: Response) => {
    // #swagger.tags = ['Auth']
    // #swagger.summary = 'User Login'
    // #swagger.description = 'This endpoint is used to login the user.'
    try {
        const { user_name, password } = req.body;
        if (!user_name || !password) {
            return res.status(400).json({
                succeed: false,
                code: 400,
                status: "Bad Request",
                message: "Username and password are required.",
            });
        }
        const user = await User.findOne({ user_name, is_active: 1 });
        if (!user) {
            return res.status(401).json({
                succeed: false,
                code: 401,
                status: "Unauthorized",
                message: "User not found or inactive",
            });
        }
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({
                succeed: false,
                code: 401,
                status: "Unauthorized",
                message: "Invalid Password!",
            });
        }
        const jwtSecret = process.env.PASS_ENC_KEY as string;
        const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET as string;
        if (!jwtSecret || !jwtRefreshSecret) {
            return res.status(500).json({
                succeed: false,
                code: 500,
                status: "Internal Server Error",
                message: "JWT secrets are not set",
            });
        }
        const accessToken = jwt.sign({
            user_id: user.user_id,
            user_name: user.user_name,
            email_address: user.email_address,
        }, jwtSecret, { expiresIn: "5m" }
        );
        return res.status(200).json({
            succeed: true,
            code: 200,
            status: "Login Successful",
            message: "User logged in successfully",
            accessToken,
        });
    } catch (error) {
        return res.status(500).json({
            succeed: false,
            code: 500,
            status: "Internal Server Error",
            message: error instanceof Error ? error.message : "Internal Server error!",
        });
    }
}