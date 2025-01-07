import express from 'express';
import { userLogin } from '../controllers/authController';


const router = express.Router();


router.post('/login', userLogin);

export { router as authRouter }


