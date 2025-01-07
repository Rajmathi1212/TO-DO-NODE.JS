import constants from '../common/constants';
import { Request, Response } from 'express';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { User } from '../models/userModels';
dotenv.config();

//create user endpoint
export const createUser = async (req: Request, res: Response) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'User Register'
    // #swagger.description = 'This endpoint is used to registering the user.'
    try {
        const { user_name, first_name, last_name, email_address, mobile_number, password, gender } = req.body;

        if (!user_name || !first_name || !last_name || !email_address || !mobile_number || !password || !gender) {
            return res.status(400).json({
                succeed: false,
                code: 400,
                status: 'Bad Request',
                message: 'All fields are required.'
            });
        }

        const existingUser = await User.findOne({ user_name });
        if (existingUser) {
            return res.status(409).json({
                succeed: false,
                code: 409,
                status: 'Conflict',
                message: 'Username already exists.'
            });
        }

        const user_id = uuidv4();
        const hash_password = await bcrypt.hash(password, 10);
        const created_on = new Date();

        const user = new User({
            user_id,
            user_name,
            first_name,
            last_name,
            email_address,
            mobile_number,
            password: hash_password,
            gender,
            created_on
        });

        const result = await user.save();
        if (result) {
            return res.status(200).json({
                succeed: true,
                code: 200,
                status: 'Registration successful',
                message: 'User registered successfully'
            });
        }
    } catch (error) {
        return res.status(500).json({
            succeed: false,
            code: 500,
            status: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Error processing registration.',
        });
    }
};
// Get all user endpoint
export const getAllUser = async (req: Request, res: Response) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Get All the Users.'
    // #swagger.description = 'This endpoint is used to get all the users.'
    try {
        const users = await User.find({ is_active: 1 });

        if (users.length > 0) {
            return res.status(200).json({
                succeed: true,
                code: 200,
                status: constants.API_RESPONSE.API_SUCCESS_DATA,
                data: users,
            });
        } else {
            return res.status(404).json({
                succeed: false,
                code: 404,
                status: constants.API_CODE.API_404,
                message: 'Data not found.',
            });
        }
    } catch (error) {
        return res.status(500).json({
            succeed: false,
            code: 500,
            status: constants.API_CODE.API_500,
            message: error.message || 'Internal Server Error.',
        });
    }
};

// Update user endpoint
export const updateUser = async (req: Request, res: Response) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Update Users'
    // #swagger.description = 'This endpoint is used to Update all the users.'
    try {
        const { user_id, user_name, first_name, last_name, email_address, mobile_number, gender } = req.body;
        if (!user_id) {
            return res.status(400).json({
                succeed: false,
                code: 400,
                status: constants.API_CODE.API_400,
                message: 'User ID is required.',
            });
        }

        const updated_on = new Date();

        const updateData: any = {};
        if (user_name) updateData.user_name = user_name;
        if (first_name) updateData.first_name = first_name;
        if (last_name) updateData.last_name = last_name;
        if (email_address) updateData.email_address = email_address;
        if (mobile_number) updateData.mobile_number = mobile_number;
        if (gender) updateData.gender = gender;
        updateData.updated_on = updated_on;

        const result = await User.updateOne({ user_id }, { $set: updateData });

        if (result.modifiedCount > 0) {
            return res.status(200).json({
                succeed: true,
                code: 200,
                status: constants.API_RESPONSE.API_UPDATED_DATA,
                data: result,
            });
        } else if (result.matchedCount === 0) {
            return res.status(404).json({
                succeed: false,
                code: 404,
                status: constants.API_CODE.API_404,
                message: 'User not found.',
            });
        } else {
            return res.status(404).json({
                succeed: false,
                code: 404,
                status: constants.API_CODE.API_404,
                message: 'Data not updated, try after some time.',
            });
        }
    } catch (error) {
        return res.status(500).json({
            succeed: false,
            code: 500,
            status: constants.API_CODE.API_500,
            message: error.message || 'Internal server error',
        });
    }
};

// Get user By Id
export const getUserById = async (req: Request, res: Response) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Get the Users By Id.'
    // #swagger.description = 'This endpoint is used to get the users by Id.'

    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({
                succeed: false,
                code: 400,
                status: "Bad Request",
                message: "User ID is required.",
            });
        }
        const user = await User.findOne({ user_id: userId, is_active: 1 });
        if (!user) {
            return res.status(404).json({
                succeed: false,
                code: 404,
                status: "Not Found",
                message: "User not found or inactive.",
            });
        }
        return res.status(200).json({
            succeed: true,
            code: 200,
            status: "Success",
            user,
        });
    } catch (error) {
        return res.status(500).json({
            succeed: false,
            code: 500,
            status: "Internal Server Error",
            message: error instanceof Error ? error.message : "Error retrieving user by ID.",
        });
    }
}

//delete user endpoint
export const deleteUser = async (req: Request, res: Response) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Delete Users'
    // #swagger.description = 'This endpoint is used to delete a specific user by user_id.'
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({
                succeed: false,
                code: 400,
                status: 'Bad Request',
                message: 'User ID is required.'
            });
        }
        const user = await User.findOne({ user_id: userId });
        if (!user) {
            return res.status(404).json({
                succeed: false,
                code: 404,
                status: 'Not Found',
                message: 'User not found.'
            });
        }
        await User.deleteOne({ user_id: userId });
        return res.status(200).json({
            succeed: true,
            code: 200,
            status: 'OK',
            message: 'User deleted successfully.'
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            succeed: false,
            code: 500,
            status: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Error deleting user.'
        });
    }
};



