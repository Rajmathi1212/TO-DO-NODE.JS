import express from 'express';
import { refreshToken, userLogin } from '../controllers/authController';


const router = express.Router();


router.post('/login', userLogin);
router.post('/refresh', refreshToken);

export { router as authRouter }


