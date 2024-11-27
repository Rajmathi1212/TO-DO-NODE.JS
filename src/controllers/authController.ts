import express, { Request, Response, NextFunction } from 'express';
import mongoose, { ConnectOptions } from 'mongoose';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { decode } from 'punycode';

dotenv.config();

const app = express();
app.use(express.json());

// MongoDB connection
const DB_URL = process.env.DB_URL as string;
if (!DB_URL) {
    throw new Error('DB_URL environment variable is not set');
}

mongoose.connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    connectTimeoutMS: 30000,
} as ConnectOptions)
    .then(() => console.log('MongoDB connected to todo database'))
    .catch(error => console.error('MongoDB connection error:', error));

const checkDbConnection = (req: Request, res: Response, next: NextFunction) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
            succeed: false,
            code: 503,
            status: 'Service Unavailable',
            message: 'Database not connected. Please try again later.',
        });
    }
    next();
};

app.use(checkDbConnection);

interface IUser extends mongoose.Document {
    user_id: string;
    user_name: string;
    first_name: string;
    last_name: string;
    email_address: string;
    mobile_number: string;
    password: string;
    gender: string;
    created_on: String;
    is_active: number;
}

const userSchema = new mongoose.Schema<IUser>({
    user_id: String,
    user_name: String,
    first_name: String,
    last_name: String,
    email_address: String,
    mobile_number: String,
    password: String,
    gender: String,
    created_on: String,
    is_active: { type: Number, default: 1 }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

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
                status: 'Bad Request',
                message: 'Username and password are required.'
            });
        }
        const user = await User.findOne({ user_name, is_active: 1 });
        if (!user) {
            return res.status(401).json({
                succeed: false,
                code: 401,
                status: 'Unauthorized',
                message: 'User not found or inactive'
            });
        }
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({
                succeed: false,
                code: 401,
                status: 'Unauthorized',
                message: 'Invalid Password!'
            });
        }
        const jwtSecret = process.env.PASS_ENC_KEY as string;
        const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET as string;
        if (!jwtSecret || !jwtRefreshSecret) {
            return res.status(500).json({
                succeed: false,
                code: 500,
                status: 'Internal Server Error',
                message: 'JWT secrets are not set'
            });
        }
        const accessToken = jwt.sign(
            {
                user_id: user.user_id,
                user_name: user.user_name,
                email_address: user.email_address,
            },
            jwtSecret,
            { expiresIn: '5m' }
        );
        const refreshToken = jwt.sign(
            {
                user_id: user.user_id,
            },
            jwtRefreshSecret,
            { expiresIn: '1h' }
        );
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000,
        });
        return res.status(200).json({
            succeed: true,
            code: 200,
            status: 'Login Successful',
            message: 'User logged in successfully',
            accessToken
        });
    } catch (error) {
        return res.status(500).json({
            succeed: false,
            code: 500,
            status: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Internal Server error!'
        });
    }
}
export const refreshToken = async (req: Request, res: Response) => {
    // #swagger.tags = ['Auth']
    // #swagger.summary = 'Refresh Token'
    // #swagger.description = 'This endpoint is used to refresh the access token using the refresh token.'

    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                succeed: false,
                code: 401,
                status: 'Unauthorized',
                message: 'Refresh Token not provided.'
            });
        }

        const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET as string;
        if (!jwtRefreshSecret) {
            return res.status(500).json({
                succeed: false,
                code: 500,
                status: 'Internal Server Error',
                message: 'JWT refresh secret is not set.'
            });
        }

        const decoded = jwt.verify(refreshToken, jwtRefreshSecret) as { user_id: string };
        const user = await User.findById(decoded.user_id);

        if (!user) {
            return res.status(401).json({
                succeed: false,
                code: 401,
                status: 'Unauthorized',
                message: 'User not found or invalid refresh token.'
            });
        }

        const accessToken = jwt.sign(
            {
                user_id: user.user_id,
                user_name: user.user_name,
                email_address: user.email_address,
            },
            process.env.PASS_ENC_KEY as string,
            { expiresIn: '5m' }
        );

        return res.status(200).json({
            succeed: true,
            code: 200,
            status: 'Refresh successful',
            message: 'New access token generated.',
            accessToken
        });
    } catch (error) {
        return res.status(500).json({
            succeed: false,
            code: 500,
            status: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Error processing refresh token.'
        });
    }
};